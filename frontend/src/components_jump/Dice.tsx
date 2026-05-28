/**
 * 3D 骰子：在场景中央漂浮
 * - idle / turn 阶段：缓慢自转
 * - rolling 阶段：快速随机翻转 + 缩放反馈，结束后停在结果面
 * - 6 个面用 Text 显示数字（避免贴图依赖）
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useJumpStore } from '../engine_jump/jumpStore';
import {
  DICE_ROLL_DURATION_MS,
  EVENT_BANNER_DURATION_MS,
  TURN_SWITCH_DELAY_MS,
} from '../engine_jump/constants';

/** 骰子在相机本地坐标系中的偏移（左下角） */
const DICE_CAMERA_OFFSET = new THREE.Vector3(-4, -1.5, -8);

// 6 面骰每一面朝向相机时的目标欧拉角（Y-X-Z 顺序）
// 这里采用简化映射：每个 face 对应一组确定的旋转
const FACE_ROTATIONS: Record<number, [number, number, number]> = {
  1: [0, 0, 0],
  2: [0, Math.PI / 2, 0],
  3: [0, Math.PI, 0],
  4: [0, -Math.PI / 2, 0],
  5: [-Math.PI / 2, 0, 0],
  6: [Math.PI / 2, 0, 0],
};

/** 兜底位置（相机不可用时用，正常每帧都会被相机偏移覆盖） */
const DICE_FALLBACK_POSITION: [number, number, number] = [-6, 3.5, 4];

/* ============ 骰子点数（标准点数布局，不依赖字体） ============ */
const PIP_POSITIONS: Record<number, Array<[number, number]>> = {
  1: [[0, 0]],
  2: [[-0.25, 0.25], [0.25, -0.25]],
  3: [[-0.28, 0.28], [0, 0], [0.28, -0.28]],
  4: [[-0.25, 0.25], [0.25, 0.25], [-0.25, -0.25], [0.25, -0.25]],
  5: [[-0.28, 0.28], [0.28, 0.28], [0, 0], [-0.28, -0.28], [0.28, -0.28]],
  6: [
    [-0.28, 0.28], [0.28, 0.28],
    [-0.28, 0], [0.28, 0],
    [-0.28, -0.28], [0.28, -0.28],
  ],
};

const PipDots: React.FC<{ face: number }> = ({ face }) => {
  const pips = PIP_POSITIONS[face] ?? [];
  return (
    <>
      {pips.map(([px, py], i) => (
        <mesh key={i} position={[px, py, 0.01]}>
          <circleGeometry args={[0.08, 16]} />
          <meshBasicMaterial color="#1f2937" />
        </mesh>
      ))}
    </>
  );
};

