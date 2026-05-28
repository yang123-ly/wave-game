/**
 * 跳一跳玩家：3D 角色模型 + 抛物线动画
 * - P1 = Michelle.glb（桑巴/跳跃）
 * - P2 = Drop Kick.glb（踢腿角色，自带动画）
 * - idle 播放内置第一段动画；起跳切到 Jump（P1 用 FBX，P2 用自带）；落地切回 idle
 * - 非当前回合方半透明
 */
import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useJumpStore } from '../engine_jump/jumpStore';
import {
  JUMP_DURATION_MS,
  JUMP_PEAK_HEIGHT,
  getPlatformPosition,
} from '../engine_jump/constants';
import { P1_COLOR, P2_COLOR } from '../engine3d/constants';
import type { PlayerSide } from '../engine3d/types';
import GltfAvatar from '../components_profile/GltfAvatar';

/** P1: Michelle.glb（GLB 内置 SambaDance） */
const P1_URL = '/models/Michelle.glb';
const P1_SCALE = 0.95;
const P1_IDLE = 'SambaDance';
const P1_EXTRA_ANIMS = [{ name: 'Jump', url: '/models/JumpingDown.fbx' }];

/** P2: DropKick.fbx（28MB Mixamo 角色，不同外观）
 *  FBX 单位 cm → scale 0.01 转 m
 *  idle 动作用 Breakdance1990.fbx 嫁接 */
const P2_URL = '/models/DropKick.fbx';
const P2_SCALE = 0.01;
const P2_POSITION_Y = 0.75;
const P2_IDLE = 'Breakdance1990';
const P2_EXTRA_ANIMS = [
  { name: 'Breakdance1990', url: '/models/Breakdance1990.fbx' },
  { name: 'Jump', url: '/models/JumpingDown.fbx' },
];

interface JumpPlayerProps {
  side: PlayerSide;
}

/** Michelle 脚底在原点，箱顶在 Y=0.25（半个 PLATFORM_SIZE.h），偏移让脚踩箱顶 */
const PLAYER_HEIGHT_OFFSET = 0.25;

