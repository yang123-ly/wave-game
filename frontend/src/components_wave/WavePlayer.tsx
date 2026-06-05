/**
 * 浪尖踏歌 - 玩家组件（逐格跳跃模式）
 * 使用 GltfAvatar 3D 人物模型，支持逐格跳跃队列动画
 */
import React, { Suspense, useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  JUMP_DURATION_MS,
  JUMP_PEAK_HEIGHT,
  P1_COLOR,
  P2_COLOR,
  getWavePlatformPosition,
} from '../engine_wave/constants';
import { useWaveStore } from '../engine_wave/waveStore';
import type { PlayerId } from '../engine_wave/types';
import GltfAvatar from '../components_profile/GltfAvatar';

/* ============ 模型配置（同跳一跳） ============ */
const P1_URL = '/models/Michelle.glb';
const P1_SCALE = 2.0;
const P1_IDLE = 'SambaDance';
const P1_EXTRA_ANIMS = [{ name: 'Jump', url: '/models/JumpingDown.fbx' }];
const P1_POSITION_Y = 0;

const P2_URL = '/models/DropKick.fbx';
const P2_SCALE = 0.025;
const P2_IDLE = 'Breakdance1990';
const P2_EXTRA_ANIMS = [
  { name: 'Breakdance1990', url: '/models/Breakdance1990.fbx' },
  { name: 'Jump', url: '/models/JumpingDown.fbx' },
];
const P2_POSITION_Y = 0.9;

/** 玩家站在格子上方的高度偏移 */
const STAND_Y_OFFSET = 2.0;
/** P2 额外站高（码头棋盘更高） */
const P2_EXTRA_Y = 1.2;
/** 头顶指示器高度 */
const INDICATOR_HEIGHT = 5.0;
/** 两个玩家站同一格时的 X 方向错开距离 */
const SAME_TILE_OFFSET_X = 1.5;

/**
 * 暴露当前跳跃中的格子索引（供相机读取）
 * key = playerId, value = 当前正跳向的格子 index（null 表示不在跳跃中）
 */
export const jumpingTargetIndex: Record<string, number | null> = { p1: null, p2: null };

interface Props {
  playerId: PlayerId;
}

interface JumpSegment {
  from: THREE.Vector3;
  to: THREE.Vector3;
}

