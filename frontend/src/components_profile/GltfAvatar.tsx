/**
 * 通用 3D 形象组件 —— 支持 GLB 内置动画 + 外部 FBX 动画注入
 *
 * 设计：
 * - useGLTF 加载 .glb（drei 内置缓存）
 * - extraAnimations 异步加载 FBX，剥离 mesh 只取 AnimationClip
 * - useAnimations 合并所有 clip，挂在 clonedScene 骨骼上
 *
 * 关键正确做法（之前踩了一堆坑）：
 * - clone 用 SkeletonUtils.clone，不用 scene.clone（SkinnedMesh 骨骼引用问题）
 * - useAnimations 目标必须是 clonedScene（含骨骼），不能是外层 group
 * - FBX track name 要剥离 "Armature|" 前缀对齐 GLB 骨骼名
 * - FBX 单位是 cm，移除 .position 轨道避免角色被甩飞 + root motion 位移
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { useFrame, useLoader } from '@react-three/fiber';

interface GltfAvatarProps {
  /** .glb 文件 URL（模型本体） */
  url: string;
  /** 整体缩放，默认 1 */
  scale?: number;
  /** 偏移位置，默认 [0,0,0] */
  position?: [number, number, number];
  /** 是否自动旋转，默认 false */
  autoRotate?: boolean;
  /** 要播放的动画名（不传则播放第一个） */
  animationName?: string;
  /** debug：打印 mesh + 动画列表到 console */
  debugMeshes?: boolean;
  /**
   * 外部 .fbx 动画列表（如 Mixamo 的 JumpingDown.fbx）
   * 例：[{ name: 'Jump', url: '/models/JumpingDown.fbx' }]
   */
  extraAnimations?: { name: string; url: string }[];
  /** 角色阴影下方光环颜色（不传则不显示） */
  haloColor?: string;
  /** 模型整体透明度（0~1），默认 1（不透明） */
  opacity?: number;
}

