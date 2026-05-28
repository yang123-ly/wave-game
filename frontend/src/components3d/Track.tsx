/**
 * 整条跑酷赛道（6 段拼接）
 * - 每段是一个独立的 RigidBody(fixed) 集合
 * - VanishingSegment 实现真实的周期消失（启用/禁用 collider + 透明度切换）
 * - GearSegment 的旋转齿轮带有 fixed 物理碰撞，撞到 → rapier 自动反弹（结合玩家 RigidBody.linearDamping 形成"击退感"）
 * - GoalSegment 使用 Sensor 触发 onIntersectionEnter 上报"到达终点"
 */
import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider, CylinderCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { GRASS_COLOR, ROCK_COLOR, SEGMENT_LENGTH, TOTAL_SEGMENTS } from '../engine3d/constants';
import type { PlayerSide } from '../engine3d/types';

/* ============== 通用浮岛平台 ============== */
interface PlatformProps {
  position: [number, number, number];
  size: [number, number, number];
  color?: string;
}
const Platform: React.FC<PlatformProps> = ({ position, size, color = GRASS_COLOR }) => {
  const [w, h, d] = size;
  return (
    <RigidBody type="fixed" colliders={false} position={position}>
      <CuboidCollider args={[w / 2, h / 2, d / 2]} />
      <mesh receiveShadow castShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
      <mesh position={[0, -h / 2 - 0.6, 0]}>
        <boxGeometry args={[w * 0.95, 1.2, d * 0.95]} />
        <meshStandardMaterial color={ROCK_COLOR} roughness={1} />
      </mesh>
    </RigidBody>
  );
};

/* ============== Segment 1: 启航云台 ============== */
const StartSegment: React.FC<{ z: number }> = ({ z }) => (
  <Platform position={[0, 0, z]} size={[8, 1, SEGMENT_LENGTH]} />
);

/* ============== Segment 2: 跳板桥 ============== */
const JumpBridgeSegment: React.FC<{ z: number }> = ({ z }) => {
  const padCount = 3;
  const padSize: [number, number, number] = [3, 0.6, 2.5];
  return (
    <group>
      {Array.from({ length: padCount }).map((_, i) => {
        const gap = 2.2 + i * 0.6;
        const localZ = -i * (padSize[2] + gap) - 1;
        return (
          <Platform key={i} position={[0, 0, z + localZ]} size={padSize} color={GRASS_COLOR} />
        );
      })}
    </group>
  );
};

/* ============== Segment 3: 齿轮回廊 ============== */
const RotatingGear: React.FC<{ position: [number, number, number]; reverse?: boolean }> = ({
  position,
  reverse,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  // 使用 group 仅旋转视觉；下方 fixed 物理碰撞器单独存在（齿轮中心是阻挡圆柱）
  useFrame((_, dt) => {
    if (groupRef.current) {
      groupRef.current.rotation.z += (reverse ? -1 : 1) * dt * 1.2;
    }
  });
  return (
    <>
      {/* 视觉齿轮（旋转） */}
      <group ref={groupRef} position={position}>
        <mesh castShadow>
          <cylinderGeometry args={[1.4, 1.4, 0.4, 16]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.6} roughness={0.4} />
        </mesh>
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          const x = Math.cos(angle) * 1.5;
          const y = Math.sin(angle) * 1.5;
          return (
            <mesh key={i} position={[x, y, 0]} castShadow>
              <boxGeometry args={[0.5, 0.5, 0.4]} />
              <meshStandardMaterial color="#f59e0b" metalness={0.6} roughness={0.4} />
            </mesh>
          );
        })}
      </group>
      {/* 物理阻挡：圆柱形碰撞器（静态），高度沿世界 Z 方向 */}
      <RigidBody type="fixed" colliders={false} position={position} rotation={[Math.PI / 2, 0, 0]}>
        <CylinderCollider args={[0.2, 1.5]} />
      </RigidBody>
    </>
  );
};

const GearSegment: React.FC<{ z: number }> = ({ z }) => (
  <group>
    <Platform position={[-2.5, 0, z]} size={[3, 1, SEGMENT_LENGTH]} />
    <Platform position={[2.5, 0, z]} size={[3, 1, SEGMENT_LENGTH]} />
    <RotatingGear position={[0, 2, z - 3]} />
    <RotatingGear position={[0, 2, z - 9]} reverse />
  </group>
);

/* ============== Segment 4: 道具岛 ============== */
const PowerUpSegment: React.FC<{ z: number }> = ({ z }) => (
  <Platform position={[0, 0, z]} size={[6, 1, SEGMENT_LENGTH]} color="#a7f3d0" />
);

/* ============== Segment 5: 消失平台阵（真实周期消失） ============== */
/**
 * 6 块方砖分两组（A / B），错峰显隐：
 * - A 组（i 偶数）：显示 2.4s，消失 1.6s
 * - B 组（i 奇数）：显示阶段错开 2s，形成可通过的节奏
 */
