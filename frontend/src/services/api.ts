import axios from 'axios';

// 通过 Nginx 反向代理，使用相对路径避免跨域
const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor to add auth token + 当前用户 ID
// （项目暂未启用 JWT 过滤器，临时通过 X-User-Id 请求头传递 userId）
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        if (u && u.id != null) {
          config.headers['X-User-Id'] = String(u.id);
        }
      } catch {
        // ignore parse error
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * 从后端响应中提取友好的错误消息
 * 后端 GlobalExceptionHandler 返回结构：{ status, error, message, timestamp }
 */
export const extractErrorMessage = (error: any, fallback = '请求失败，请稍后重试'): string => {
  // 后端返回的 message 字段（业务异常）
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  // 后端返回的 error 字段（兜底）
  if (error?.response?.data?.error) {
    return error.response.data.error;
  }
  // 网络错误等
  if (error?.message) {
    if (error.code === 'ECONNABORTED') return '请求超时，请检查网络';
    if (error.message === 'Network Error') return '网络异常，请检查后端服务是否启动';
  }
  return fallback;
};

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 仅在已登录状态下踢回登录页（避免登录页本身的 401 死循环）
      if (localStorage.getItem('token')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// User API
export const userApi = {
  register: (data: { username: string; password: string; email: string }) =>
    api.post('/users/register', data),

  login: (data: { username: string; password: string }) =>
    api.post('/users/login', data),

  getCurrentUser: () => api.get('/users/me'),

  getLeaderboard: (type: 'wins' | 'winRate' | 'fastestTime' = 'wins', limit = 20) =>
    api.get(`/users/leaderboard?type=${type}&limit=${limit}`),
};

// Room API
export const roomApi = {
  createRoom: (data: { name: string; mode: 'LOCAL' | 'ONLINE' }) =>
    api.post('/rooms', data),

  joinRoom: (roomId: string) => api.post(`/rooms/${roomId}/join`),

  getRooms: () => api.get('/rooms'),

  getRoom: (roomId: string) => api.get(`/rooms/${roomId}`),

  startGame: (roomId: string) => api.post(`/rooms/${roomId}/start`),

  leaveRoom: (roomId: string) => api.post(`/rooms/${roomId}/leave`),
};

// Game API
export const gameApi = {
  submitTaskResult: (data: {
    roomId: string;
    taskId: string;
    result: 'SUCCESS' | 'FAIL';
    timeSpent: number;
  }) => api.post('/games/task-result', data),

  getGameResult: (roomId: string) => api.get(`/games/result/${roomId}`),
};

export default api;
