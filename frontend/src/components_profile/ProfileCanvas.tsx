/**
 * 个人主页 3D 画布 —— 明亮工作室风格
 * - 浅蓝白渐变背景 + 柔和雾气
 * - 摄影棚三点光 + 半球天光，全身均匀照亮无暗面
 * - 浅色地板 + 粉/蓝双霓虹环点缀
 * - lil-gui 调试面板
 */
import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import GUI from 'lil-gui';
import GltfAvatar from './GltfAvatar';

interface ProfileCanvasProps {
  modelUrl: string;
  /** 整体缩放 */
  scale?: number;
  /** debug：打印 mesh 列表 */
  debugMeshes?: boolean;
  /** 要播放的动画名（不传则播放第一个） */
  animationName?: string;
  /** 外部 .fbx 动画列表（如 JumpingDown.fbx） */
  extraAnimations?: { name: string; url: string }[];
  /** 模型 Y 偏移（FBX 模型可能需要向上抬升到圆盘上） */
  positionY?: number;
}

const ProfileCanvas: React.FC<ProfileCanvasProps> = ({
  modelUrl,
  scale = 1.6,
  debugMeshes = false,
  animationName,
  extraAnimations,
  positionY = 0,
}) => {
  /* ============ lil-gui 调试面板 ============ */
  const guiRef = useRef<GUI | null>(null);
  const [debugParams, setDebugParams] = useState({
    scale,
    positionY,
  });

  useEffect(() => {
    setDebugParams({ scale, positionY });
  }, [scale, positionY]);

  useEffect(() => {
    const gui = new GUI({ title: '🎛️ 模型调试' });
    gui.domElement.style.position = 'absolute';
    gui.domElement.style.top = '8px';
    gui.domElement.style.right = '8px';
    gui.domElement.style.zIndex = '1000';

    const params = { scale, positionY };
    gui.add(params, 'scale', 0.001, 3, 0.001).name('缩放').onChange((v: number) => {
      setDebugParams((p) => ({ ...p, scale: v }));
    });
    gui.add(params, 'positionY', -2, 2, 0.01).name('Y 偏移').onChange((v: number) => {
      setDebugParams((p) => ({ ...p, positionY: v }));
    });

    guiRef.current = gui;
    return () => {
      gui.destroy();
      guiRef.current = null;
    };
  }, [scale, positionY]);
  const containerRef = useRef<HTMLDivElement>(null);

  // 把 gui DOM 挂到容器内
  useEffect(() => {
    if (containerRef.current && guiRef.current) {
      containerRef.current.appendChild(guiRef.current.domElement);
    }
  });

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        /* CSS 渐变背景：从顶部天空蓝到底部接近白，比 three Canvas 单色更柔和 */
        background:
          'radial-gradient(ellipse at 50% 30%, #ffffff 0%, #e0f0ff 35%, #c9deff 100%)',
      }}
    >
      <Canvas
        shadows
        camera={{ position: [0, 1.6, 4.5], fov: 40 }}
        gl={{
          antialias: true,
          alpha: true, // 透出 CSS 背景
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
        }}
        dpr={[1, 2]}
      >
        {/* 浅色雾气，让远景渐隐却不发暗 */}
        <fog attach="fog" args={['#e6f1ff', 10, 22]} />

        {/* ============ 灯光（摄影棚明亮风） ============ */}
        {/* 1. 强环境光，整体提亮 */}
        <ambientLight intensity={0.85} color="#ffffff" />

        {/* 2. 主光 key light：右上方，暖白色 */}
        <directionalLight
          position={[5, 8, 5]}
          intensity={1.6}
          color="#fff5e6"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-3}
          shadow-camera-right={3}
          shadow-camera-top={3}
          shadow-camera-bottom={-3}
          shadow-camera-near={0.1}
          shadow-camera-far={20}
          shadow-bias={-0.0005}
        />

        {/* 3. 副光 fill light：左侧偏冷，柔化暗面 */}
        <directionalLight position={[-4, 4, 2]} intensity={0.8} color="#e0eaff" />

        {/* 4. 轮廓光 rim light：背后偏粉，勾出人物边缘 */}
        <directionalLight position={[0, 3, -5]} intensity={0.5} color="#ffd5e5" />

        {/* 5. 半球天光：天蓝→地面浅米，模拟室外散射 */}
        <hemisphereLight args={['#cde7ff', '#fff8e7', 0.5]} />

        {/* ============ 地板 + 装饰环 ============ */}
        {/* 浅色阴影地板 */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <circleGeometry args={[3, 64]} />
          <meshStandardMaterial color="#f5f8ff" metalness={0.1} roughness={0.85} />
        </mesh>

        {/* 内圈：粉色 */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <ringGeometry args={[2.6, 2.72, 64]} />
          <meshBasicMaterial color="#ff8ab4" side={THREE.DoubleSide} transparent opacity={0.85} />
        </mesh>
        {/* 外圈：蓝色 */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[2.85, 2.95, 64]} />
          <meshBasicMaterial color="#5aa6ff" side={THREE.DoubleSide} transparent opacity={0.7} />
        </mesh>

        {/* ============ GLB 模型 ============ */}
        <Suspense fallback={null}>
          <GltfAvatar
            url={modelUrl}
            scale={debugParams.scale}
            position={[0, debugParams.positionY, 0]}
            debugMeshes={debugMeshes}
            animationName={animationName}
            extraAnimations={extraAnimations}
          />
        </Suspense>

        {/* 相机控制 */}
        <OrbitControls
          enablePan={false}
          minDistance={3}
          maxDistance={8}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2}
          target={[0, 1.2, 0]}
        />
      </Canvas>
    </div>
  );
};

export default ProfileCanvas;