const GltfAvatar: React.FC<GltfAvatarProps> = ({
  url,
  scale = 1,
  position = [0, 0, 0],
  autoRotate = false,
  animationName,
  debugMeshes = false,
  extraAnimations,
  haloColor,
  opacity = 1,
}) => {
  const isFbx = url.toLowerCase().endsWith('.fbx');

  // GLB 加载（始终调用——Hooks 不能条件调用）
  const gltfResult = useGLTF(isFbx ? '/models/Michelle.glb' : url);
  // FBX 加载
  const fbxResult = useLoader(
    FBXLoader,
    isFbx ? url : '/models/JumpingDown.fbx',
  ) as THREE.Group;

  const groupRef = useRef<THREE.Group>(null);

  // 根据后缀选择实际使用的 scene 和 animations
  // FBX：不做 SkeletonUtils.clone（FBX clone 后骨骼引用容易断裂），直接用原始 group
  // GLB：用 SkeletonUtils.clone（支持多实例）
  const clonedScene = useMemo(() => {
    if (isFbx) {
      // FBX 直接使用（跳一跳里 P2 只有 1 个实例，不需要 clone）
      return fbxResult;
    }
    return SkeletonUtils.clone(gltfResult.scene) as THREE.Group;
  }, [isFbx, fbxResult, gltfResult.scene]);

  const builtinAnims = useMemo(
    () => (isFbx ? (fbxResult.animations ?? []) : gltfResult.animations),
    [isFbx, fbxResult, gltfResult],
  );

  /** 异步加载 FBX 动画，剥离 mesh 只取 AnimationClip */
  const [extraClips, setExtraClips] = useState<THREE.AnimationClip[]>([]);
  useEffect(() => {
    if (!extraAnimations || extraAnimations.length === 0) {
      setExtraClips([]);
      return;
    }
    let canceled = false;
    const loader = new FBXLoader();
    Promise.all(
      extraAnimations.map(
        (item) =>
          new Promise<THREE.AnimationClip | null>((resolve) => {
            loader.load(
              item.url,
              (fbx) => {
                const clip = fbx.animations[0];
                if (!clip) {
                  console.warn(`[GltfAvatar] ${item.url} 没有动画 clip`);
                  resolve(null);
                  return;
                }
                clip.name = item.name;
                // 1) 剥离 "Armature|" 等前缀，让 track 名匹配 GLB 骨骼
                clip.tracks.forEach((t) => {
                  if (t.name.includes('|')) {
                    t.name = t.name.split('|').pop() || t.name;
                  }
                });
                // 2) 处理轨道：
                //    a) 非 Hips 的 .position 全部移除（避免 cm/m 单位差导致骨骼飞走）
                //    b) Hips.position：X/Z 清零 + Y 用"相对首帧的差值×0.01"（cm→m）
                //       —— 关键：直接用绝对 Y×0.01 ≈ 0.95m，叠加到 Michelle 默认 Hips 位置上会让腰陷地下
                //       用差值法保留 Y 起伏变化但不破坏初始 Hips 高度
                //    c) Hips.quaternion 移除：避免 Mixamo Hips 带的 90° 旋转把角色甩躺
                const isJumpAnim = item.name.toLowerCase().includes('jump');
                const beforeCount = clip.tracks.length;
                clip.tracks = clip.tracks.filter((t) => {
                  const isHips = t.name.toLowerCase().includes('hips');
                  // Hips quaternion：只有 Jump 类动画才丢弃（舞蹈需要保留旋转）
                  if (isHips && t.name.endsWith('.quaternion') && isJumpAnim) return false;
                  if (!t.name.endsWith('.position')) return true;
                  if (!isHips) return false;
                  // Hips position 差值法：每帧 Y 减去首帧 Y，再缩放
                  // 0.005 = 缩放因子（FBX 单位 cm，差值 10-30cm → 0.05-0.15m，足够体现起伏又不至于飞太高）
                  const HIPS_Y_SCALE = 0.005;
                  const values = t.values as Float32Array;
                  const baseY = values[1]; // 首帧 Y
                  for (let i = 0; i < values.length; i += 3) {
                    values[i] = 0;
                    values[i + 1] = (values[i + 1] - baseY) * HIPS_Y_SCALE;
                    values[i + 2] = 0;
                  }
                  return true;
                });
                console.log(
                  `[GltfAvatar] FBX 动画 "${item.name}" 加载 ✅ tracks: ${beforeCount} → ${clip.tracks.length}`,
                );
                resolve(clip);
              },
              undefined,
              (err) => {
                console.error(`[GltfAvatar] FBX 加载失败 ${item.url}:`, err);
                resolve(null);
              },
            );
          }),
      ),
    ).then((results) => {
      if (canceled) return;
      setExtraClips(results.filter((c): c is THREE.AnimationClip => c !== null));
    });
    return () => {
      canceled = true;
    };
  }, [extraAnimations]);

  /** 合并 GLB 内置 + FBX 外部动画 */
  const allAnimations = useMemo(
    () => [...builtinAnims, ...extraClips],
    [builtinAnims, extraClips],
  );

  /** useAnimations 的目标必须是 clonedScene（带骨骼），不能是 group */
  const { actions, names } = useAnimations(allAnimations, clonedScene);

  /** clone material + 打印 mesh 列表 */
  useEffect(() => {
    clonedScene.traverse((child: THREE.Object3D) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      // 克隆 material，让每个 mesh 拥有独立 material（防止共享被误改）
      if (Array.isArray(mesh.material)) {
        mesh.material = mesh.material.map((m) => m.clone());
      } else if (mesh.material) {
        mesh.material = mesh.material.clone();
      }
    });

    if (debugMeshes) {
      console.group('[GltfAvatar] mesh + 动画 列表');
      clonedScene.traverse((child: THREE.Object3D) => {
        const mesh = child as THREE.Mesh;
        if (!mesh.isMesh) return;
        const mat = mesh.material as THREE.MeshStandardMaterial;
        const matName = Array.isArray(mesh.material)
          ? mesh.material.map((m) => m.name).join(', ')
          : mat?.name;
        console.log(
          `  mesh="${mesh.name}"  material="${matName}"  hasMap=${!!mat?.map}`,
        );
      });
      console.log('  可用动画:', allAnimations.map((a) => a.name));
      console.groupEnd();
    }
  }, [clonedScene, debugMeshes, allAnimations]);

  /** 透明度：opacity 变化时遍历所有 mesh material 设置 */
  useEffect(() => {
    clonedScene.traverse((child: THREE.Object3D) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((mat) => {
        if (mat) {
          mat.transparent = opacity < 1;
          mat.opacity = opacity;
          mat.needsUpdate = true;
        }
      });
    });
  }, [clonedScene, opacity]);

  /** 播放动画：切换时其它 action fadeOut，目标 action fadeIn */
  useEffect(() => {
    if (names.length === 0) {
      console.warn('[GltfAvatar] 没有可播放的动画');
      return;
    }
    // 如果指定了 animationName 但还没加载到（extraAnimations 异步），先不播放，等加载完 effect 重跑
    const target = animationName
      ? (names.includes(animationName) ? animationName : null)
      : names[0];
    if (!target) return;
    const nextAction = actions[target];
    if (!nextAction) {
      console.warn(`[GltfAvatar] 找不到动画 "${target}", 可用: [${names.join(', ')}]`);
      return;
    }
    console.log(`[GltfAvatar] 切换动画 → "${target}", 可用: [${names.join(', ')}]`);
    // 其它 action 平滑淡出
    names.forEach((n) => {
      if (n !== target) {
        const a = actions[n];
        if (a && a.isRunning()) a.fadeOut(0.3);
      }
    });
    nextAction.setLoop(THREE.LoopRepeat, Infinity);
    nextAction.clampWhenFinished = false;
    nextAction.timeScale = 1;
    nextAction.reset().fadeIn(0.3).play();
  }, [actions, names, animationName]);

  /** 自旋 */
  useFrame((_, dt) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += dt * 0.5;
    }
  });

  return (
    <group ref={groupRef} position={position} scale={scale}>
      <primitive object={clonedScene} />
      {/* 脚下光环（用于玩家区分 / 角色高光） */}
      {haloColor && (
        <>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
            <ringGeometry args={[0.55, 0.7, 32]} />
            <meshBasicMaterial color={haloColor} transparent opacity={0.85} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
            <circleGeometry args={[0.55, 32]} />
            <meshBasicMaterial color={haloColor} transparent opacity={0.25} />
          </mesh>
          {/* 角色背后偏色 rim light */}
          <pointLight
            color={haloColor}
            intensity={1.2}
            distance={3}
            position={[0, 1.2, -0.8]}
          />
        </>
      )}
    </group>
  );
};

export default GltfAvatar;
