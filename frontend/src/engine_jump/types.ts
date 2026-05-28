/**
 * 跳一跳游戏类型定义
 */
import type { PlayerSide } from '../engine3d/types';

export type JumpPhase =
  | 'idle' // 双方未 READY
  | 'p1_turn' // P1 回合（等待投骰）
  | 'p2_turn' // P2 回合（等待投骰）
  | 'rolling' // 骰子滚动中
  | 'resolving' // 事件解算 + 跳跃动画中
  | 'finished'; // 对局结束

/** 骰子面（1-6） */
export type DiceFace = 1 | 2 | 3 | 4 | 5 | 6;

/** 骰子事件类型 */
export type DiceEventKind =
  | 'move1'
  | 'move3'
  | 'boost'
  | 'shield'
  | 'push'
  | 'swap';

export interface DiceEvent {
  face: DiceFace;
  kind: DiceEventKind;
  /** 事件名称（用于横幅显示） */
  name: string;
  /** 事件 emoji */
  icon: string;
  /** 事件副标题（用于横幅显示） */
  detail: string;
}

export interface JumpPlayerState {
  side: PlayerSide;
  name: string;
  /** 当前所在板编号 [0, TOTAL_PLATFORMS-1] */
  platformIndex: number;
  /** 持有的护盾数（每次 push/swap 消耗 1） */
  shieldCount: number;
  /** 下回合额外前进格数（boost 留存） */
  bonusNextTurn: number;
  /** 是否已到终点 */
  finished: boolean;
  /** 到达时间戳 */
  finishedAt: number | null;
}

export type CurrentTurn = PlayerSide | null;

export type WinnerSide = PlayerSide | null;
