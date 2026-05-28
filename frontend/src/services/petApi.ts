import api, { extractErrorMessage } from './api';

/* ============ 类型 ============ */
export type PetSpecies = 'cat' | 'dog' | 'dragon' | 'bird' | 'rabbit';

export interface Pet {
  id: number;
  name: string;
  species: PetSpecies;
  level: number;
  exp: number;
  expToNextLevel: number;
  avatar: string | null;
  mood: number;
  createdAt: string;
}

export interface PetCreateRequest {
  name: string;
  species: PetSpecies;
  avatar?: string;
}

export interface PetRenameRequest {
  name: string;
}

export interface PetExpRequest {
  delta: number;
}

/* ============ API ============ */
export const petApi = {
  /** 列出我的宠物（后端已实现） */
  list: () => api.get<Pet[]>('/pets').then((r) => r.data),

  /**
   * 收养新宠物（后端 Controller 尚未暴露，预留接口）
   * 接口就绪后直接可用，无需改前端
   */
  create: (data: PetCreateRequest) =>
    api.post<Pet>('/pets', data).then((r) => r.data),

  /** 改名（后端 Controller 尚未暴露，预留） */
  rename: (id: number, data: PetRenameRequest) =>
    api.patch<Pet>(`/pets/${id}`, data).then((r) => r.data),

  /** 删除（后端 Service/Controller 都还没写，预留） */
  remove: (id: number) => api.delete(`/pets/${id}`),

  /** 训练加经验（后端 Service/Controller 都还没写，预留） */
  addExp: (id: number, data: PetExpRequest) =>
    api.post<Pet>(`/pets/${id}/exp`, data).then((r) => r.data),
};

export { extractErrorMessage };
