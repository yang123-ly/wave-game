/**
 * 跳一跳常量
 */
import type { DiceEvent } from './types';

/** 赛道总板数（0..N-1，N-1 为终点旗板） */
export const TOTAL_PLATFORMS = 20;

/** 相邻两板的中心距离 */
export const PLATFORM_SPACING = 2.5;

/** 每 5 块板换一次方向（让赛道蜿蜒） */
export const TURN_EVERY = 5;
/** 转折时 X 方向偏移幅度 */
export const TURN_AMPLITUDE = 4;

/** 单次跳跃动画时长 */
export const JUMP_DURATION_MS = 600;
/** 跳跃抛物线最高点（米） */
export const JUMP_PEAK_HEIGHT = 2.2;

/** 骰子滚动动画时长 */
export const DICE_ROLL_DURATION_MS = 1500;
/** 事件横幅停留时长 */
export const EVENT_BANNER_DURATION_MS = 1400;
/** 回合切换前的额外间隔 */
export const TURN_SWITCH_DELAY_MS = 500;

/** 6 面骰事件配置（按 face 1..6 顺序） */
export const DICE_EVENTS: DiceEvent[] = [
  {
    face: 1,
    kind: 'move1',
    name: '小步前进',
    icon: '🏃',
    detail: '前进 1 格',
  },
  {
    face: 2,
    kind: 'move3',
    name: '大步前进',
    icon: '🏃‍♂️',
    detail: '前进 3 格',
  },
  {
    face: 3,
    kind: 'boost',
    name: '闪电加速',
    icon: '⚡',
    detail: '前进 2 格，下回合 +1',
  },
  {
    face: 4,
    kind: 'shield',
    name: '圣盾护持',
    icon: '🛡️',
    detail: '原地不动，护盾 +1',
  },
  {
    face: 5,
    kind: 'push',
    name: '推搡攻击',
    icon: '💥',
    detail: '自己 +1，对方 -2',
  },
  {
    face: 6,
    kind: 'swap',
    name: '命运互换',
    icon: '🔄',
    detail: '与对方互换位置',
  },
];

/** 计算第 i 块板的世界坐标 [x, y, z] */
export function getPlatformPosition(
  index: number,
): [number, number, number] {
  // 沿 -Z 方向延伸；每 TURN_EVERY 块板按正弦曲线轻微左右摆动
  const z = -index * PLATFORM_SPACING;
  const turnPhase = (index / TURN_EVERY) * Math.PI;
  const x = Math.sin(turnPhase) * TURN_AMPLITUDE;
  const y = 0;
  return [x, y, z];
}