const Dice: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const phase = useJumpStore((s) => s.phase);
  const currentDice = useJumpStore((s) => s.currentDice);
  const [rollStart, setRollStart] = useState<number | null>(null);
  const { camera } = useThree();
  const tempPos = useRef(new THREE.Vector3());

  // rolling → 1.5s 后 resolveDice
  useEffect(() => {
    if (phase === 'rolling') {
      setRollStart(performance.now());
      const t = setTimeout(() => {
        useJumpStore.getState().resolveDice();
      }, DICE_ROLL_DURATION_MS);
      return () => clearTimeout(t);
    } else if (phase !== 'resolving') {
      setRollStart(null);
    }
  }, [phase]);

  // resolving → 横幅停留后 endTurn 切换回合
  useEffect(() => {
    if (phase === 'resolving') {
      const t = setTimeout(() => {
        useJumpStore.getState().endTurn();
      }, EVENT_BANNER_DURATION_MS + TURN_SWITCH_DELAY_MS);
      return () => clearTimeout(t);
    }
  }, [phase]);

  useFrame((_, dt) => {
    if (!groupRef.current) return;

    // —— 位置：每帧把骰子放到相机本地坐标系的左下方，保证镜头无论怎么动都能看到 ——
    tempPos.current.copy(DICE_CAMERA_OFFSET);
    tempPos.current.applyMatrix4(camera.matrixWorld);
    // 加一点 Y 浮动（基于 elapsed）
    const floatY = Math.sin(performance.now() * 0.002) * 0.15;
    groupRef.current.position.set(
      tempPos.current.x,
      tempPos.current.y + floatY,
      tempPos.current.z,
    );

    // —— 旋转：按 phase 决定 ——
    if (phase === 'rolling' && rollStart !== null) {
      const elapsed = performance.now() - rollStart;
      const t = Math.min(1, elapsed / DICE_ROLL_DURATION_MS);
      const speed = 12 * (1 - t * 0.7);
      groupRef.current.rotation.x += speed * dt;
      groupRef.current.rotation.y += speed * dt * 0.8;
      groupRef.current.rotation.z += speed * dt * 0.3;
      if (t > 0.85 && currentDice) {
        const target = FACE_ROTATIONS[currentDice.face];
        const k = (t - 0.85) / 0.15;
        groupRef.current.rotation.x =
          THREE.MathUtils.lerp(groupRef.current.rotation.x, target[0], k);
        groupRef.current.rotation.y =
          THREE.MathUtils.lerp(groupRef.current.rotation.y, target[1], k);
        groupRef.current.rotation.z =
          THREE.MathUtils.lerp(groupRef.current.rotation.z, target[2], k);
      }
    } else if (phase === 'resolving' && currentDice) {
      const target = FACE_ROTATIONS[currentDice.face];
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        target[0],
        0.2,
      );
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        target[1],
        0.2,
      );
      groupRef.current.rotation.z = THREE.MathUtils.lerp(
        groupRef.current.rotation.z,
        target[2],
        0.2,
      );
    } else {
      groupRef.current.rotation.y += dt * 0.6;
    }
  });

  // 6 个面的子 Mesh：每个面在立方体的一个外侧绘制数字
  const faces = useMemo(
    () => [
      { face: 1, position: [0, 0, 0.51] as [number, number, number], rotation: [0, 0, 0] as [number, number, number] },
      { face: 3, position: [0, 0, -0.51] as [number, number, number], rotation: [0, Math.PI, 0] as [number, number, number] },
      { face: 2, position: [0.51, 0, 0] as [number, number, number], rotation: [0, Math.PI / 2, 0] as [number, number, number] },
      { face: 4, position: [-0.51, 0, 0] as [number, number, number], rotation: [0, -Math.PI / 2, 0] as [number, number, number] },
      { face: 5, position: [0, 0.51, 0] as [number, number, number], rotation: [-Math.PI / 2, 0, 0] as [number, number, number] },
      { face: 6, position: [0, -0.51, 0] as [number, number, number], rotation: [Math.PI / 2, 0, 0] as [number, number, number] },
    ],
    [],
  );

  // 当前回合方颜色（骰子边发光）
  const turn = useJumpStore((s) => s.currentTurn);
  const turnColor = turn === 'p1' ? '#00d4ff' : turn === 'p2' ? '#ff4d8d' : '#ffffff';

  return (
    <group ref={groupRef} position={DICE_FALLBACK_POSITION}>
      {/* 骰子本体（白色立方体） */}
      <mesh castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color="#ffffff"
          roughness={0.4}
          metalness={0.1}
          emissive={turnColor}
          emissiveIntensity={0.15}
        />
      </mesh>
      {/* 6 面数字（用 PipDots 圆点而非 Text，避免字体下载依赖） */}
      {faces.map(({ face, position, rotation }) => (
        <group key={face} position={position} rotation={rotation}>
          <PipDots face={face} />
        </group>
      ))}
      {/* 光晕 */}
      <pointLight color={turnColor} intensity={1.5} distance={5} />
    </group>
  );
};

export default Dice;
