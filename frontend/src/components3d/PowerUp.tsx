/**
 * 道具：在赛道道具岛上散布的发光多面体
 * - 玩家触碰（Sensor）→ 触发 pickPowerUp + 自身消失（10 秒后重生）
 */
import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, BallCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { useGameStore } from '../engine3d/gameStore';
import { SEGMENT_LENGTH } from '../engine3d/constants';
import type { PlayerSide, PowerUpKind } from '../engine3d/types';

const POWERUP_RESPAWN_MS = 10000;
/** 在道具岛段（segment 3）放置 3 个道具 */
const POWERUP_ISLAND_Z = -3 * SEGMENT_LENGTH;

const POWERUP_META: Record<PowerUpKind, { color: string; emissive: string; geometry: 'oct' | 'icos' | 'tetra' }> = {
  speed: { color: '#fbbf24', emissive: '#fcd34d', geometry: 'oct' },
  shield: { color: '#60a5fa', emissive: '#93c5fd', geometry: 'icos' },
  blast: { color: '#f472b6', emissive: '#f9a8d4', geometry: 'tetra' },
};

interface PowerUpProps {
  kind: PowerUpKind;
  position: [number, number, number];
}

const PowerUp: React.FC<PowerUpProps> = ({ kind, position }) => {
  const meta = POWERUP_META[kind];
  const groupRef = useRef<THREE.Group>(null);
  const [hiddenUntil, setHiddenUntil] = useState(0);
  const visible = Date.now() >= hiddenUntil;

  useFrame((_, dt) => {
    if (groupRef.current && visible) {
      groupRef.current.rotation.y += dt * 1.2;
      groupRef.current.position.y = position[1] + Math.sin(Date.now() * 0.003) * 0.2;
    }
    // 检查是否到重生时间
    if (!visible && Date.now() >= hiddenUntil) {
      setHiddenUntil(0);
    }
  });

  // 隐藏时不渲染碰撞体，避免误触
  if (!visible) {
    return (
      <group ref={groupRef} position={position} visible={false} />
    );
  }

  return (
    <group ref={groupRef} position={position}>
      <RigidBody
        type="fixed"
        colliders={false}
        position={[0, 0, 0]}
      >
        <BallCollider
          args={[0.6]}
          sensor
          onIntersectionEnter={(payload) => {
            const ud = payload.other.rigidBody?.userData as { side?: PlayerSide } | undefined;
            if (!ud?.side) return;
            useGameStore.getState().pickPowerUp(ud.side, kind);
            setHiddenUntil(Date.now() + POWERUP_RESPAWN_MS);
          }}
        />
      </RigidBody>
      {meta.geometry === 'oct' && (
        <mesh castShadow>
          <octahedronGeometry args={[0.5, 0]} />
          <meshStandardMaterial
            color={meta.color}
            emissive={meta.emissive}
            emissiveIntensity={1.2}
            metalness={0.4}
            roughness={0.3}
          />
        </mesh>
      )}
      {meta.geometry === 'icos' && (
        <mesh castShadow>
          <icosahedronGeometry args={[0.5, 0]} />
          <meshStandardMaterial
            color={meta.color}
            emissive={meta.emissive}
            emissiveIntensity={1.2}
            metalness={0.4}
            roughness={0.3}
          />
        </mesh>
      )}
      {meta.geometry === 'tetra' && (
        <mesh castShadow>
          <tetrahedronGeometry args={[0.6, 0]} />
          <meshStandardMaterial
            color={meta.color}
            emissive={meta.emissive}
            emissiveIntensity={1.2}
            metalness={0.4}
            roughness={0.3}
          />
        </mesh>
      )}
      {/* 光晕地标 */}
      <pointLight color={meta.emissive} intensity={1.2} distance={4} />
    </group>
  );
};

export const PowerUps: React.FC = () => {
  // 三个道具位置（在道具岛段内部分散）
  return (
    <>
      <PowerUp kind="speed" position={[-1.5, 2, POWERUP_ISLAND_Z - 2]} />
      <PowerUp kind="shield" position={[0, 2, POWERUP_ISLAND_Z - 6]} />
      <PowerUp kind="blast" position={[1.5, 2, POWERUP_ISLAND_Z - 10]} />
    </>
  );
};

export default PowerUp;
