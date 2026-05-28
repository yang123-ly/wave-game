/**
 * 跳一跳全局状态（zustand）
 * - 管理回合制、骰子结果、玩家位置、buff
 */
import { create } from 'zustand';
import type { PlayerSide } from '../engine3d/types';
import {
  DICE_EVENTS,
  TOTAL_PLATFORMS,
} from './constants';
import type {
  CurrentTurn,
  DiceEvent,
  DiceFace,
  JumpPhase,
  JumpPlayerState,
  WinnerSide,
} from './types';

interface JumpStore {
  phase: JumpPhase;
  currentTurn: CurrentTurn;
  /** 当前回合的骰子结果（rolling/resolving 阶段有效） */
  currentDice: DiceEvent | null;
  /** 事件横幅文本（resolving 阶段显示） */
  eventBanner: { title: string; detail: string; icon: string } | null;
  winner: WinnerSide;
  startedAt: number | null;
  finishedAt: number | null;
  p1: JumpPlayerState;
  p2: JumpPlayerState;
  ready: { p1: boolean; p2: boolean };

  /* === actions === */
  setReady: (side: PlayerSide, value: boolean) => void;
  /** 投骰：随机 1-6 → 进入 rolling */
  rollDice: (side: PlayerSide) => DiceFace | null;
  /** rolling 动画结束 → resolving，执行事件 */
  resolveDice: () => void;
  /** 事件横幅结束 → 切换回合 / 结束 */
  endTurn: () => void;
  reset: () => void;
}

const initialPlayer = (side: PlayerSide, name: string): JumpPlayerState => ({
  side,
  name,
  platformIndex: 0,
  shieldCount: 0,
  bonusNextTurn: 0,
  finished: false,
  finishedAt: null,
});

const clampPlatform = (i: number) =>
  Math.max(0, Math.min(TOTAL_PLATFORMS - 1, i));

export const useJumpStore = create<JumpStore>((set, get) => ({
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
      // 双方都 ready：随机决定先手
      if (next.p1 && next.p2 && s.phase === 'idle') {
        const first: PlayerSide = Math.random() < 0.5 ? 'p1' : 'p2';
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
    const me = side === 'p1' ? s.p1 : s.p2;
    const opp = side === 'p1' ? s.p2 : s.p1;
    let nextMe = { ...me };
    let nextOpp = { ...opp };
    const banner = {
      title: s.currentDice.name,
      detail: s.currentDice.detail,
      icon: s.currentDice.icon,
    };

    switch (s.currentDice.kind) {
      case 'move1':
        nextMe.platformIndex = clampPlatform(
          nextMe.platformIndex + 1 + nextMe.bonusNextTurn,
        );
        nextMe.bonusNextTurn = 0;
        break;
      case 'move3':
        nextMe.platformIndex = clampPlatform(
          nextMe.platformIndex + 3 + nextMe.bonusNextTurn,
        );
        nextMe.bonusNextTurn = 0;
        break;
      case 'boost':
        nextMe.platformIndex = clampPlatform(
          nextMe.platformIndex + 2 + nextMe.bonusNextTurn,
        );
        nextMe.bonusNextTurn = 1;
        break;
      case 'shield':
        nextMe.shieldCount += 1;
        nextMe.bonusNextTurn = 0;
        break;
      case 'push':
        nextMe.platformIndex = clampPlatform(
          nextMe.platformIndex + 1 + nextMe.bonusNextTurn,
        );
        nextMe.bonusNextTurn = 0;
        if (nextOpp.shieldCount > 0) {
          nextOpp.shieldCount -= 1;
          banner.detail = '对方护盾抵消！';
        } else {
          nextOpp.platformIndex = clampPlatform(nextOpp.platformIndex - 2);
        }
        break;
      case 'swap': {
        // 仅在对方领先时触发；否则改为前进 2
        if (nextOpp.platformIndex > nextMe.platformIndex) {
          if (nextOpp.shieldCount > 0) {
            nextOpp.shieldCount -= 1;
            banner.detail = '对方护盾抵消互换！';
          } else {
            const tmp = nextMe.platformIndex;
            nextMe.platformIndex = nextOpp.platformIndex;
            nextOpp.platformIndex = tmp;
          }
        } else {
          nextMe.platformIndex = clampPlatform(
            nextMe.platformIndex + 2 + nextMe.bonusNextTurn,
          );
          banner.detail = '领先太多，改为前进 2 格！';
        }
        nextMe.bonusNextTurn = 0;
        break;
      }
    }

    // 检查终点
    let phase: JumpPhase = 'resolving';
    let winner: WinnerSide = null;
    let finishedAt: number | null = null;
    if (nextMe.platformIndex >= TOTAL_PLATFORMS - 1) {
      nextMe.platformIndex = TOTAL_PLATFORMS - 1;
      nextMe.finished = true;
      nextMe.finishedAt = Date.now();
      phase = 'finished';
      winner = side;
      finishedAt = Date.now();
    }

    const update: Partial<JumpStore> = {
      phase,
      eventBanner: banner,
      winner,
      finishedAt: finishedAt ?? s.finishedAt,
    };
    if (side === 'p1') {
      update.p1 = nextMe;
      update.p2 = nextOpp;
    } else {
      update.p1 = nextOpp;
      update.p2 = nextMe;
    }
    set(update);
  },

  endTurn: () => {
    const s = get();
    if (s.phase === 'finished') return;
    if (s.phase !== 'resolving') return;
    const nextSide: PlayerSide = s.currentTurn === 'p1' ? 'p2' : 'p1';
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
