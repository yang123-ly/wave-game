/**
 * 物理 / 玩法常量统一管理，方便联调
 */
import type { Vector3Tuple } from 'three';

/** 玩家移动速度（米/秒） */
export const PLAYER_MOVE_SPEED = 5.5;
/** 加速 buff 倍率 */
export const SPEED_BOOST_MULTIPLIER = 1.6;
/** 加速 buff 持续时间（ms） */
export const SPEED_BOOST_DURATION_MS = 3000;

/** 跳跃冲量 */
export const JUMP_IMPULSE = 7;
/** 起跳冷却（ms），避免持续按 Space 连跳 */
export const JUMP_COOLDOWN_MS = 350;

/** 玩家半身高（CapsuleCollider 的 halfHeight） */
export const PLAYER_HALF_HEIGHT = 0.4;
/** 玩家半径 */
export const PLAYER_RADIUS = 0.4;

/** 重力 Y（默认 R3F rapier 是 -9.81） */
export const GRAVITY: Vector3Tuple = [0, -18, 0];

/** 击退波半径 */
export const BLAST_RADIUS = 4;
/** 击退波推力 */
export const BLAST_IMPULSE = 14;

/** 玩家间推撞的额外水平推力（碰撞瞬间） */
export const PUSH_IMPULSE = 4;

/** 复活冷却（ms） */
export const RESPAWN_DELAY_MS = 1800;

/** 掉落 Y 阈值，低于此值触发复活 */
export const FALL_Y_THRESHOLD = -10;

/** 倒计时秒数 */
export const COUNTDOWN_SECONDS = 3;

/** 总赛道段数（每段起点是检查点） */
export const TOTAL_SEGMENTS = 6;

/** 段长度（沿 Z 方向） */
export const SEGMENT_LENGTH = 14;

/** 终点 Z 坐标（赛道沿 -Z 方向延伸） */
export const GOAL_Z = -(TOTAL_SEGMENTS - 1) * SEGMENT_LENGTH;

/** 起始 Z 坐标 */
export const START_Z = 0;

/** 玩家初始位置（z 在起点，x 左右错开） */
export const P1_SPAWN: Vector3Tuple = [-1.2, 1, 0];
export const P2_SPAWN: Vector3Tuple = [1.2, 1, 0];

/** 检查点位置数组（每段中间） */
export function getCheckpointPos(segmentIndex: number, side: 'p1' | 'p2'): Vector3Tuple {
  const x = side === 'p1' ? -1.2 : 1.2;
  const z = -segmentIndex * SEGMENT_LENGTH + 2; // 略靠后一点，避免重生即掉落
  return [x, 2, z];
}

/** 颜色（与 theme.css sky-* 一致） */
export const SKY_COLOR_TOP = '#87ceeb';
export const SKY_COLOR_HORIZON = '#fff7c8';
export const GRASS_COLOR = '#7ee787';
export const ROCK_COLOR = '#c4b5fd';
export const P1_COLOR = '#00d4ff';
export const P2_COLOR = '#ff4d8d';
