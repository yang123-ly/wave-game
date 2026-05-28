/**
 * 3D 游戏类型定义
 */
import type { Vector3Tuple } from 'three';

export type PlayerSide = 'p1' | 'p2';

export type GamePhase = 'idle' | 'countdown' | 'playing' | 'finished';

export type PowerUpKind = 'speed' | 'shield' | 'blast';

export type WinnerSide = PlayerSide | 'draw' | null;

export interface PlayerState {
  side: PlayerSide;
  name: string;
  /** 当前位置（来自物理引擎，每帧同步） */
  position: Vector3Tuple;
  /** 当前持有的可释放道具（如击退波）；空表示无 */
  activePowerUp: PowerUpKind | null;
  /** 加速 buff 剩余毫秒数（>0 表示加速中） */
  speedBoostUntil: number;
  /** 护盾是否生效 */
  hasShield: boolean;
  /** 复活倒计时结束时间戳，0 表示存活 */
  respawnUntil: number;
  /** 已抵达终点 */
  finished: boolean;
  /** 抵达终点时间戳，用于排名 */
  finishedAt: number | null;
  /** 当前所在的检查点索引（每条 segment 起点为一个检查点） */
  lastCheckpoint: number;
}

