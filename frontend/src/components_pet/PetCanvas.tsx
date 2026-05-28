/**
 * 通用宠物 3D 画布
 * - 小尺寸（卡片头像 / 弹窗选择按钮）：interactive=false，自转展示
 * - 大尺寸（详情页）：interactive=true，OrbitControls 可旋转
 */
import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { PetModel } from './PetModels';

interface PetCanvasProps {
  species: string;
  mood?: number;
  level?: number;
  excited?: boolean;
  /** 启用鼠标旋转交互（详情页 true，列表卡片 false） */
  interactive?: boolean;
  /** 是否自转（仅 interactive=false 时有意义） */
  autoRotate?: boolean;
  /** 背景 - 'transparent' | css 颜色字符串 */
  background?: string;
  /** 画布相对父容器尺寸（已用 100% 100% 撑满，父容器需要给定宽高） */
  className?: string;
}

/** 让 group 慢慢自转（卡片用） */
const AutoSpin: React.FC<{ enabled: boolean; children: React.ReactNode }> = ({ enabled, children }) => {
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (enabled && g.current) g.current.rotation.y += dt * 0.6;
  });
  return <group ref={g}>{children}</group>;
};

const PetCanvas: React.FC<PetCanvasProps> = ({
  species,
  mood = 80,
  level = 1,
  excited = false,
  interactive = false,
  autoRotate = true,
  background = 'transparent',
  className,
}) => {
  return (
    <div
      className={className}
      style={{
        width: '100%',
        height: '100%',
        background: background === 'transparent' ? 'transparent' : background,
      }}
    >
      <Canvas
        shadows
        camera={{ position: [1.6, 1.4, 1.8], fov: 38 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        {/* 灯光：和云上之巅风格一致的暖色逆光 + 主光 */}
        <ambientLight intensity={0.55} />
        <directionalLight
          position={[3, 5, 2]}
          intensity={1.1}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <directionalLight position={[-2, 3, -3]} intensity={0.4} color="#ffd6a0" />

        <Suspense fallback={null}>
          {interactive ? (
            <PetModel species={species} mood={mood} level={level} excited={excited} />
          ) : (
            <AutoSpin enabled={autoRotate}>
              <PetModel species={species} mood={mood} level={level} excited={excited} />
            </AutoSpin>
          )}

          {/* 地面阴影盘 */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
            <circleGeometry args={[1.2, 32]} />
            <meshStandardMaterial color="#1a1a2e" transparent opacity={0.35} />
          </mesh>
        </Suspense>

        {interactive && (
          <OrbitControls
            enablePan={false}
            enableZoom={true}
            minDistance={1.5}
            maxDistance={4}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2.2}
            target={[0, 0.5, 0]}
          />
        )}
      </Canvas>
    </div>
  );
};

export default PetCanvas;
