/**
 * 浪尖踏歌 - 常量（跳一跳海洋模式）
 */
import type { DiceEvent } from './types';

/* ============ 赛道 ============ */
/** 赛道总格数 */
export const TOTAL_PLATFORMS = 20;
/** 相邻格子 Z 方向间距 */
export const PLATFORM_SPACING_Z = 12.0;
/** 之字形 X 方向幅度 */
export const ZIGZAG_AMPLITUDE = 16;
/** 每几格换一次方向 */
export const ZIGZAG_PERIOD = 4;

/** 单次跳跃动画时长 */
export const JUMP_DURATION_MS = 600;
/** 跳跃抛物线最高点 */
export const JUMP_PEAK_HEIGHT = 3.0;

/** 骰子滚动动画时长 */
export const DICE_ROLL_DURATION_MS = 1500;
/** 事件横幅停留时长 */
export const EVENT_BANNER_DURATION_MS = 1400;
/** 回合切换前的额外间隔 */
export const TURN_SWITCH_DELAY_MS = 500;

/* ============ 视觉 ============ */
export const P1_COLOR = '#00d4ff';
export const P2_COLOR = '#ff4d8d';
export const WAVE_PERFECT_COLOR = '#00ffaa';
/** 完美命中半径（格子顶面内圈） */
export const PERFECT_RADIUS = 0.6;

/* ============ 骰子事件（纯前进，骰几走几） ============ */
export const DICE_EVENTS: DiceEvent[] = [
  { face: 1, kind: 'move1', name: '微波轻拂', icon: '🌊', detail: '前进 1 格' },
  { face: 2, kind: 'move1', name: '浪花翻涌', icon: '🌊', detail: '前进 2 格' },
  { face: 3, kind: 'move1', name: '海风助力', icon: '🏄', detail: '前进 3 格' },
  { face: 4, kind: 'move1', name: '潮汐奔涌', icon: '🐬', detail: '前进 4 格' },
  { face: 5, kind: 'move1', name: '巨浪推送', icon: '🦈', detail: '前进 5 格' },
  { face: 6, kind: 'move1', name: '海神眷顾', icon: '🔱', detail: '前进 6 格' },
];

/* ============ 每格对应的文案（20 格） ============ */
export const PLATFORM_EVENTS: string[] = [
  '🏖️ 起点：踏上征途，扬帆起航！',
  '🐚 发现一枚美丽的贝壳',
  '🌅 朝霞映海，心旷神怡',
  '🐠 热带鱼群在脚下游过',
  '🦀 小螃蟹在岩石上晒太阳',
  '🪸 珊瑚礁散发着七彩光芒',
  '🐙 章鱼先生向你打招呼',
  '🌊 一阵大浪袭来，站稳了！',
  '🐋 远处鲸鱼跃出水面',
  '🦑 深海巨鱿鱼路过此地',
  '⚓ 古老沉船遗迹浮现',
  '🧜 人鱼歌声悠扬动听',
  '🪼 水母群翩翩起舞',
  '🌈 雨后彩虹横跨海面',
  '🐢 海龟妈妈带着宝宝游过',
  '💎 阳光折射出海底宝石的光',
  '🦈 鲨鱼巡逻，但它只吃鱼',
  '🏝️ 远处小岛若隐若现',
  '🌟 海面星光闪烁如梦似幻',
  '🏁 终点：征服大海，胜利到达！',
];

/**
 * 计算第 i 格的世界坐标 [x, y, z]
 * 之字形布局：沿 -Z 方向前进，每 ZIGZAG_PERIOD 格在 X 方向左右交替
 */
export function getWavePlatformPosition(index: number): [number, number, number] {
  const z = -index * PLATFORM_SPACING_Z;
  // 之字形：用三角波让 X 在 ±ZIGZAG_AMPLITUDE 之间来回
  const phase = (index % (ZIGZAG_PERIOD * 2)) / ZIGZAG_PERIOD;
  const x = phase <= 1
    ? ZIGZAG_AMPLITUDE * (phase * 2 - 1)
    : ZIGZAG_AMPLITUDE * (1 - (phase - 1) * 2);
  const y = 0;
  return [x, y, z];
}
