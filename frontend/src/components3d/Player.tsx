/**
 * 玩家角色：胶囊体 + 卡通脸 + Rapier 动力学刚体
 * - 通过 useKeyboardControls 读取每帧按键
 * - 移动：基于线速度直接设置（lockRotations + 摩擦由 rapier 处理）
 * - 跳跃：检测刚体的 Y 速度 ≈ 0 时才允许跳，避免空中连跳
 * - 推撞：rapier 自带玩家间碰撞 + 我们在 onCollisionEnter 给对方施加额外推力
 * - 复活：当 Y < FALL_Y_THRESHOLD 触发；timer 到点用 setTranslation 回到 checkpoint
 * - 加速 / 护盾 / 击退波 通过 gameStore 状态读取
 */
import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CapsuleCollider, RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import {
  BLAST_IMPULSE,
  BLAST_RADIUS,
  FALL_Y_THRESHOLD,
  GOAL_Z,
  JUMP_COOLDOWN_MS,
  JUMP_IMPULSE,
  P1_COLOR,
  P1_SPAWN,
  P2_COLOR,
  P2_SPAWN,
  PLAYER_HALF_HEIGHT,
  PLAYER_MOVE_SPEED,
  PLAYER_RADIUS,
  PUSH_IMPULSE,
  SEGMENT_LENGTH,
  SPEED_BOOST_MULTIPLIER,
  getCheckpointPos,
} from '../engine3d/constants';
import { useGameStore } from '../engine3d/gameStore';
import {
  consumeOneShot,
  DualKeyState,
} from '../engine3d/useKeyboardControls';
import type { PlayerSide } from '../engine3d/types';

interface PlayerProps {
  side: PlayerSide;
  controlsRef: React.MutableRefObject<DualKeyState>;
}

