/**
 * 浪尖踏歌 - 主 Canvas（跳一跳海洋模式）
 * Water.js 海洋 + Sky 天空 + 螺旋赛道漂浮方块 + 骰子 + 双玩家
 */
import React, { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useProgress, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import WaterSurface from './WaterSurface';
import WaveTrack from './WaveTrack';
import WavePlayer from './WavePlayer';
import WaveDice from './WaveDice';
import WaveFollowCamera from './WaveFollowCamera';

/** 3D 场景内的加载进度指示器 */
function LoadingIndicator() {
  const { progress, active } = useProgress();
  if (!active) return null;
  return (
    <Html center>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        color: '#fff',
        fontFamily: 'monospace',
      }}>
        <div style={{
          width: 200,
          height: 6,
          background: 'rgba(255,255,255,0.15)',
          borderRadius: 3,
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #38bdf8, #818cf8)',
            borderRadius: 3,
            transition: 'width 0.3s ease',
          }} />
        </div>
        <div style={{ fontSize: 14, opacity: 0.8 }}>
          🏴‍☠️ 正在装载海盗船... {Math.round(progress)}%
        </div>
      </div>
    </Html>
  );
}

const WaveCanvas: React.FC = () => {
  const controlsRef = useRef<OrbitControlsImpl>(null);

  return (
    <Canvas
      shadows
      camera={{ position: [0, 25, 35], fov: 55, near: 1, far: 20000 }}
      gl={{
        antialias: true,
        alpha: false,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 0.5,
      }}
      dpr={[1, 2]}
      style={{ position: 'absolute', inset: 0 }}
    >
      {/* 加载进度 */}
      <LoadingIndicator />

      {/* 海洋 + 天空 */}
      <WaterSurface />

      {/* 补充光照 */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 20, 10]} intensity={1.2} color="#fff5e6" castShadow />

      {/* 螺旋赛道（漂浮方块） */}
      <WaveTrack />

      {/* 双玩家（3D 人物模型） */}
      <WavePlayer playerId="p1" />
      <WavePlayer playerId="p2" />

      {/* 骰子 */}
      <WaveDice />

      {/* 相机跟随 */}
      <WaveFollowCamera controlsRef={controlsRef} />

      {/* 相机控制 */}
      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        minDistance={15}
        maxDistance={80}
        maxPolarAngle={Math.PI * 0.48}
        target={[0, 2, 0]}
      />
    </Canvas>
  );
};

export default WaveCanvas;