const WavePlayer: React.FC<Props> = ({ playerId }) => {
  const groupRef = useRef<THREE.Group>(null);
  const player = useWaveStore((s) => s[playerId]);
  const otherPlayer = useWaveStore((s) => s[playerId === 'p1' ? 'p2' : 'p1']);

  const color = playerId === 'p1' ? P1_COLOR : P2_COLOR;
  const modelUrl = playerId === 'p1' ? P1_URL : P2_URL;
  const modelScale = playerId === 'p1' ? P1_SCALE : P2_SCALE;
  const modelPositionY = playerId === 'p1' ? P1_POSITION_Y : P2_POSITION_Y;
  const idleAnim = playerId === 'p1' ? P1_IDLE : P2_IDLE;
  const extraAnims = playerId === 'p1' ? P1_EXTRA_ANIMS : P2_EXTRA_ANIMS;

  const [animName, setAnimName] = useState<string>(idleAnim);

  // 逐格跳跃队列
  const jumpQueue = useRef<JumpSegment[]>([]);
  const jumpStartTime = useRef<number>(0);
  const prevIndex = useRef<number>(player.platformIndex);
  /** 跳跃起始格索引（构建队列时记录） */
  const jumpFromIndex = useRef<number>(0);

  // 当 platformIndex 变化时，构建逐格跳跃队列
  useEffect(() => {
    const oldIdx = prevIndex.current;
    const newIdx = player.platformIndex;
    if (newIdx === oldIdx) return;
    jumpFromIndex.current = oldIdx;
    prevIndex.current = newIdx;

    const queue: JumpSegment[] = [];
    const step = newIdx > oldIdx ? 1 : -1;
    for (let i = oldIdx; i !== newIdx; i += step) {
      const fromPos = getWavePlatformPosition(i);
      const toPos = getWavePlatformPosition(i + step);
      queue.push({
        from: new THREE.Vector3(fromPos[0], fromPos[1] + STAND_Y_OFFSET, fromPos[2]),
        to: new THREE.Vector3(toPos[0], toPos[1] + STAND_Y_OFFSET, toPos[2]),
      });
    }
    jumpQueue.current = queue;
    jumpStartTime.current = performance.now();
    setAnimName('Jump');
  }, [player.platformIndex]);

  useFrame(() => {
    const g = groupRef.current;
    if (!g) return;
    const now = performance.now();
    const queue = jumpQueue.current;

    if (queue.length > 0) {
      const elapsed = now - jumpStartTime.current;
      const segIndex = Math.floor(elapsed / JUMP_DURATION_MS);

      if (segIndex >= queue.length) {
        // 全部跳完
        const lastSeg = queue[queue.length - 1];
        g.position.copy(lastSeg.to);
        jumpQueue.current = [];
        jumpingTargetIndex[playerId] = null;
        setAnimName(idleAnim);
        return;
      }

      // 暴露当前正在跳向的格子索引（供相机跟随）
      const step = player.platformIndex > jumpFromIndex.current ? 1 : -1;
      jumpingTargetIndex[playerId] = jumpFromIndex.current + (segIndex + 1) * step;

      const seg = queue[segIndex];
      const segElapsed = elapsed - segIndex * JUMP_DURATION_MS;
      const progress = Math.min(1, segElapsed / JUMP_DURATION_MS);

      const x = THREE.MathUtils.lerp(seg.from.x, seg.to.x, progress);
      const z = THREE.MathUtils.lerp(seg.from.z, seg.to.z, progress);
      const y = THREE.MathUtils.lerp(seg.from.y, seg.to.y, progress)
        + JUMP_PEAK_HEIGHT * 4 * progress * (1 - progress);
      g.position.set(x, y, z);

      // 朝向落点
      const dir = new THREE.Vector3().subVectors(seg.to, seg.from);
      if (dir.lengthSq() > 0.001) {
        g.rotation.y = Math.atan2(dir.x, dir.z);
      }
      return;
    }

    // 待机：站在当前格子上，跟格子浮动同步
    const pos = getWavePlatformPosition(player.platformIndex);
    const t = now * 0.001;
    const platformFloatY = Math.sin(t * 0.8 + player.platformIndex * 0.9) * 0.2;
    const extraY = playerId === 'p2' ? P2_EXTRA_Y : 0;

    // 两个玩家站同一格时，X 方向错开：p1 偏左，p2 偏右
    let offsetX = 0;
    if (player.platformIndex === otherPlayer.platformIndex && jumpQueue.current.length === 0) {
      offsetX = playerId === 'p1' ? -SAME_TILE_OFFSET_X : SAME_TILE_OFFSET_X;
    }

    g.position.set(pos[0] + offsetX, platformFloatY + STAND_Y_OFFSET + extraY, pos[2]);
  });

  return (
    <group ref={groupRef}>
      {/* 头顶指示箭头（缩小时也能看到） */}
      <mesh position={[0, INDICATOR_HEIGHT, 0]}>
        <coneGeometry args={[0.4, 0.8, 4]} />
        <meshBasicMaterial color={color} transparent opacity={0.9} />
      </mesh>
      {/* 箭头上方小球（更醒目） */}
      <mesh position={[0, INDICATOR_HEIGHT + 0.7, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>

      {/* 脚下光环（独立于模型 scale） */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
        <ringGeometry args={[1.0, 1.3, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.85} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <circleGeometry args={[1.0, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.2} />
      </mesh>

      <Suspense fallback={null}>
        <GltfAvatar
          url={modelUrl}
          scale={modelScale}
          position={[0, modelPositionY, 0]}
          animationName={animName}
          extraAnimations={extraAnims}
        />
      </Suspense>
    </group>
  );
};

export default WavePlayer;
