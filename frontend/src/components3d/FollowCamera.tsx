/**
 * 第三人称跟随相机：自动 framing 两个玩家
 * - 镜头始终位于两人中点 + 后方 + 高处
 * - 两人 Z 差距越大，镜头自动拉远
 */
import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../engine3d/gameStore';

const MIN_DIST = 9;
const MAX_DIST = 16;
const HEIGHT = 6;
const LOOK_AHEAD_Z = -3;

const FollowCamera: React.FC = () => {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3());
  const desired = useRef(new THREE.Vector3());

  useFrame((_, dt) => {
    const p1 = useGameStore.getState().p1.position;
    const p2 = useGameStore.getState().p2.position;

    // 中点
    const midX = (p1[0] + p2[0]) / 2;
    const midZ = (p1[2] + p2[2]) / 2;
    const midY = Math.max(p1[1], p2[1]);

    // 两人沿赛道(Z)的距离，决定拉远量
    const spreadZ = Math.abs(p1[2] - p2[2]);
    const dist = THREE.MathUtils.clamp(MIN_DIST + spreadZ * 0.3, MIN_DIST, MAX_DIST);

    // 相机始终位于赛道行进方向的"后方"（z+ 方向）
    desired.current.set(midX, midY + HEIGHT, midZ + dist);

    // 平滑插值（lerp）
    camera.position.lerp(desired.current, Math.min(1, dt * 4));

    // 看向中点稍前方
    target.current.set(midX, midY, midZ + LOOK_AHEAD_Z);
    camera.lookAt(target.current);
  });

  return null;
};

export default FollowCamera;
