/**
 * 浪尖踏歌 - 全局 store（zustand）
 * 跳一跳海洋模式：掷骰子 → 逐格跳 → 事件文案
 */
import { create } from 'zustand';
import {
  DICE_EVENTS,
  PLATFORM_EVENTS,
  TOTAL_PLATFORMS,
} from './constants';
import type {
  CurrentTurn,
  DiceEvent,
  DiceFace,
  WavePhase,
  WavePlayerState,
  WinnerSide,
  PlayerId,
} from './types';

interface WaveStore {
  phase: WavePhase;
  currentTurn: CurrentTurn;
  currentDice: DiceEvent | null;
  eventBanner: { title: string; detail: string; icon: string } | null;
  winner: WinnerSide;
  startedAt: number | null;
  finishedAt: number | null;
  p1: WavePlayerState;
  p2: WavePlayerState;
  ready: { p1: boolean; p2: boolean };

  /* actions */
  setReady: (side: PlayerId, value: boolean) => void;
  rollDice: (side: PlayerId) => DiceFace | null;
  resolveDice: () => void;
  endTurn: () => void;
  reset: () => void;
}

const initialPlayer = (side: PlayerId, name: string): WavePlayerState => ({
  side,
  name,
  platformIndex: 0,
  finished: false,
  finishedAt: null,
});

const clampPlatform = (i: number) =>
  Math.max(0, Math.min(TOTAL_PLATFORMS - 1, i));

export const useWaveStore = create<WaveStore>((set, get) => ({
  phase: 'idle',
  currentTurn: null,
  currentDice: null,
  eventBanner: null,
  winner: null,
  startedAt: null,
  finishedAt: null,
  ready: { p1: false, p2: false },
  p1: initialPlayer('p1', '玩家 1'),
  p2: initialPlayer('p2', '玩家 2'),

  setReady: (side, value) =>
    set((s) => {
      const next = { ...s.ready, [side]: value };
      if (next.p1 && next.p2 && s.phase === 'idle') {
        const first: PlayerId = Math.random() < 0.5 ? 'p1' : 'p2';
        return {
          ready: next,
          phase: first === 'p1' ? 'p1_turn' : 'p2_turn',
          currentTurn: first,
          startedAt: Date.now(),
        };
      }
      return { ready: next };
    }),

  rollDice: (side) => {
    const s = get();
    if (s.phase !== 'p1_turn' && s.phase !== 'p2_turn') return null;
    if (s.currentTurn !== side) return null;
    const face = (Math.floor(Math.random() * 6) + 1) as DiceFace;
    const event = DICE_EVENTS[face - 1];
    set({ phase: 'rolling', currentDice: event });
    return face;
  },

  resolveDice: () => {
    const s = get();
    if (s.phase !== 'rolling' || !s.currentDice) return;
    const side = s.currentTurn;
    if (!side) return;
    const me = side === 'p1' ? { ...s.p1 } : { ...s.p2 };

    // 骰几走几
    const steps = s.currentDice.face;
    me.platformIndex = clampPlatform(me.platformIndex + steps);

    // 到达格子的文案
    const platformText = PLATFORM_EVENTS[me.platformIndex] ?? `第 ${me.platformIndex} 格`;
    const banner = {
      title: s.currentDice.name,
      detail: platformText,
      icon: s.currentDice.icon,
    };

    // 检查终点
    let phase: WavePhase = 'resolving';
    let winner: WinnerSide = null;
    let finishedAt: number | null = null;
    if (me.platformIndex >= TOTAL_PLATFORMS - 1) {
      me.platformIndex = TOTAL_PLATFORMS - 1;
      me.finished = true;
      me.finishedAt = Date.now();
      phase = 'finished';
      winner = side;
      finishedAt = Date.now();
    }

    const update: Partial<WaveStore> = {
      phase,
      eventBanner: banner,
      winner,
      finishedAt: finishedAt ?? s.finishedAt,
    };
    if (side === 'p1') {
      update.p1 = me;
    } else {
      update.p2 = me;
    }
    set(update);
  },

  endTurn: () => {
    const s = get();
    if (s.phase === 'finished') return;
    if (s.phase !== 'resolving') return;
    const nextSide: PlayerId = s.currentTurn === 'p1' ? 'p2' : 'p1';
    set({
      phase: nextSide === 'p1' ? 'p1_turn' : 'p2_turn',
      currentTurn: nextSide,
      currentDice: null,
      eventBanner: null,
    });
  },

  reset: () =>
    set({
      phase: 'idle',
      currentTurn: null,
      currentDice: null,
      eventBanner: null,
      winner: null,
      startedAt: null,
      finishedAt: null,
      ready: { p1: false, p2: false },
      p1: initialPlayer('p1', '玩家 1'),
      p2: initialPlayer('p2', '玩家 2'),
    }),
}));
