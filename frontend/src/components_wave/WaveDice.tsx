/**
 * 浪尖踏歌 - 精美骰子组件
 * 6 面都有正确的圆点标记，rolling 阶段旋转动画
 */
import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useWaveStore } from '../engine_wave/waveStore';
import { DICE_ROLL_DURATION_MS, EVENT_BANNER_DURATION_MS, TURN_SWITCH_DELAY_MS } from '../engine_wave/constants';

const DICE_CAMERA_OFFSET = new THREE.Vector3(0, 2, -6);
const DICE_SIZE = 1.4;
const DOT_RADIUS = 0.1;
const DOT_OFFSET = 0.35;
const HALF = DICE_SIZE / 2 + 0.01;

/**
 * 骰子点数布局（标准骰子）
 * 每个面：法线方向 + 点位偏移 + 旋转
 */
interface DotPosition { x: number; y: number; z: number }

function getDotPositions(face: number): DotPosition[] {
  const d = DOT_OFFSET;
  // 点数位置（相对于面中心的 2D 偏移）
  const layouts: Record<number, [number, number][]> = {
    1: [[0, 0]],
    2: [[-d, -d], [d, d]],
    3: [[-d, -d], [0, 0], [d, d]],
    4: [[-d, -d], [-d, d], [d, -d], [d, d]],
    5: [[-d, -d], [-d, d], [0, 0], [d, -d], [d, d]],
    6: [[-d, -d], [-d, 0], [-d, d], [d, -d], [d, 0], [d, d]],
  };
  const pts = layouts[face] ?? [];

  // 面法线方向和对应 3D 坐标映射
  // face1=top(+Y), face2=front(+Z), face3=right(+X)
  // face4=left(-X), face5=back(-Z), face6=bottom(-Y)
  switch (face) {
    case 1: return pts.map(([a, b]) => ({ x: a, y: HALF, z: b }));       // +Y
    case 6: return pts.map(([a, b]) => ({ x: a, y: -HALF, z: b }));      // -Y
    case 2: return pts.map(([a, b]) => ({ x: a, y: b, z: HALF }));       // +Z
    case 5: return pts.map(([a, b]) => ({ x: a, y: b, z: -HALF }));      // -Z
    case 3: return pts.map(([a, b]) => ({ x: HALF, y: b, z: a }));       // +X
    case 4: return pts.map(([a, b]) => ({ x: -HALF, y: b, z: a }));      // -X
    default: return [];
  }
}

function getDotRotation(face: number): [number, number, number] {
  switch (face) {
    case 1: return [-Math.PI / 2, 0, 0]; // +Y 面朝上
    case 6: return [Math.PI / 2, 0, 0];  // -Y 面朝下
    case 2: return [0, 0, 0];            // +Z
    case 5: return [0, Math.PI, 0];      // -Z
    case 3: return [0, Math.PI / 2, 0];  // +X
    case 4: return [0, -Math.PI / 2, 0]; // -X
    default: return [0, 0, 0];
  }
}

/** 骰子 6 面圆点 */
const DiceDots: React.FC = () => {
  const dots: React.ReactNode[] = [];
  for (let face = 1; face <= 6; face++) {
    const positions = getDotPositions(face);
    positions.forEach((pos, i) => {
      dots.push(
        <mesh key={`${face}-${i}`} position={[pos.x, pos.y, pos.z]} rotation={getDotRotation(face)}>
          <circleGeometry args={[DOT_RADIUS, 16]} />
          <meshBasicMaterial color="#1a1a2e" />
        </mesh>,
      );
    });
  }
  return <>{dots}</>;
};

const WaveDice: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const phase = useWaveStore((s) => s.phase);
  const currentDice = useWaveStore((s) => s.currentDice);
  const [rollStart, setRollStart] = useState<number | null>(null);
  const { camera } = useThree();
  const tempPos = useRef(new THREE.Vector3());

  // rolling → resolveDice
  useEffect(() => {
    if (phase === 'rolling') {
      setRollStart(performance.now());
      const t = setTimeout(() => {
        useWaveStore.getState().resolveDice();
      }, DICE_ROLL_DURATION_MS);
      return () => clearTimeout(t);
    } else if (phase !== 'resolving') {
      setRollStart(null);
    }
  }, [phase]);

  // resolving → endTurn
  useEffect(() => {
    if (phase === 'resolving') {
      const t = setTimeout(() => {
        useWaveStore.getState().endTurn();
      }, EVENT_BANNER_DURATION_MS + TURN_SWITCH_DELAY_MS);
      return () => clearTimeout(t);
    }
  }, [phase]);

  useFrame(() => {
    if (!groupRef.current) return;
    // 跟随相机前方
    tempPos.current.copy(DICE_CAMERA_OFFSET);
    tempPos.current.applyQuaternion(camera.quaternion);
    tempPos.current.add(camera.position);
    groupRef.current.position.copy(tempPos.current);

    // rolling 时旋转（逐渐减速）
    if (rollStart !== null && phase === 'rolling') {
      const elapsed = performance.now() - rollStart;
      const progress = Math.min(1, elapsed / DICE_ROLL_DURATION_MS);
      const speed = (1 - progress * progress) * 18;
      groupRef.current.rotation.x += 0.016 * speed;
      groupRef.current.rotation.z += 0.016 * speed * 0.6;
      groupRef.current.rotation.y += 0.016 * speed * 0.3;
    }

    // resolving 时停在结果面朝前（让用户能看到数字）
    if (phase === 'resolving' && currentDice) {
      // 缓慢归位
      groupRef.current.rotation.x += (0 - groupRef.current.rotation.x) * 0.05;
      groupRef.current.rotation.z += (0 - groupRef.current.rotation.z) * 0.05;
      groupRef.current.rotation.y += (0 - groupRef.current.rotation.y) * 0.05;
    }
  });

  const visible = phase === 'rolling' || phase === 'resolving';

  return (
    <group ref={groupRef} visible={visible}>
      {/* 骰子主体 - 圆角效果用较亮材质模拟 */}
      <mesh castShadow>
        <boxGeometry args={[DICE_SIZE, DICE_SIZE, DICE_SIZE]} />
        <meshStandardMaterial
          color="#f8fafc"
          roughness={0.15}
          metalness={0.05}
          envMapIntensity={0.8}
        />
      </mesh>
      {/* 6 面圆点 */}
      <DiceDots />
      {/* 骰子边缘高光描边 */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(DICE_SIZE, DICE_SIZE, DICE_SIZE)]} />
        <lineBasicMaterial color="#cbd5e1" linewidth={1} />
      </lineSegments>
    </group>
  );
};

export default WaveDice;
