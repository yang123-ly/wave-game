/**
 * 跟随相机：俯视聚焦当前回合方
 *
 * 设计：
 * - 不直接挪 camera.position（OrbitControls 在管这个），
 *   只更新 controls.target 让镜头中心跟着回合方走
 * - 用户的拖拽 / 缩放因此完全不被打断
 */
import React, { RefObject, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useJumpStore } from '../engine_jump/jumpStore';
import { getPlatformPosition } from '../engine_jump/constants';

interface Props {
  controlsRef: RefObject<OrbitControlsImpl>;
}

/** 相机目标距离限制 */
const MIN_CAMERA_DIST = 6;
const MAX_CAMERA_DIST = 14;
/** 两人每多 1 格距离，相机增加的距离 */
const DIST_PER_PLATFORM_GAP = 0.8;

const JumpFollowCamera: React.FC<Props> = ({ controlsRef }) => {
  const desiredTarget = useRef(new THREE.Vector3());
  const desiredDist = useRef(MIN_CAMERA_DIST);

  useFrame((state, dt) => {
    const controls = controlsRef.current;
    if (!controls) return;
    const s = useJumpStore.getState();
    const p1Pos = getPlatformPosition(s.p1.platformIndex);
    const p2Pos = getPlatformPosition(s.p2.platformIndex);

    // 两人中点作为焦点（让两人同框）
    const midX = (p1Pos[0] + p2Pos[0]) / 2;
    const midZ = (p1Pos[2] + p2Pos[2]) / 2;
    desiredTarget.current.set(midX, 1.0, midZ);

    // 根据两人间距动态调整相机距离
    const gap = Math.abs(s.p1.platformIndex - s.p2.platformIndex);
    const targetDist = THREE.MathUtils.clamp(
      MIN_CAMERA_DIST + gap * DIST_PER_PLATFORM_GAP,
      MIN_CAMERA_DIST,
      MAX_CAMERA_DIST,
    );
    desiredDist.current += (targetDist - desiredDist.current) * Math.min(1, dt * 2);

    // 平滑插值 target
    controls.target.lerp(desiredTarget.current, Math.min(1, dt * 2.5));

    // 平滑调整相机距离（保持方向不变，只改远近）
    const camDir = state.camera.position.clone().sub(controls.target).normalize();
    const newCamPos = controls.target.clone().add(camDir.multiplyScalar(desiredDist.current));
    state.camera.position.lerp(newCamPos, Math.min(1, dt * 2));

    controls.update();
  });

  return null;
};

export default JumpFollowCamera;
