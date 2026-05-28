/**
 * 低多边形 3D 宠物模型集合（不依赖外部 GLB）
 * 用 R3F 原始几何体（Capsule/Sphere/Cone/Cylinder/Box）拼接，
 * 画风与项目内"云上之巅 / 跳一跳"完全一致。
 *
 * 所有动物共享接口：
 *   - mood: 0~100，影响呼吸频率（高 mood → 更欢快）
 *   - level: 1+，影响头顶光环亮度
 *   - excited: 训练动画时为 true，触发跳跃 + 旋转
 */
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface PetModelProps {
  mood?: number;
  level?: number;
  excited?: boolean;
  /** 缩放（详情页用 1，卡片用 0.6） */
  scale?: number;
}

/** 通用呼吸 + 训练动画 hook */
function useBreathing(
  group: React.RefObject<THREE.Group>,
  mood: number,
  excited: boolean,
) {
  const t0 = useRef(Math.random() * Math.PI * 2);
  useFrame((_, dt) => {
    if (!group.current) return;
    t0.current += dt;
    const speed = 1.6 + (mood / 100) * 1.2; // mood 越高呼吸越快
    const breathe = 1 + Math.sin(t0.current * speed) * 0.04;
    group.current.scale.setScalar(breathe);
    // 训练时：原地小跳 + 自转
    if (excited) {
      group.current.position.y = Math.abs(Math.sin(t0.current * 6)) * 0.4;
      group.current.rotation.y += dt * 2.5;
    } else {
      group.current.position.y *= 0.9; // 缓回原位
      group.current.rotation.y *= 0.95;
    }
  });
}

/** 头顶光环（按 level 显示亮度） */
const LevelHalo: React.FC<{ level: number; y: number; color: string }> = ({ level, y, color }) => {
  if (level < 2) return null;
  const intensity = Math.min(1, (level - 1) * 0.15 + 0.3);
  return (
    <mesh position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[0.35, 0.04, 8, 24]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={intensity * 2}
        transparent
        opacity={0.85}
      />
    </mesh>
  );
};

/** 由 mood 衰减颜色饱和度 */
function moodTint(base: string, mood: number): string {
  if (mood >= 60) return base;
  // mood 越低越灰
  const c = new THREE.Color(base);
  const gray = new THREE.Color('#888');
  return '#' + c.lerp(gray, (60 - mood) / 80).getHexString();
}

/* ====================== 🐱 猫 ====================== */
export const CatModel: React.FC<PetModelProps> = ({ mood = 80, level = 1, excited = false, scale = 1 }) => {
  const group = useRef<THREE.Group>(null);
  useBreathing(group, mood, excited);
  const body = moodTint('#f5a25d', mood);
  const dark = '#3a2a1a';
  return (
    <group ref={group} scale={scale}>
      {/* 身体 */}
      <mesh position={[0, 0.35, 0]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.28, 0.45, 6, 12]} />
        <meshStandardMaterial color={body} roughness={0.7} />
      </mesh>
      {/* 头 */}
      <mesh position={[0.42, 0.6, 0]}>
        <sphereGeometry args={[0.26, 16, 16]} />
        <meshStandardMaterial color={body} roughness={0.7} />
      </mesh>
      {/* 耳朵 */}
      <mesh position={[0.35, 0.88, -0.12]} rotation={[0, 0, -0.2]}>
        <coneGeometry args={[0.1, 0.22, 4]} />
        <meshStandardMaterial color={body} />
      </mesh>
      <mesh position={[0.35, 0.88, 0.12]} rotation={[0, 0, -0.2]}>
        <coneGeometry args={[0.1, 0.22, 4]} />
        <meshStandardMaterial color={body} />
      </mesh>
      {/* 眼睛 */}
      <mesh position={[0.6, 0.62, -0.1]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color={dark} />
      </mesh>
      <mesh position={[0.6, 0.62, 0.1]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color={dark} />
      </mesh>
      {/* 鼻子 */}
      <mesh position={[0.66, 0.55, 0]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color="#ff6b9d" />
      </mesh>
      {/* 尾巴 */}
      <mesh position={[-0.42, 0.55, 0]} rotation={[0, 0, 1.1]}>
        <cylinderGeometry args={[0.05, 0.07, 0.5, 8]} />
        <meshStandardMaterial color={body} />
      </mesh>
      {/* 4 条腿 */}
      {[[-0.15, -0.12], [0.15, -0.12], [-0.15, 0.12], [0.15, 0.12]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.1, z]}>
          <cylinderGeometry args={[0.07, 0.08, 0.35, 8]} />
          <meshStandardMaterial color={body} />
        </mesh>
      ))}
      <LevelHalo level={level} y={1.1} color="#ffd60a" />
    </group>
  );
};

