/**
 * R3F Canvas 根：整合所有 3D 组件
 */
import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import SkyScene from './SkyScene';
import Track from './Track';
import Player from './Player';
import { PowerUps } from './PowerUp';
import FollowCamera from './FollowCamera';
import { useKeyboardControls } from '../engine3d/useKeyboardControls';
import { useGameStore } from '../engine3d/gameStore';
import { GRAVITY } from '../engine3d/constants';
import type { PlayerSide } from '../engine3d/types';

const GameCanvas: React.FC = () => {
  const controlsRef = useKeyboardControls();
  const phase = useGameStore((s) => s.phase);

  const handleReachGoal = (side: PlayerSide) => {
    useGameStore.getState().reachGoal(side);
  };

  // 仅在 playing/finished 时启用物理（idle/countdown 锁定）
  const physicsPaused = phase === 'idle' || phase === 'countdown';

  return (
    <Canvas
      shadows
      camera={{ position: [0, 8, 10], fov: 55, near: 0.1, far: 200 }}
      gl={{ antialias: true }}
      style={{ width: '100%', height: '100%', background: '#a4c8f0' }}
    >
      <Suspense fallback={null}>
        <SkyScene />
        <Physics gravity={GRAVITY} paused={physicsPaused}>
          <Track onReachGoal={handleReachGoal} />
          <PowerUps />
          <Player side="p1" controlsRef={controlsRef} />
          <Player side="p2" controlsRef={controlsRef} />
        </Physics>
        <FollowCamera />
      </Suspense>
    </Canvas>
  );
};

export default GameCanvas;
