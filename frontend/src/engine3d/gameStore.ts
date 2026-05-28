/**
 * 全局对局状态（zustand）
 * 独立于 React 渲染，物理循环可以直接读取/写入而不触发 re-render
 */
import { create } from 'zustand';
import type { Vector3Tuple } from 'three';
import type { GamePhase, PlayerSide, PlayerState, PowerUpKind, WinnerSide } from './types';
import {
  COUNTDOWN_SECONDS,
  P1_SPAWN,
  P2_SPAWN,
  RESPAWN_DELAY_MS,
  SPEED_BOOST_DURATION_MS,
} from './constants';

interface GameStore {
  phase: GamePhase;
  countdown: number;
  startedAt: number | null;
  finishedAt: number | null;
  winner: WinnerSide;
  p1: PlayerState;
  p2: PlayerState;

  /** 玩家准备状态 */
  ready: { p1: boolean; p2: boolean };

  // ===== actions =====
  setReady: (side: PlayerSide, value: boolean) => void;
  startCountdown: () => void;
  tickCountdown: () => void;
  startPlaying: () => void;
  finishGame: (winner: WinnerSide) => void;
  reset: () => void;

  /** 由物理引擎每帧调用，同步玩家位置 */
  updatePlayerPosition: (side: PlayerSide, pos: Vector3Tuple) => void;
  /** 玩家通过检查点 */
  setCheckpoint: (side: PlayerSide, index: number) => void;
  /** 玩家拾取道具 */
  pickPowerUp: (side: PlayerSide, kind: PowerUpKind) => void;
  /** 玩家释放可主动技能（如击退波） */
  consumeActivePowerUp: (side: PlayerSide) => void;
  /** 玩家护盾被击穿 */
  consumeShield: (side: PlayerSide) => void;
  /** 触发复活倒计时 */
  triggerRespawn: (side: PlayerSide) => void;
  /** 复活完成 */
  completeRespawn: (side: PlayerSide) => void;
  /** 玩家抵达终点 */
  reachGoal: (side: PlayerSide) => void;
}

const initialPlayer = (side: PlayerSide, name: string, spawn: Vector3Tuple): PlayerState => ({
  side,
  name,
  position: spawn,
  activePowerUp: null,
  speedBoostUntil: 0,
  hasShield: false,
  respawnUntil: 0,
  finished: false,
  finishedAt: null,
  lastCheckpoint: 0,
});

export const useGameStore = create<GameStore>((set, get) => ({
  phase: 'idle',
  countdown: COUNTDOWN_SECONDS,
  startedAt: null,
  finishedAt: null,
  winner: null,
  ready: { p1: false, p2: false },
  p1: initialPlayer('p1', '玩家 1', P1_SPAWN),
  p2: initialPlayer('p2', '玩家 2', P2_SPAWN),

  setReady: (side, value) =>
    set((s) => {
      const next = { ...s.ready, [side]: value };
      // 双方都 ready 自动进入倒计时
      if (next.p1 && next.p2 && s.phase === 'idle') {
        return { ready: next, phase: 'countdown', countdown: COUNTDOWN_SECONDS };
      }
      return { ready: next };
    }),

  startCountdown: () =>
    set({ phase: 'countdown', countdown: COUNTDOWN_SECONDS, winner: null }),

  tickCountdown: () => {
    const { countdown, phase } = get();
    if (phase !== 'countdown') return;
    if (countdown <= 1) {
      get().startPlaying();
    } else {
      set({ countdown: countdown - 1 });
    }
  },

  startPlaying: () => set({ phase: 'playing', startedAt: Date.now(), countdown: 0 }),

  finishGame: (winner) =>
    set({ phase: 'finished', winner, finishedAt: Date.now() }),

  reset: () =>
    set({
      phase: 'idle',
      countdown: COUNTDOWN_SECONDS,
      startedAt: null,
      finishedAt: null,
      winner: null,
      ready: { p1: false, p2: false },
      p1: initialPlayer('p1', '玩家 1', P1_SPAWN),
      p2: initialPlayer('p2', '玩家 2', P2_SPAWN),
    }),

  updatePlayerPosition: (side, pos) =>
    set((s) => ({ [side]: { ...s[side], position: pos } } as Partial<GameStore>)),

  setCheckpoint: (side, index) =>
    set((s) => {
      const p = s[side];
      if (index <= p.lastCheckpoint) return {} as Partial<GameStore>;
      return { [side]: { ...p, lastCheckpoint: index } } as Partial<GameStore>;
    }),

  pickPowerUp: (side, kind) =>
    set((s) => {
      const p = s[side];
      if (kind === 'speed') {
        return {
          [side]: { ...p, speedBoostUntil: Date.now() + SPEED_BOOST_DURATION_MS },
        } as Partial<GameStore>;
      }
      if (kind === 'shield') {
        return { [side]: { ...p, hasShield: true } } as Partial<GameStore>;
      }
      // blast 进入待释放槽（覆盖原槽位）
      return { [side]: { ...p, activePowerUp: 'blast' } } as Partial<GameStore>;
    }),

  consumeActivePowerUp: (side) =>
    set((s) => ({ [side]: { ...s[side], activePowerUp: null } } as Partial<GameStore>)),

  consumeShield: (side) =>
    set((s) => ({ [side]: { ...s[side], hasShield: false } } as Partial<GameStore>)),

  triggerRespawn: (side) =>
    set((s) => {
      const p = s[side];
      if (p.respawnUntil > 0 || p.finished) return {} as Partial<GameStore>;
      return {
        [side]: { ...p, respawnUntil: Date.now() + RESPAWN_DELAY_MS },
      } as Partial<GameStore>;
    }),

  completeRespawn: (side) =>
    set((s) => ({ [side]: { ...s[side], respawnUntil: 0 } } as Partial<GameStore>)),

  reachGoal: (side) =>
    set((s) => {
      const p = s[side];
      if (p.finished) return {} as Partial<GameStore>;
      const now = Date.now();
      const updated: Partial<GameStore> = {
        [side]: { ...p, finished: true, finishedAt: now },
      } as Partial<GameStore>;
      const other = side === 'p1' ? s.p2 : s.p1;
      // 如果对手已完成，结算
      if (other.finished) {
        const winner: WinnerSide =
          (other.finishedAt ?? Infinity) < now ? other.side : side;
        return {
          ...updated,
          phase: 'finished',
          winner,
          finishedAt: now,
        };
      }
      // 否则当前玩家直接获胜（先到为王）
      return {
        ...updated,
        phase: 'finished',
        winner: side,
        finishedAt: now,
      };
    }),
}));
