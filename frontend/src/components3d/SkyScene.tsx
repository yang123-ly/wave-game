/**
 * 天空与环境光照
 * - 避免 drei 10.x 的 Sky/Clouds 兼容问题，使用更稳的：
 *   · 大球内壁 + 顶点色 → 渐变天空盒
 *   · 手动放置若干 sphere "白云" → 装饰
 */
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/** 渐变天空：BackSide 大球，顶部蓝、底部暖色 */
const GradientSky: React.FC = () => {
  const geometry = useMemo(() => {
    const geom = new THREE.SphereGeometry(150, 32, 16);
    const colorTop = new THREE.Color('#87ceeb');
    const colorBottom = new THREE.Color('#fff7c8');
    const colors: number[] = [];
    const position = geom.attributes.position;
    for (let i = 0; i < position.count; i++) {
      const y = position.getY(i);
      // y 范围 [-150, 150] → [0, 1]
      const t = THREE.MathUtils.clamp((y + 150) / 300, 0, 1);
      const c = colorBottom.clone().lerp(colorTop, Math.pow(t, 0.7));
      colors.push(c.r, c.g, c.b);
    }
    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    return geom;
  }, []);

  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial vertexColors side={THREE.BackSide} fog={false} depthWrite={false} />
    </mesh>
  );
};

/** 单朵装饰云（由 3-5 个白色球体堆叠而成） */
const Cloud: React.FC<{ position: [number, number, number]; scale?: number; speed?: number }> = ({
  position,
  scale = 1,
  speed = 0.5,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const baseX = position[0];
  useFrame((_, dt) => {
    if (!groupRef.current) return;
    // 缓慢横向飘动
    groupRef.current.position.x += dt * speed * 0.3;
    if (groupRef.current.position.x > baseX + 6) {
      groupRef.current.position.x = baseX - 6;
    }
  });
  return (
    <group ref={groupRef} position={position} scale={scale}>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[1.6, 12, 10]} />
        <meshStandardMaterial color="#ffffff" roughness={1} metalness={0} fog={false} />
      </mesh>
      <mesh position={[1.4, 0.3, 0.2]}>
        <sphereGeometry args={[1.2, 12, 10]} />
        <meshStandardMaterial color="#ffffff" roughness={1} fog={false} />
      </mesh>
      <mesh position={[-1.5, 0.2, -0.1]}>
        <sphereGeometry args={[1.3, 12, 10]} />
        <meshStandardMaterial color="#ffffff" roughness={1} fog={false} />
      </mesh>
      <mesh position={[0.4, 0.8, 0.3]}>
        <sphereGeometry args={[1.0, 12, 10]} />
        <meshStandardMaterial color="#ffffff" roughness={1} fog={false} />
      </mesh>
    </group>
  );
};

const SkyScene: React.FC = () => {
  return (
    <>
      {/* 渐变天空盒 */}
      <GradientSky />

      {/* 半球光：天空蓝 + 草地绿，营造卡通柔和感 */}
      <hemisphereLight args={['#87ceeb', '#7ee787', 0.9]} />

      {/* 环境填充光，避免阴影面太黑 */}
      <ambientLight intensity={0.35} />

      {/* 主方向光（太阳），带阴影 */}
      <directionalLight
        position={[20, 25, 10]}
        intensity={1.4}
        color={'#fff5d1'}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={20}
        shadow-camera-bottom={-100}
        shadow-camera-near={1}
        shadow-camera-far={120}
      />

      {/* 雾化效果，远处赛道淡入云海 */}
      <fog attach="fog" args={['#cce5ff', 35, 120]} />

      {/* 装饰云朵 */}
      <Cloud position={[-18, 6, -10]} scale={1.2} speed={0.4} />
      <Cloud position={[22, 8, -30]} scale={1.5} speed={0.3} />
      <Cloud position={[-25, 5, -50]} scale={1.4} speed={0.5} />
      <Cloud position={[18, 10, -70]} scale={1.6} speed={0.35} />
      <Cloud position={[-12, 12, -88]} scale={1.3} speed={0.45} />
    </>
  );
};

export default SkyScene;