/* ====================== 🐶 狗 ====================== */
export const DogModel: React.FC<PetModelProps> = ({ mood = 80, level = 1, excited = false, scale = 1 }) => {
  const group = useRef<THREE.Group>(null);
  useBreathing(group, mood, excited);
  const body = moodTint('#a06a3f', mood);
  const dark = '#3a2a1a';
  return (
    <group ref={group} scale={scale}>
      <mesh position={[0, 0.4, 0]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.32, 0.55, 6, 12]} />
        <meshStandardMaterial color={body} roughness={0.8} />
      </mesh>
      <mesh position={[0.5, 0.6, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color={body} roughness={0.8} />
      </mesh>
      {/* 嘴部前突 */}
      <mesh position={[0.75, 0.5, 0]}>
        <boxGeometry args={[0.22, 0.18, 0.22]} />
        <meshStandardMaterial color={body} />
      </mesh>
      {/* 下垂的耳朵 */}
      <mesh position={[0.4, 0.7, -0.25]} rotation={[0, 0, -0.4]}>
        <boxGeometry args={[0.1, 0.3, 0.12]} />
        <meshStandardMaterial color="#7a4a25" />
      </mesh>
      <mesh position={[0.4, 0.7, 0.25]} rotation={[0, 0, -0.4]}>
        <boxGeometry args={[0.1, 0.3, 0.12]} />
        <meshStandardMaterial color="#7a4a25" />
      </mesh>
      {/* 眼睛 */}
      <mesh position={[0.7, 0.65, -0.12]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color={dark} />
      </mesh>
      <mesh position={[0.7, 0.65, 0.12]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color={dark} />
      </mesh>
      {/* 鼻子 */}
      <mesh position={[0.87, 0.52, 0]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color={dark} />
      </mesh>
      {/* 短尾 */}
      <mesh position={[-0.5, 0.55, 0]} rotation={[0, 0, 0.6]}>
        <cylinderGeometry args={[0.06, 0.04, 0.3, 8]} />
        <meshStandardMaterial color={body} />
      </mesh>
      {[[-0.2, -0.15], [0.2, -0.15], [-0.2, 0.15], [0.2, 0.15]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.12, z]}>
          <cylinderGeometry args={[0.08, 0.09, 0.4, 8]} />
          <meshStandardMaterial color={body} />
        </mesh>
      ))}
      <LevelHalo level={level} y={1.15} color="#ffd60a" />
    </group>
  );
};

/* ====================== 🐉 龙 ====================== */
export const DragonModel: React.FC<PetModelProps> = ({ mood = 80, level = 1, excited = false, scale = 1 }) => {
  const group = useRef<THREE.Group>(null);
  const wings = useRef<THREE.Group>(null);
  useBreathing(group, mood, excited);
  useFrame((_, dt) => {
    // 翅膀扇动
    if (wings.current) {
      wings.current.rotation.z = Math.sin(performance.now() * 0.006) * 0.35;
    }
  });
  const body = moodTint('#9b5de5', mood);
  const belly = '#f3c4fb';
  return (
    <group ref={group} scale={scale}>
      <mesh position={[0, 0.45, 0]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.3, 0.55, 6, 12]} />
        <meshStandardMaterial color={body} roughness={0.5} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.32, 0]} rotation={[0, 0, Math.PI / 2]} scale={[1, 0.7, 0.7]}>
        <capsuleGeometry args={[0.22, 0.4, 6, 10]} />
        <meshStandardMaterial color={belly} />
      </mesh>
      <mesh position={[0.5, 0.65, 0]}>
        <sphereGeometry args={[0.28, 16, 16]} />
        <meshStandardMaterial color={body} roughness={0.5} metalness={0.2} />
      </mesh>
      {/* 眼睛（金色） */}
      <mesh position={[0.68, 0.7, -0.12]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#ffd60a" emissive="#ffd60a" emissiveIntensity={0.6} />
      </mesh>
      <mesh position={[0.68, 0.7, 0.12]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#ffd60a" emissive="#ffd60a" emissiveIntensity={0.6} />
      </mesh>
      {/* 头角 */}
      <mesh position={[0.42, 0.95, -0.1]} rotation={[0, 0, 0.3]}>
        <coneGeometry args={[0.06, 0.22, 6]} />
        <meshStandardMaterial color="#fff" />
      </mesh>
      <mesh position={[0.42, 0.95, 0.1]} rotation={[0, 0, 0.3]}>
        <coneGeometry args={[0.06, 0.22, 6]} />
        <meshStandardMaterial color="#fff" />
      </mesh>
      {/* 背刺 3 个 */}
      {[0.05, -0.15, -0.35].map((x, i) => (
        <mesh key={i} position={[x, 0.78, 0]} rotation={[0, 0, 0]}>
          <coneGeometry args={[0.08, 0.18, 4]} />
          <meshStandardMaterial color={belly} />
        </mesh>
      ))}
      {/* 翅膀 */}
      <group ref={wings} position={[0, 0.6, 0]}>
        <mesh position={[0, 0, -0.35]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.35, 0.5, 4]} />
          <meshStandardMaterial color={body} side={THREE.DoubleSide} transparent opacity={0.85} />
        </mesh>
        <mesh position={[0, 0, 0.35]} rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.35, 0.5, 4]} />
          <meshStandardMaterial color={body} side={THREE.DoubleSide} transparent opacity={0.85} />
        </mesh>
      </group>
      {/* 尾巴 - 多节 */}
      {[
        [-0.45, 0.45, 0, 0.18],
        [-0.65, 0.4, 0, 0.14],
        [-0.82, 0.32, 0, 0.1],
      ].map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]}>
          <sphereGeometry args={[r, 10, 10]} />
          <meshStandardMaterial color={body} />
        </mesh>
      ))}
      <mesh position={[-0.95, 0.28, 0]} rotation={[0, 0, -0.5]}>
        <coneGeometry args={[0.08, 0.18, 4]} />
        <meshStandardMaterial color={belly} />
      </mesh>
      <LevelHalo level={level} y={1.3} color="#ff4d8d" />
    </group>
  );
};

