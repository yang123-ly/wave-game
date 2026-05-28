/**
 * 浪尖踏歌 - 海盗主题赛道
 * 使用 Kenney Pirate Kit 3D 模型：木质平台 + 随机装饰物 + 海盗旗终点
 */
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { TOTAL_PLATFORMS, getWavePlatformPosition } from '../engine_wave/constants';

/* ============ 模型路径 ============ */
/** 棋格子：木码头和沙滩随机交替 */
const DOCK_MODEL = '/models/pirate/structure-platform-dock.glb';
const SAND_MODEL = '/models/pirate/patch-sand-foliage.glb';

/** 装饰物模型（放在平台旁边做点缀） */
const DECO_MODELS = [
  '/models/pirate/barrel.glb',
  '/models/pirate/chest.glb',
  '/models/pirate/crate.glb',
  '/models/pirate/cannon.glb',
  '/models/pirate/rocks-a.glb',
  '/models/pirate/rocks-b.glb',
  '/models/pirate/palm-bend.glb',
];

const FLAG_MODEL = '/models/pirate/flag-pirate-high.glb';
const SHIP_MODEL = '/models/pirate/ship-pirate-small.glb';

/** 预加载所有模型 */
[DOCK_MODEL, SAND_MODEL, FLAG_MODEL, SHIP_MODEL, ...DECO_MODELS].forEach((url) => {
  useGLTF.preload(url);
});

/** 使用 index 做稳定的伪随机 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

/* ============ 单个平台格子 ============ */
interface PlatformProps {
  index: number;
  baseX: number;
  baseZ: number;
  isStart: boolean;
  isGoal: boolean;
}

const PiratePlatform: React.FC<PlatformProps> = ({ index, baseX, baseZ, isStart, isGoal }) => {
  const groupRef = useRef<THREE.Group>(null);

  // 起点用沙滩，其他格子木码头和沙滩随机交替
  const platformUrl = isStart
    ? SAND_MODEL
    : seededRandom(index + 77) > 0.5 ? DOCK_MODEL : SAND_MODEL;
  const { scene: platformScene } = useGLTF(platformUrl);
  const platformClone = useMemo(() => platformScene.clone(), [platformScene]);

  // 装饰物（70% 概率在平台旁边放一个装饰物）
  const decoUrl = useMemo(() => {
    const rand = seededRandom(index + 42);
    if (rand > 0.7) return null;
    const decoIndex = Math.floor(seededRandom(index + 100) * DECO_MODELS.length);
    return DECO_MODELS[decoIndex];
  }, [index]);

  // 终点旗帜
  const flagResult = useGLTF(FLAG_MODEL);
  const flagClone = useMemo(() => flagResult.scene.clone(), [flagResult.scene]);

  // 起点小船
  const shipResult = useGLTF(SHIP_MODEL);
  const shipClone = useMemo(() => shipResult.scene.clone(), [shipResult.scene]);

  useFrame(() => {
    if (!groupRef.current) return;
    const t = performance.now() * 0.001;
    // 轻微上下浮动
    groupRef.current.position.set(
      baseX,
      Math.sin(t * 0.8 + index * 0.9) * 0.2,
      baseZ,
    );
  });

  // 根据 index 做旋转变化让赛道不那么单调
  const rotY = seededRandom(index + 7) * Math.PI * 2;
  const platformScale = 2.0;

  return (
    <group ref={groupRef}>
      {/* 主平台 */}
      <primitive
        object={platformClone}
        scale={platformScale}
        rotation={[0, rotY, 0]}
        castShadow
        receiveShadow
      />

      {/* 装饰物 */}
      {decoUrl && <DecoItem url={decoUrl} index={index} />}

      {/* 终点：海盗旗 */}
      {isGoal && (
        <primitive
          object={flagClone}
          scale={2.5}
          position={[0, 0.3, 0]}
        />
      )}

      {/* 起点：小海盗船（停在沙滩旁边） */}
      {isStart && (
        <primitive
          object={shipClone}
          scale={1.5}
          position={[-10, -0.3, 7]}
          rotation={[0, Math.PI / 3, 0]}
        />
      )}
    </group>
  );
};

/** 装饰物子组件（放在平台旁边，不在平台上） */
const DecoItem: React.FC<{ url: string; index: number }> = ({ url, index }) => {
  const { scene } = useGLTF(url);
  const clone = useMemo(() => scene.clone(), [scene]);
  // 偏移到平台旁边（6~10 单位距离）
  const angle = seededRandom(index + 200) * Math.PI * 2;
  const dist = 6.0 + seededRandom(index + 300) * 4.0;
  const offsetX = Math.cos(angle) * dist;
  const offsetZ = Math.sin(angle) * dist;
  const rotY = seededRandom(index + 400) * Math.PI * 2;
  const decoScale = 1.8 + seededRandom(index + 500) * 0.8;

  return (
    <primitive
      object={clone}
      scale={decoScale}
      position={[offsetX, 0, offsetZ]}
      rotation={[0, rotY, 0]}
    />
  );
};

/* ============ 赛道主组件 ============ */
const WaveTrack: React.FC = () => {
  const platforms = useMemo(() => {
    const items: React.ReactNode[] = [];
    for (let i = 0; i < TOTAL_PLATFORMS; i++) {
      const [x, , z] = getWavePlatformPosition(i);
      items.push(
        <PiratePlatform
          key={i}
          index={i}
          baseX={x}
          baseZ={z}
          isStart={i === 0}
          isGoal={i === TOTAL_PLATFORMS - 1}
        />,
      );
    }
    return items;
  }, []);

  return <group>{platforms}</group>;
};

export default WaveTrack;
