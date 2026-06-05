/**
 * 浪尖踏歌 - 棋盘配置 Store（zustand + 后端 API 持久化）
 * 管理：格子事件、骰子事件、赛道参数
 */
import { create } from 'zustand';
import { boardConfigApi } from '../services/api';

/* ============ 类型定义 ============ */
export interface PlatformEventConfig {
  icon: string;
  text: string;
}

export interface DiceEventConfig {
  face: number;
  name: string;
  icon: string;
  detail: string;
}

export interface TrackParams {
  totalPlatforms: number;
  platformSpacingZ: number;
  zigzagAmplitude: number;
  zigzagPeriod: number;
}

export interface BoardConfig {
  trackParams: TrackParams;
  platformEvents: PlatformEventConfig[];
  diceEvents: DiceEventConfig[];
}

/* ============ 默认配置（前端 fallback） ============ */
const DEFAULT_TRACK_PARAMS: TrackParams = {
  totalPlatforms: 20,
  platformSpacingZ: 12,
  zigzagAmplitude: 16,
  zigzagPeriod: 3,
};

const DEFAULT_PLATFORM_EVENTS: PlatformEventConfig[] = [
  { icon: '🏖️', text: '起点：踏上征途，扬帆起航！' },
  { icon: '🐚', text: '发现一枚美丽的贝壳' },
  { icon: '🌅', text: '朝霞映海，心旷神怡' },
  { icon: '🐠', text: '热带鱼群在脚下游过' },
  { icon: '🦀', text: '小螃蟹在岩石上晒太阳' },
  { icon: '🪸', text: '珊瑚礁散发着七彩光芒' },
  { icon: '🐙', text: '章鱼先生向你打招呼' },
  { icon: '🌊', text: '一阵大浪袭来，站稳了！' },
  { icon: '🐋', text: '远处鲸鱼跃出水面' },
  { icon: '🦑', text: '深海巨鱿鱼路过此地' },
  { icon: '⚓', text: '古老沉船遗迹浮现' },
  { icon: '🧜', text: '人鱼歌声悠扬动听' },
  { icon: '🪼', text: '水母群翩翩起舞' },
  { icon: '🌈', text: '雨后彩虹横跨海面' },
  { icon: '🐢', text: '海龟妈妈带着宝宝游过' },
  { icon: '💎', text: '阳光折射出海底宝石的光' },
  { icon: '🦈', text: '鲨鱼巡逻，但它只吃鱼' },
  { icon: '🏝️', text: '远处小岛若隐若现' },
  { icon: '🌟', text: '海面星光闪烁如梦似幻' },
  { icon: '🏁', text: '终点：征服大海，胜利到达！' },
];

const DEFAULT_DICE_EVENTS: DiceEventConfig[] = [
  { face: 1, name: '微波轻拂', icon: '🌊', detail: '前进 1 格' },
  { face: 2, name: '浪花翻涌', icon: '🌊', detail: '前进 2 格' },
  { face: 3, name: '海风助力', icon: '🏄', detail: '前进 3 格' },
  { face: 4, name: '潮汐奔涌', icon: '🐬', detail: '前进 4 格' },
  { face: 5, name: '巨浪推送', icon: '🦈', detail: '前进 5 格' },
  { face: 6, name: '海神眷顾', icon: '🔱', detail: '前进 6 格' },
];

/* ============ 后端返回的配置记录类型 ============ */
export interface ServerBoardConfig {
  id: number;
  name: string;
  description: string | null;
  totalPlatforms: number;
  platformSpacingZ: number;
  zigzagAmplitude: number;
  zigzagPeriod: number;
  platformEvents: string;
  diceEvents: string;
  isDefault: boolean;
  createdBy: number | null;
  createdAt: string;
  updatedAt: string;
}

/** 将后端记录解析为前端可用的 BoardConfig */
function parseServerConfig(data: ServerBoardConfig): BoardConfig {
  return {
    trackParams: {
      totalPlatforms: data.totalPlatforms,
      platformSpacingZ: data.platformSpacingZ,
      zigzagAmplitude: data.zigzagAmplitude,
      zigzagPeriod: data.zigzagPeriod,
    },
    platformEvents: JSON.parse(data.platformEvents),
    diceEvents: JSON.parse(data.diceEvents),
  };
}

/* ============ Store ============ */
interface ConfigStore extends BoardConfig {
  /** 后端记录 ID（null 表示尚未从后端加载） */
  serverId: number | null;
  /** 当前配置名称 */
  configName: string;
  /** 是否正在加载 */
  loading: boolean;
  /** 错误信息 */
  error: string | null;
  /** 系统模板列表 */
  templates: ServerBoardConfig[];
  /** 我的个性化配置列表 */
  myConfigs: ServerBoardConfig[];

  // 本地编辑 actions
  setTrackParams: (params: Partial<TrackParams>) => void;
  setPlatformEvent: (index: number, event: PlatformEventConfig) => void;
  addPlatformEvent: (event: PlatformEventConfig) => void;
  removePlatformEvent: (index: number) => void;
  setDiceEvent: (index: number, event: DiceEventConfig) => void;
  setConfigName: (name: string) => void;
  resetToDefault: () => void;
  importConfig: (config: BoardConfig) => void;
  exportConfig: () => BoardConfig;

  // 后端 API actions
  loadFromServer: () => Promise<void>;
  loadConfigById: (id: number) => Promise<void>;
  saveToServer: () => Promise<void>;
  fetchLists: () => Promise<void>;
  cloneTemplate: (templateId: number) => Promise<void>;
  deleteConfig: (id: number) => Promise<void>;
}

