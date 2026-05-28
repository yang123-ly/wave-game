/**
 * 双玩家本地键盘输入 Hook（使用 KeyboardEvent.code，避免输入法干扰）
 *
 * P1: W/A/S/D + Space   |  F (释放技能)
 * P2: ↑/↓/←/→ + Enter  |  ShiftRight 或 ShiftLeft (释放技能)
 */
import { useEffect, useRef } from 'react';
import type { PlayerSide } from './types';

export interface KeyState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  /** 按下跳跃帧（仅在 keydown 触发瞬间为 true，一次性消费） */
  jumpPressed: boolean;
  /** 按下技能帧（一次性消费） */
  skillPressed: boolean;
}

export interface DualKeyState {
  p1: KeyState;
  p2: KeyState;
}

function freshKeyState(): KeyState {
  return {
    forward: false,
    backward: false,
    left: false,
    right: false,
    jumpPressed: false,
    skillPressed: false,
  };
}

/**
 * 返回 ref，物理循环里 mutable 读取
 */
export function useKeyboardControls(): React.MutableRefObject<DualKeyState> {
  const ref = useRef<DualKeyState>({ p1: freshKeyState(), p2: freshKeyState() });

  useEffect(() => {
    const state = ref.current;

    const setKey = (side: PlayerSide, key: keyof KeyState, value: boolean) => {
      state[side][key] = value;
    };

    const onDown = (e: KeyboardEvent) => {
      switch (e.code) {
        // P1
        case 'KeyW': setKey('p1', 'forward', true); break;
        case 'KeyS': setKey('p1', 'backward', true); break;
        case 'KeyA': setKey('p1', 'left', true); break;
        case 'KeyD': setKey('p1', 'right', true); break;
        case 'Space':
          e.preventDefault();
          setKey('p1', 'jumpPressed', true);
          break;
        case 'KeyF': setKey('p1', 'skillPressed', true); break;
        // P2
        case 'ArrowUp':
          e.preventDefault();
          setKey('p2', 'forward', true);
          break;
        case 'ArrowDown':
          e.preventDefault();
          setKey('p2', 'backward', true);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setKey('p2', 'left', true);
          break;
        case 'ArrowRight':
          e.preventDefault();
          setKey('p2', 'right', true);
          break;
        case 'Enter':
          setKey('p2', 'jumpPressed', true);
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          setKey('p2', 'skillPressed', true);
          break;
        default:
          break;
      }
    };

    const onUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW': setKey('p1', 'forward', false); break;
        case 'KeyS': setKey('p1', 'backward', false); break;
        case 'KeyA': setKey('p1', 'left', false); break;
        case 'KeyD': setKey('p1', 'right', false); break;
        case 'ArrowUp': setKey('p2', 'forward', false); break;
        case 'ArrowDown': setKey('p2', 'backward', false); break;
        case 'ArrowLeft': setKey('p2', 'left', false); break;
        case 'ArrowRight': setKey('p2', 'right', false); break;
        default: break;
      }
    };

    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, []);

  return ref;
}

/** 消费 jumpPressed / skillPressed（边沿触发） */
export function consumeOneShot(state: KeyState, key: 'jumpPressed' | 'skillPressed'): boolean {
  if (state[key]) {
    state[key] = false;
    return true;
  }
  return false;
}
