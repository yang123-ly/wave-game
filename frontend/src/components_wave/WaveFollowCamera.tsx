/**
 * 浪尖踏歌 - 相机跟随 + 点击拉近
 * - 跳跃（resolving/rolling）阶段自动聚焦当前玩家
 * - 点击场景中的物体时平滑拉近到点击位置
 * - 其他时候用户自由操控相机（不覆盖缩放/旋转）
 */
import React, { RefObject, useCallback, useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useWaveStore } from '../engine_wave/waveStore';
import { getWavePlatformPosition } from '../engine_wave/constants';
import { jumpingTargetIndex } from './WavePlayer';

/** 相机参数（可通过 UI 实时调整） */
export const cameraParams = {
  /** 跳跃跟随时的相机水平距离 */
  followDist: 12,
  /** 跳跃跟随时相机高度（与海平面基本平行，略高） */
  followHeight: 3,
  /** 跳跃时绕目标旋转速度（弧度/秒） */
  orbitSpeed: 0.3,
};
/** 点击拉近的目标距离 */
const CLICK_ZOOM_DIST = 14;
/** 跳跃完成后聚焦的距离（最大放大） */
const LAND_ZOOM_DIST = 10;
/** 拉近动画持续时间（ms） */
const ZOOM_DURATION = 800;

interface Props {
  controlsRef: RefObject<OrbitControlsImpl>;
}

const WaveFollowCamera: React.FC<Props> = ({ controlsRef }) => {
  const followTarget = useRef(new THREE.Vector3());
  const prevPhase = useRef<string>('');
  const prevTurn = useRef<string | null>(null);

  // 点击/着陆拉近状态
  const zoomTarget = useRef<THREE.Vector3 | null>(null);
  const zoomDist = useRef(CLICK_ZOOM_DIST);
  const zoomStartTime = useRef(0);
  const zoomStartPos = useRef(new THREE.Vector3());
  const zoomStartTarget = useRef(new THREE.Vector3());

  const { raycaster, camera, scene, gl } = useThree();

  const handleDoubleClick = useCallback((event: MouseEvent) => {
    const rect = gl.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    if (intersects.length > 0) {
      const point = intersects[0].point;
      zoomTarget.current = new THREE.Vector3(point.x, Math.max(2, point.y), point.z);
      zoomDist.current = CLICK_ZOOM_DIST;
      zoomStartTime.current = performance.now();
      zoomStartPos.current.copy(camera.position);
      zoomStartTarget.current.copy(controlsRef.current?.target ?? new THREE.Vector3());
    }
  }, [raycaster, camera, scene, gl, controlsRef]);

  useEffect(() => {
    gl.domElement.addEventListener('dblclick', handleDoubleClick);
    return () => gl.domElement.removeEventListener('dblclick', handleDoubleClick);
  }, [gl.domElement, handleDoubleClick]);

  useFrame((state, dt) => {
    const controls = controlsRef.current;
    if (!controls) return;

    const now = performance.now();
    const s = useWaveStore.getState();
    const phase = s.phase;

    // 检测跳跃完成：从 resolving → 其他 phase 时触发着陆聚焦
    if (prevPhase.current === 'resolving' && phase !== 'resolving') {
      const landSide = prevTurn.current || s.currentTurn;
      if (landSide) {
        const player = landSide === 'p1' ? s.p1 : s.p2;
        const pos = getWavePlatformPosition(player.platformIndex);
        zoomTarget.current = new THREE.Vector3(pos[0], 3, pos[2]);
        zoomDist.current = LAND_ZOOM_DIST;
        zoomStartTime.current = now;
        zoomStartPos.current.copy(state.camera.position);
        zoomStartTarget.current.copy(controls.target);
      }
    }
    prevPhase.current = phase;
    prevTurn.current = s.currentTurn;

    // 优先级 1：跳跃阶段自动聚焦到【当前正在跳的格子】（平视 + 旋转 + 放大）
    if (phase === 'resolving' || phase === 'rolling') {
      zoomTarget.current = null; // 跳跃时取消点击拉近
      const currentSide = s.currentTurn;
      if (currentSide) {
        // 读取当前正在跳向的格子（而非最终目标）
        const currentJumpIdx = jumpingTargetIndex[currentSide];
        const player = currentSide === 'p1' ? s.p1 : s.p2;
        const targetIdx = currentJumpIdx ?? player.platformIndex;
        const pos = getWavePlatformPosition(targetIdx);
        followTarget.current.set(pos[0], 3, pos[2]);

        // 平滑移动 target 到当前跳跃格子
        controls.target.lerp(followTarget.current, Math.min(1, dt * 4));

        // 相机围绕目标旋转（平视角度，与海平面平行）
        const elapsed = now * 0.001;
        const angle = elapsed * cameraParams.orbitSpeed;
        const desiredCamPos = new THREE.Vector3(
          followTarget.current.x + Math.cos(angle) * cameraParams.followDist,
          followTarget.current.y + cameraParams.followHeight,
          followTarget.current.z + Math.sin(angle) * cameraParams.followDist,
        );
        state.camera.position.lerp(desiredCamPos, Math.min(1, dt * 3));
        controls.update();
      }
      return;
    }

    // 优先级 2：点击拉近动画
    if (zoomTarget.current) {
      const elapsed = now - zoomStartTime.current;
      const progress = Math.min(1, elapsed / ZOOM_DURATION);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);

      // 目标 target
      controls.target.lerpVectors(zoomStartTarget.current, zoomTarget.current, eased);

      // 目标相机位置（朝 zoomTarget 方向拉近）
      const desiredDir = zoomStartPos.current.clone().sub(zoomTarget.current).normalize();
      const desiredPos = zoomTarget.current.clone().add(desiredDir.multiplyScalar(zoomDist.current));
      state.camera.position.lerpVectors(zoomStartPos.current, desiredPos, eased);

      controls.update();

      if (progress >= 1) {
        zoomTarget.current = null; // 动画完成，交还控制权
      }
    }
  });

  return null;
};

export default WaveFollowCamera;