const JumpPlayer: React.FC<JumpPlayerProps> = ({ side }) => {
  const groupRef = useRef<THREE.Group>(null);
  // 当前显示位置（独立于 store，由动画驱动）
  const currentPlatform = useRef(0);
  /** 逐格跳跃队列：每段只跳一格 */
  const jumpQueue = useRef<{ from: [number, number, number]; to: [number, number, number] }[]>([]);
  const jumpStartedAt = useRef<number | null>(null);
  // 根据 side 选择模型 + 动画配置
  const modelUrl = side === 'p1' ? P1_URL : P2_URL;
  const modelScale = side === 'p1' ? P1_SCALE : P2_SCALE;
  const modelPositionY = side === 'p1' ? 0 : P2_POSITION_Y;
  const idleAnim = side === 'p1' ? P1_IDLE : P2_IDLE;
  const extraAnims = side === 'p1' ? P1_EXTRA_ANIMS : P2_EXTRA_ANIMS;
  // 当前播放的动画名
  const [animName, setAnimName] = useState<string>(idleAnim);
  // 左右偏移，避免两人完全重叠
  const xOffset = side === 'p1' ? -0.5 : 0.5;
  const color = side === 'p1' ? P1_COLOR : P2_COLOR;

  // 订阅 platformIndex + phase + currentTurn 变化
  const platformIndex = useJumpStore((s) =>
    side === 'p1' ? s.p1.platformIndex : s.p2.platformIndex,
  );
  const phase = useJumpStore((s) => s.phase);

  // reset：phase 回到 idle 表示新对局/进入页面 → 把 ref 状态归零
  useEffect(() => {
    if (phase === 'idle') {
      currentPlatform.current = 0;
      jumpQueue.current = [];
      jumpStartedAt.current = null;
      const pos = getPlatformPosition(0);
      if (groupRef.current) {
        groupRef.current.position.set(
          pos[0] + xOffset,
          pos[1] + PLAYER_HEIGHT_OFFSET,
          pos[2],
        );
      }
    }
  }, [phase, xOffset]);

  // 玩家位置改变 → 构建逐格跳跃队列
  useEffect(() => {
    if (platformIndex === currentPlatform.current) return;
    const start = currentPlatform.current;
    const end = platformIndex;
    const step = end > start ? 1 : -1;
    const queue: { from: [number, number, number]; to: [number, number, number] }[] = [];
    for (let i = start; i !== end; i += step) {
      const fromPos = getPlatformPosition(i);
      const toPos = getPlatformPosition(i + step);
      queue.push({
        from: [fromPos[0] + xOffset, fromPos[1] + PLAYER_HEIGHT_OFFSET, fromPos[2]],
        to: [toPos[0] + xOffset, toPos[1] + PLAYER_HEIGHT_OFFSET, toPos[2]],
      });
    }
    jumpQueue.current = queue;
    jumpStartedAt.current = performance.now();
    currentPlatform.current = platformIndex;
    setAnimName('Jump');
  }, [platformIndex, xOffset]);

  useFrame(() => {
    if (!groupRef.current) return;
    const queue = jumpQueue.current;
    if (queue.length === 0 || jumpStartedAt.current === null) return;

    const seg = queue[0];
    const elapsed = performance.now() - jumpStartedAt.current;
    const t = Math.min(1, elapsed / JUMP_DURATION_MS);

    // 水平线性插值
    const x = seg.from[0] + (seg.to[0] - seg.from[0]) * t;
    const z = seg.from[2] + (seg.to[2] - seg.from[2]) * t;
    // 垂直抛物线
    const baseY = seg.from[1] + (seg.to[1] - seg.from[1]) * t;
    const arc = 4 * JUMP_PEAK_HEIGHT * t * (1 - t);
    groupRef.current.position.set(x, baseY + arc, z);

    // 当前段跳完
    if (t >= 1) {
      queue.shift();
      if (queue.length > 0) {
        // 还有下一格，继续跳
        jumpStartedAt.current = performance.now();
      } else {
        // 全部跳完，切回 idle
        jumpStartedAt.current = null;
        groupRef.current.rotation.y = 0;
        setAnimName(idleAnim);
      }
    }
  });

  return (
    <group ref={groupRef}>
      {/* 3D 角色模型 + 脚下光环（区分玩家） */}
      <Suspense fallback={<FallbackCapsule color={color} />}>
        <GltfAvatar
          url={modelUrl}
          scale={modelScale}
          position={[0, modelPositionY, 0]}
          animationName={animName}
          extraAnimations={extraAnims}
        />
      </Suspense>
      {/* 脚下光环（独立于模型 scale） */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.4, 0.55, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.85} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.4, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.2} />
      </mesh>
      {/* 护盾 */}
      <ShieldVisual side={side} />
    </group>
  );
};

/** Suspense fallback：加载 Michelle 时显示彩色胶囊占位 */
const FallbackCapsule: React.FC<{ color: string }> = ({ color }) => (
  <mesh position={[0, 0.85, 0]} castShadow>
    <capsuleGeometry args={[0.32, 0.7, 6, 12]} />
    <meshStandardMaterial color={color} roughness={0.5} metalness={0.1} />
  </mesh>
);

const ShieldVisual: React.FC<{ side: PlayerSide }> = ({ side }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const shieldCount = useJumpStore((s) =>
    side === 'p1' ? s.p1.shieldCount : s.p2.shieldCount,
  );
  useFrame(() => {
    if (!meshRef.current) return;
    meshRef.current.visible = shieldCount > 0;
    if (shieldCount > 0) {
      meshRef.current.rotation.y += 0.04;
    }
  });
  const geometry = useMemo(() => new THREE.SphereGeometry(0.7, 16, 16), []);
  return (
    <mesh ref={meshRef} geometry={geometry} visible={false}>
      <meshStandardMaterial
        color="#ffd966"
        transparent
        opacity={0.35}
        emissive="#ffd966"
        emissiveIntensity={0.6}
        wireframe
      />
    </mesh>
  );
};

export default JumpPlayer;