const VanishingTile: React.FC<{
  position: [number, number, number];
  phase: 'A' | 'B';
}> = ({ position, phase }) => {
  const [visible, setVisible] = useState(true);
  const meshRef = useRef<THREE.Mesh>(null);
  const meshBottomRef = useRef<THREE.Mesh>(null);
  const cycleMs = 4000;
  const visibleMs = 2400;
  // B 组相位错开
  const offset = phase === 'B' ? cycleMs / 2 : 0;

  useFrame(() => {
    const t = (Date.now() + offset) % cycleMs;
    const shouldShow = t < visibleMs;
    if (shouldShow !== visible) setVisible(shouldShow);

    // 即将消失的最后 400ms 内闪烁警示
    const remaining = visibleMs - t;
    const blink = shouldShow && remaining < 600 ? Math.sin(Date.now() * 0.04) > 0 : true;
    const opacity = shouldShow ? (blink ? 1 : 0.35) : 0;
    if (meshRef.current) {
      const m = meshRef.current.material as THREE.MeshStandardMaterial;
      m.opacity = opacity;
      m.transparent = opacity < 1;
    }
    if (meshBottomRef.current) {
      const m = meshBottomRef.current.material as THREE.MeshStandardMaterial;
      m.opacity = opacity;
      m.transparent = opacity < 1;
    }
  });

  const [w, h, d] = [2.2, 0.5, 2.2];

  return (
    <RigidBody type="fixed" colliders={false} position={position}>
      {/* 仅在 visible 时启用碰撞器 */}
      {visible && <CuboidCollider args={[w / 2, h / 2, d / 2]} />}
      <mesh ref={meshRef} receiveShadow castShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color="#fde68a" roughness={0.8} />
      </mesh>
      <mesh ref={meshBottomRef} position={[0, -h / 2 - 0.6, 0]}>
        <boxGeometry args={[w * 0.95, 1.2, d * 0.95]} />
        <meshStandardMaterial color={ROCK_COLOR} roughness={1} />
      </mesh>
    </RigidBody>
  );
};

const VanishingSegment: React.FC<{ z: number }> = ({ z }) => {
  const tiles: Array<{ x: number; zOff: number; phase: 'A' | 'B' }> = [
    { x: -2, zOff: -1, phase: 'A' },
    { x: 2, zOff: -3, phase: 'B' },
    { x: -2, zOff: -5, phase: 'B' },
    { x: 2, zOff: -7, phase: 'A' },
    { x: -2, zOff: -9, phase: 'A' },
    { x: 2, zOff: -11, phase: 'B' },
  ];
  return (
    <group>
      {tiles.map((t, i) => (
        <VanishingTile
          key={i}
          position={[t.x, 0, z + t.zOff]}
          phase={t.phase}
        />
      ))}
    </group>
  );
};

/* ============== Segment 6: 终点云顶 ============== */
interface GoalSegmentProps {
  z: number;
  onReach: (side: PlayerSide) => void;
}
const GoalSegment: React.FC<GoalSegmentProps> = ({ z, onReach }) => {
  // 让旗布微微飘动
  const flagRef = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (flagRef.current) {
      flagRef.current.rotation.y = Math.sin(Date.now() * 0.003) * 0.15;
    }
  });
  return (
    <group>
      <Platform position={[0, 0, z]} size={[10, 1, SEGMENT_LENGTH]} color="#fef3c7" />
      {/* 终点 Sensor：在平台前部铺一个不可见触发器 */}
      <RigidBody type="fixed" colliders={false} position={[0, 1.5, z - SEGMENT_LENGTH / 2 + 2]}>
        <CuboidCollider
          args={[3, 1.5, 1]}
          sensor
          onIntersectionEnter={(payload) => {
            // rapier userData 类型为 unknown，需要 cast
            const ud = payload.other.rigidBody?.userData as { side?: PlayerSide } | undefined;
            if (ud?.side) onReach(ud.side);
          }}
        />
      </RigidBody>
      {/* 旗杆 + 旗布（纯装饰） */}
      <group position={[0, 2, z - SEGMENT_LENGTH / 2 + 2]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.08, 0.08, 3, 8]} />
          <meshStandardMaterial color="#9ca3af" />
        </mesh>
        <mesh ref={flagRef} position={[0.6, 1, 0]} castShadow>
          <boxGeometry args={[1.2, 0.8, 0.05]} />
          <meshStandardMaterial
            color="#fbbf24"
            emissive="#facc15"
            emissiveIntensity={0.4}
          />
        </mesh>
      </group>
    </group>
  );
};

/* ============== Track 入口 ============== */
interface TrackProps {
  onReachGoal: (side: PlayerSide) => void;
}

const Track: React.FC<TrackProps> = ({ onReachGoal }) => {
  // 用 useMemo 避免每次父组件 re-render 重建赛道
  const segments = useMemo(() => {
    const list: React.ReactNode[] = [];
    for (let i = 0; i < TOTAL_SEGMENTS; i++) {
      const z = -i * SEGMENT_LENGTH;
      switch (i) {
        case 0: list.push(<StartSegment key={i} z={z} />); break;
        case 1: list.push(<JumpBridgeSegment key={i} z={z} />); break;
        case 2: list.push(<GearSegment key={i} z={z} />); break;
        case 3: list.push(<PowerUpSegment key={i} z={z} />); break;
        case 4: list.push(<VanishingSegment key={i} z={z} />); break;
        case 5: list.push(<GoalSegment key={i} z={z} onReach={onReachGoal} />); break;
        default: break;
      }
    }
    return list;
  }, [onReachGoal]);

  return <group>{segments}</group>;
};

export default Track;
