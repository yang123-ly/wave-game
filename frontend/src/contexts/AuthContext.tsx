import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface User {
  id: number;
  username: string;
  nickname?: string;
  totalWins?: number;
  totalLosses?: number;
  level?: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        setIsAuthenticated(true);
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
  }, []);

  /**
   * 持久化用户信息并标记已登录
   * 当前后端尚未返回 JWT token，仅使用 user 对象做前端态管理
   */
  const persistUser = (userData: User) => {
    localStorage.setItem('user', JSON.stringify(userData));
    // 占位：等后端返回 token 后接入
    localStorage.setItem('token', `local-${userData.id}-${Date.now()}`);
    setUser(userData);
    setIsAuthenticated(true);
  };

  const login = async (username: string, password: string) => {
    const response = await axios.post('/api/users/login', { username, password });
    persistUser(response.data);
  };

  const register = async (username: string, password: string) => {
    // 后端 register 仅需 username + password + nickname
    const response = await axios.post('/api/users/register', {
      username,
      password,
      nickname: username,
    });
    persistUser(response.data);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