export const useConfigStore = create<ConfigStore>()((set, get) => ({
  trackParams: DEFAULT_TRACK_PARAMS,
  platformEvents: DEFAULT_PLATFORM_EVENTS,
  diceEvents: DEFAULT_DICE_EVENTS,
  serverId: null,
  configName: '',
  loading: false,
  error: null,
  templates: [],
  myConfigs: [],

  setTrackParams: (params) =>
    set((state) => ({ trackParams: { ...state.trackParams, ...params } })),

  setPlatformEvent: (index, event) =>
    set((state) => {
      const copy = [...state.platformEvents];
      copy[index] = event;
      return { platformEvents: copy };
    }),

  addPlatformEvent: (event) =>
    set((state) => ({ platformEvents: [...state.platformEvents, event] })),

  removePlatformEvent: (index) =>
    set((state) => ({
      platformEvents: state.platformEvents.filter((_, i) => i !== index),
    })),

  setDiceEvent: (index, event) =>
    set((state) => {
      const copy = [...state.diceEvents];
      copy[index] = event;
      return { diceEvents: copy };
    }),

  setConfigName: (name) => set({ configName: name }),

  resetToDefault: () =>
    set({
      trackParams: DEFAULT_TRACK_PARAMS,
      platformEvents: DEFAULT_PLATFORM_EVENTS,
      diceEvents: DEFAULT_DICE_EVENTS,
    }),

  importConfig: (config) =>
    set({
      trackParams: config.trackParams,
      platformEvents: config.platformEvents,
      diceEvents: config.diceEvents,
    }),

  exportConfig: () => ({
    trackParams: get().trackParams,
    platformEvents: get().platformEvents,
    diceEvents: get().diceEvents,
  }),

  /** 加载默认配置 */
  loadFromServer: async () => {
    set({ loading: true, error: null });
    try {
      const response = await boardConfigApi.getDefault();
      const data: ServerBoardConfig = response.data;
      const parsed = parseServerConfig(data);
      set({
        serverId: data.id,
        configName: data.name,
        ...parsed,
        loading: false,
      });
    } catch (err: any) {
      console.warn('从后端加载配置失败，使用本地默认配置', err);
      set({ loading: false, error: err?.message || '加载配置失败' });
    }
  },

  /** 加载指定 ID 的配置到编辑区 */
  loadConfigById: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const response = await boardConfigApi.getById(id);
      const data: ServerBoardConfig = response.data;
      const parsed = parseServerConfig(data);
      set({
        serverId: data.id,
        configName: data.name,
        ...parsed,
        loading: false,
      });
    } catch (err: any) {
      set({ loading: false, error: err?.message || '加载配置失败' });
      throw err;
    }
  },

  /** 保存当前编辑的配置到后端 */
  saveToServer: async () => {
    const { serverId, configName, trackParams, platformEvents, diceEvents } = get();
    set({ loading: true, error: null });
    try {
      const payload = {
        name: configName || '我的配置',
        totalPlatforms: trackParams.totalPlatforms,
        platformSpacingZ: trackParams.platformSpacingZ,
        zigzagAmplitude: trackParams.zigzagAmplitude,
        zigzagPeriod: trackParams.zigzagPeriod,
        platformEvents: JSON.stringify(platformEvents),
        diceEvents: JSON.stringify(diceEvents),
      };
      if (serverId) {
        await boardConfigApi.update(serverId, payload);
      } else {
        const response = await boardConfigApi.create(payload);
        set({ serverId: response.data.id });
      }
      set({ loading: false });
      // 保存后刷新列表
      get().fetchLists();
    } catch (err: any) {
      console.error('保存配置到后端失败', err);
      set({ loading: false, error: err?.message || '保存配置失败' });
      throw err;
    }
  },

  /** 拉取模板列表 + 我的配置列表 */
  fetchLists: async () => {
    try {
      const [templatesRes, myRes] = await Promise.all([
        boardConfigApi.listTemplates(),
        boardConfigApi.listMy(),
      ]);
      set({
        templates: templatesRes.data,
        myConfigs: myRes.data,
      });
    } catch (err: any) {
      console.warn('拉取配置列表失败', err);
    }
  },

  /** 从模板复制一份个性化配置 */
  cloneTemplate: async (templateId: number) => {
    set({ loading: true, error: null });
    try {
      const response = await boardConfigApi.cloneFromTemplate(templateId);
      const data: ServerBoardConfig = response.data;
      const parsed = parseServerConfig(data);
      set({
        serverId: data.id,
        configName: data.name,
        ...parsed,
        loading: false,
      });
      // 刷新我的配置列表
      get().fetchLists();
    } catch (err: any) {
      set({ loading: false, error: err?.message || '复制模板失败' });
      throw err;
    }
  },

  /** 删除指定配置 */
  deleteConfig: async (id: number) => {
    set({ loading: true, error: null });
    try {
      await boardConfigApi.delete(id);
      // 如果删除的是当前编辑的配置，清空编辑区
      if (get().serverId === id) {
        set({
          serverId: null,
          configName: '',
          trackParams: DEFAULT_TRACK_PARAMS,
          platformEvents: DEFAULT_PLATFORM_EVENTS,
          diceEvents: DEFAULT_DICE_EVENTS,
        });
      }
      set({ loading: false });
      get().fetchLists();
    } catch (err: any) {
      set({ loading: false, error: err?.message || '删除失败' });
      throw err;
    }
  },
}));
