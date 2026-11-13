import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';
import { wsService } from '../services/websocket';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateUser: (updated: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      if (localStorage.getItem('token')) {
        const me = await api.getMe();
        setUser(me);
        wsService.connect(localStorage.getItem('token'));
      } else {
        setUser(null);
      }
    } catch (err) {
      console.warn('Auth token invalid or expired', err);
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    localStorage.setItem('token', res.access_token);
    setToken(res.access_token);
    setUser(res.user);
    wsService.connect(res.access_token);
  };

  const register = async (data: any) => {
    const res = await api.register(data);
    localStorage.setItem('token', res.access_token);
    setToken(res.access_token);
    setUser(res.user);
    wsService.connect(res.access_token);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    wsService.disconnect();
  };

  const updateUser = (updated: User) => {
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, refreshUser, updateUser }}>
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

