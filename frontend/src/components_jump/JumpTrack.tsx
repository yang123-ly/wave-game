/**
 * 跳一跳赛道：20 块浮空板沿 -Z 方向延伸，每 5 块板按正弦曲线左右摆动
 * - 普通板：草地绿顶 + 紫岩石底
 * - 终点板：金色顶 + 旗杆
 */
import React, { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useRef } from 'react';
import {
  TOTAL_PLATFORMS,
  getPlatformPosition,
} from '../engine_jump/constants';
import { GRASS_COLOR, ROCK_COLOR } from '../engine3d/constants';

const PLATFORM_SIZE: [number, number, number] = [2.2, 0.5, 2.2];

/** 格子风格调色板——每个格子根据索引选不同颜色 */
const PLATFORM_COLORS = [
  '#86efac', // 薄荷绿
  '#93c5fd', // 天蓝
  '#fca5a5', // 浅珊瑚
  '#fde68a', // 暖黄
  '#c4b5fd', // 薰衣草紫
  '#fdba74', // 橘粉
  '#67e8f9', // 青蓝
  '#f9a8d4', // 粉红
  '#a5f3fc', // 冰蓝
  '#bef264', // 青柠
];

const PILLAR_COLORS = [
  '#6b7280', // 灰岩
  '#78716c', // 棕岩
  '#64748b', // 蓝灰岩
  '#a1a1aa', // 银灰
  '#92400e', // 暗棕
];

interface PlatformProps {
  position: [number, number, number];
  index: number;
  isGoal?: boolean;
}

const Platform: React.FC<PlatformProps> = ({ position, index, isGoal }) => {
  const [w, h, d] = PLATFORM_SIZE;
  const topColor = isGoal ? '#fde68a' : PLATFORM_COLORS[index % PLATFORM_COLORS.length];
  const pillarColor = PILLAR_COLORS[index % PILLAR_COLORS.length];
  // 根据索引微调高度和旋转，增加视觉变化
  const scaleVariation = 0.9 + (((index * 7) % 10) / 10) * 0.2; // 0.9 ~ 1.1
  return (
    <group position={position}>
      <mesh receiveShadow castShadow>
        <boxGeometry args={[w * scaleVariation, h, d * scaleVariation]} />
        <meshStandardMaterial
          color={topColor}
          roughness={0.7}
          emissive={isGoal ? '#fbbf24' : topColor}
          emissiveIntensity={isGoal ? 0.3 : 0.05}
        />
      </mesh>
      {/* 底部岩石支柱 */}
      <mesh position={[0, -h / 2 - 0.6, 0]}>
        <boxGeometry args={[w * 0.85 * scaleVariation, 1.2, d * 0.85 * scaleVariation]} />
        <meshStandardMaterial color={pillarColor} roughness={1} />
      </mesh>
    </group>
  );
};

/** 终点旗杆 */
const GoalFlag: React.FC<{ position: [number, number, number] }> = ({
  position,
}) => {
  const flagRef = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (flagRef.current) {
      flagRef.current.rotation.y = Math.sin(Date.now() * 0.003) * 0.2;
    }
  });
  return (
    <group position={[position[0], position[1] + 0.8, position[2]]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.06, 0.06, 2.4, 8]} />
        <meshStandardMaterial color="#9ca3af" />
      </mesh>
      <mesh ref={flagRef} position={[0.5, 0.9, 0]} castShadow>
        <boxGeometry args={[1, 0.6, 0.04]} />
        <meshStandardMaterial
          color="#fbbf24"
          emissive="#facc15"
          emissiveIntensity={0.5}
        />
      </mesh>
    </group>
  );
};

const JumpTrack: React.FC = () => {
  const platforms = useMemo(() => {
    const items: React.ReactNode[] = [];
    for (let i = 0; i < TOTAL_PLATFORMS; i++) {
      const pos = getPlatformPosition(i);
      const isGoal = i === TOTAL_PLATFORMS - 1;
      items.push(<Platform key={i} index={i} position={pos} isGoal={isGoal} />);
    }
    return items;
  }, []);

  const goalPos = useMemo(
    () => getPlatformPosition(TOTAL_PLATFORMS - 1),
    [],
  );

  return (
    <group>
      {platforms}
      <GoalFlag position={goalPos} />
    </group>
  );
};

export default JumpTrack;
