/**
 * 跳一跳 R3F Canvas 根
 * - OrbitControls：用户可拖动旋转 / 滚轮缩放视角
 * - JumpFollowCamera：通过修改 OrbitControls.target 跟随当前回合方
 *   相机位置由 OrbitControls 自己维护，用户操作不会被覆盖
 */
import React, { Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import SkyScene from '../components3d/SkyScene';
import JumpTrack from './JumpTrack';
import JumpPlayer from './JumpPlayer';
import Dice from './Dice';
import JumpFollowCamera from './JumpFollowCamera';

const JumpCanvas: React.FC = () => {
  const controlsRef = useRef<OrbitControlsImpl>(null);

  return (
    <Canvas
      shadows
      camera={{ position: [0, 6, 8], fov: 55, near: 0.1, far: 200 }}
      gl={{ antialias: true }}
      style={{ width: '100%', height: '100%', background: '#a4c8f0' }}
    >
      <Suspense fallback={null}>
        <SkyScene />
        <JumpTrack />
        <JumpPlayer side="p1" />
        <JumpPlayer side="p2" />
        <Dice />
        <JumpFollowCamera controlsRef={controlsRef} />
      </Suspense>
      <OrbitControls
        ref={controlsRef}
        enablePan
        enableZoom
        enableRotate
        minDistance={4}
        maxDistance={30}
        minPolarAngle={0.1}
        maxPolarAngle={Math.PI / 2.05}
        dampingFactor={0.08}
        enableDamping
      />
    </Canvas>
  );
};

export default JumpCanvas;