/* ====================== 🐤 鸟 ====================== */
export const BirdModel: React.FC<PetModelProps> = ({ mood = 80, level = 1, excited = false, scale = 1 }) => {
  const group = useRef<THREE.Group>(null);
  const wings = useRef<THREE.Group>(null);
  useBreathing(group, mood, excited);
  useFrame(() => {
    if (wings.current) {
      wings.current.rotation.z = Math.sin(performance.now() * 0.012) * 0.4;
    }
  });
  const body = moodTint('#ffd60a', mood);
  const beak = '#ff8c00';
  return (
    <group ref={group} scale={scale}>
      {/* 圆胖身体 */}
      <mesh position={[0, 0.45, 0]}>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshStandardMaterial color={body} roughness={0.6} />
      </mesh>
      {/* 头 */}
      <mesh position={[0, 0.85, 0]}>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial color={body} roughness={0.6} />
      </mesh>
      {/* 喙 */}
      <mesh position={[0.22, 0.82, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.08, 0.18, 4]} />
        <meshStandardMaterial color={beak} />
      </mesh>
      {/* 眼睛 */}
      <mesh position={[0.15, 0.92, -0.12]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#000" />
      </mesh>
      <mesh position={[0.15, 0.92, 0.12]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#000" />
      </mesh>
      {/* 头顶呆毛 */}
      <mesh position={[0, 1.08, 0]} rotation={[0, 0, 0.2]}>
        <coneGeometry args={[0.04, 0.16, 4]} />
        <meshStandardMaterial color={beak} />
      </mesh>
      {/* 翅膀 */}
      <group ref={wings}>
        <mesh position={[0, 0.45, -0.32]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.2, 0.4, 4]} />
          <meshStandardMaterial color={body} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0.45, 0.32]} rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.2, 0.4, 4]} />
          <meshStandardMaterial color={body} side={THREE.DoubleSide} />
        </mesh>
      </group>
      {/* 小爪子 */}
      <mesh position={[-0.08, 0.1, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.2, 6]} />
        <meshStandardMaterial color={beak} />
      </mesh>
      <mesh position={[0.08, 0.1, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.2, 6]} />
        <meshStandardMaterial color={beak} />
      </mesh>
      <LevelHalo level={level} y={1.25} color="#00d4ff" />
    </group>
  );
};