const Player: React.FC<PlayerProps> = ({ side, controlsRef }) => {
  const rb = useRef<RapierRigidBody>(null);
  const lastJumpAt = useRef(0);
  const isOnGround = useRef(true);

  const color = side === 'p1' ? P1_COLOR : P2_COLOR;
  const spawn = side === 'p1' ? P1_SPAWN : P2_SPAWN;

  // userData 用于 Sensor / 碰撞回调识别玩家身份
  const userData = useMemo(() => ({ side }), [side]);

  /* ============ 每帧物理驱动 ============ */
  useFrame(() => {
    const body = rb.current;
    if (!body) return;
    const store = useGameStore.getState();
    const self = store[side];

    // 同步位置到 store（供相机、HUD 使用）
    const t = body.translation();
    store.updatePlayerPosition(side, [t.x, t.y, t.z]);

    // 游戏未开始 / 已结束 / 复活中 → 锁定位置（不响应输入）
    if (store.phase !== 'playing' || self.finished || self.respawnUntil > 0) {
      // 复活倒计时结束 → 传送回 checkpoint
      if (self.respawnUntil > 0 && Date.now() >= self.respawnUntil) {
        const [cx, cy, cz] = getCheckpointPos(self.lastCheckpoint, side);
        body.setTranslation({ x: cx, y: cy, z: cz }, true);
        body.setLinvel({ x: 0, y: 0, z: 0 }, true);
        store.completeRespawn(side);
      }
      return;
    }

    // 掉落检测
    if (t.y < FALL_Y_THRESHOLD) {
      store.triggerRespawn(side);
      return;
    }

    // 抵达终点检测（兜底，主判定走 Sensor）
    if (t.z <= GOAL_Z - SEGMENT_LENGTH / 2 + 2 + 1) {
      // Sensor 已经会触发，这里不重复
    }

    // 经过检查点：以 z 坐标推算当前段
    const currentSegment = Math.max(0, Math.min(5, Math.floor(-t.z / SEGMENT_LENGTH)));
    if (currentSegment > self.lastCheckpoint) {
      store.setCheckpoint(side, currentSegment);
    }

    /* ============ 处理输入 ============ */
    const keys = controlsRef.current[side];
    const speedMult = self.speedBoostUntil > Date.now() ? SPEED_BOOST_MULTIPLIER : 1;
    const moveSpeed = PLAYER_MOVE_SPEED * speedMult;

    // 计算期望水平速度（X = 左右，Z = 前后；前进 = -Z）
    let vx = 0;
    let vz = 0;
    if (keys.forward) vz -= 1;
    if (keys.backward) vz += 1;
    if (keys.left) vx -= 1;
    if (keys.right) vx += 1;
    const len = Math.hypot(vx, vz);
    if (len > 0) {
      vx = (vx / len) * moveSpeed;
      vz = (vz / len) * moveSpeed;
    }

    // 保留刚体的 Y 速度（重力 / 跳跃）
    const currentVel = body.linvel();
    body.setLinvel({ x: vx, y: currentVel.y, z: vz }, true);

    // 简易接地检测：Y 速度接近 0 且玩家 Y > spawn 附近 → 视为接地
    isOnGround.current = Math.abs(currentVel.y) < 0.05;

    // 跳跃
    if (consumeOneShot(keys, 'jumpPressed')) {
      const now = Date.now();
      if (isOnGround.current && now - lastJumpAt.current > JUMP_COOLDOWN_MS) {
        body.setLinvel({ x: vx, y: JUMP_IMPULSE, z: vz }, true);
        lastJumpAt.current = now;
      }
    }

    // 释放击退波技能
    if (consumeOneShot(keys, 'skillPressed')) {
      if (self.activePowerUp === 'blast') {
        store.consumeActivePowerUp(side);
        // 对对手施加击退
        const otherSide: PlayerSide = side === 'p1' ? 'p2' : 'p1';
        const other = store[otherSide];
        const dx = other.position[0] - t.x;
        const dz = other.position[2] - t.z;
        const dist = Math.hypot(dx, dz);
        if (dist > 0 && dist < BLAST_RADIUS) {
          // 给对手刚体施加冲量（通过全局事件总线触发）
          window.dispatchEvent(
            new CustomEvent('player-blast', {
              detail: {
                targetSide: otherSide,
                impulse: {
                  x: (dx / dist) * BLAST_IMPULSE,
                  y: BLAST_IMPULSE * 0.4,
                  z: (dz / dist) * BLAST_IMPULSE,
                },
              },
            }),
          );
        }
      }
    }
  });

  /* ============ 监听击退波事件，对自己施加冲量 ============ */
  useEffect(() => {
    const onBlast = (e: Event) => {
      const ce = e as CustomEvent<{ targetSide: PlayerSide; impulse: { x: number; y: number; z: number } }>;
      if (ce.detail.targetSide !== side) return;
      const body = rb.current;
      if (!body) return;
      const self = useGameStore.getState()[side];
      if (self.hasShield) {
        useGameStore.getState().consumeShield(side);
        return;
      }
      body.applyImpulse(ce.detail.impulse, true);
    };
    window.addEventListener('player-blast', onBlast);
    return () => window.removeEventListener('player-blast', onBlast);
  }, [side]);

  /* ============ 渲染 ============ */
  return (
    <RigidBody
      ref={rb}
      colliders={false}
      type="dynamic"
      position={spawn}
      enabledRotations={[false, false, false]}
      linearDamping={0.6}
      friction={0.4}
      restitution={0.1}
      userData={userData}
      onCollisionEnter={(payload) => {
        // 与另一玩家碰撞 → 互推
        const otherUd = payload.other.rigidBody?.userData as { side?: PlayerSide } | undefined;
        if (otherUd?.side && otherUd.side !== side) {
          const body = rb.current;
          const otherBody = payload.other.rigidBody;
          if (!body || !otherBody) return;
          const myT = body.translation();
          const otT = otherBody.translation();
          const dx = otT.x - myT.x;
          const dz = otT.z - myT.z;
          const dist = Math.hypot(dx, dz);
          if (dist > 0.001) {
            // 给对方一个推力
            const self = useGameStore.getState()[otherUd.side];
            if (self.hasShield) {
              useGameStore.getState().consumeShield(otherUd.side);
            } else {
              otherBody.applyImpulse(
                {
                  x: (dx / dist) * PUSH_IMPULSE,
                  y: PUSH_IMPULSE * 0.2,
                  z: (dz / dist) * PUSH_IMPULSE,
                },
                true,
              );
            }
          }
        }
      }}
    >
      <CapsuleCollider args={[PLAYER_HALF_HEIGHT, PLAYER_RADIUS]} />
      {/* 身体 */}
      <mesh castShadow>
        <capsuleGeometry args={[PLAYER_RADIUS, PLAYER_HALF_HEIGHT * 2, 6, 12]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.1} />
      </mesh>
      {/* 头顶发光环 */}
      <mesh position={[0, PLAYER_HALF_HEIGHT + PLAYER_RADIUS + 0.1, 0]}>
        <torusGeometry args={[0.25, 0.04, 8, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.5}
        />
      </mesh>
      {/* 简易眼睛（朝 -Z 方向） */}
      <mesh position={[-0.15, 0.1, -PLAYER_RADIUS + 0.01]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshBasicMaterial color="#0a0a14" />
      </mesh>
      <mesh position={[0.15, 0.1, -PLAYER_RADIUS + 0.01]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshBasicMaterial color="#0a0a14" />
      </mesh>
      {/* 护盾可视化 */}
      <ShieldVisual side={side} />
    </RigidBody>
  );
};

/** 护盾光圈（响应 store.hasShield） */
const ShieldVisual: React.FC<{ side: PlayerSide }> = ({ side }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!meshRef.current) return;
    const hasShield = useGameStore.getState()[side].hasShield;
    meshRef.current.visible = hasShield;
    if (hasShield) {
      meshRef.current.rotation.y += 0.04;
    }
  });
  return (
    <mesh ref={meshRef} visible={false}>
      <sphereGeometry args={[PLAYER_RADIUS + 0.35, 16, 16]} />
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

export default Player;
