/**
 * 浪尖踏歌 - 类型定义（跳一跳模式）
 */

export type PlayerId = 'p1' | 'p2';

export type WavePhase =
  | 'idle'       // 双方未 READY
  | 'p1_turn'   // P1 回合（等待投骰）
  | 'p2_turn'   // P2 回合（等待投骰）
  | 'rolling'   // 骰子滚动中
  | 'resolving' // 事件解算 + 跳跃动画中
  | 'finished'; // 对局结束

export type DiceFace = 1 | 2 | 3 | 4 | 5 | 6;

export type DiceEventKind = 'move1';

export interface DiceEvent {
  face: DiceFace;
  kind: DiceEventKind;
  name: string;
  icon: string;
  detail: string;
}

export interface WavePlayerState {
  side: PlayerId;
  name: string;
  platformIndex: number;
  finished: boolean;
  finishedAt: number | null;
}

export type CurrentTurn = PlayerId | null;
export type WinnerSide = PlayerId | null;