/* ====================== 🐰 兔 ====================== */
export const RabbitModel: React.FC<PetModelProps> = ({ mood = 80, level = 1, excited = false, scale = 1 }) => {
  const group = useRef<THREE.Group>(null);
  useBreathing(group, mood, excited);
  const body = moodTint('#fafafa', mood);
  const inner = '#ffb3d9';
  return (
    <group ref={group} scale={scale}>
      {/* 圆身体 */}
      <mesh position={[0, 0.4, 0]}>
        <sphereGeometry args={[0.32, 16, 16]} />
        <meshStandardMaterial color={body} roughness={0.9} />
      </mesh>
      {/* 头 */}
      <mesh position={[0.05, 0.75, 0]}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color={body} roughness={0.9} />
      </mesh>
      {/* 长耳朵 */}
      <mesh position={[0, 1.1, -0.1]} rotation={[0, 0, 0.15]} scale={[0.5, 1, 0.5]}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshStandardMaterial color={body} />
      </mesh>
      <mesh position={[0, 1.1, 0.1]} rotation={[0, 0, 0.15]} scale={[0.5, 1, 0.5]}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshStandardMaterial color={body} />
      </mesh>
      {/* 耳朵内 */}
      <mesh position={[0.02, 1.1, -0.1]} rotation={[0, 0, 0.15]} scale={[0.3, 0.85, 0.3]}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshStandardMaterial color={inner} />
      </mesh>
      <mesh position={[0.02, 1.1, 0.1]} rotation={[0, 0, 0.15]} scale={[0.3, 0.85, 0.3]}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshStandardMaterial color={inner} />
      </mesh>
      {/* 眼睛 */}
      <mesh position={[0.25, 0.78, -0.1]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#000" />
      </mesh>
      <mesh position={[0.25, 0.78, 0.1]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#000" />
      </mesh>
      {/* 粉鼻 */}
      <mesh position={[0.3, 0.7, 0]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color={inner} />
      </mesh>
      {/* 球尾 */}
      <mesh position={[-0.32, 0.45, 0]}>
        <sphereGeometry args={[0.1, 10, 10]} />
        <meshStandardMaterial color={body} />
      </mesh>
      {/* 短腿 */}
      {[[-0.12, -0.1], [0.12, -0.1], [-0.12, 0.1], [0.12, 0.1]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.08, z]}>
          <cylinderGeometry args={[0.07, 0.08, 0.18, 8]} />
          <meshStandardMaterial color={body} />
        </mesh>
      ))}
      <LevelHalo level={level} y={1.4} color="#ff4d8d" />
    </group>
  );
};

/* ====================== 路由器 ====================== */
export const PetModel: React.FC<PetModelProps & { species: string }> = ({ species, ...rest }) => {
  switch (species) {
    case 'cat': return <CatModel {...rest} />;
    case 'dog': return <DogModel {...rest} />;
    case 'dragon': return <DragonModel {...rest} />;
    case 'bird': return <BirdModel {...rest} />;
    case 'rabbit': return <RabbitModel {...rest} />;
    default: return <CatModel {...rest} />;
  }
};
