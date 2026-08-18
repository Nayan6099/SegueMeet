'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api';

export type UserRole = 'BOARD_ADMIN' | 'CHAIR' | 'SECRETARY' | 'BOARD_MEMBER' | 'EXECUTIVE' | 'GUEST';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  memberships: {
    organisationId: string;
    role: UserRole;
    organisation?: {
      id: string;
      name: string;
    };
  }[];
}

interface AuthContextValue {
  user: AuthenticatedUser | null;
  isLoading: boolean;
  login: (token: string, user: AuthenticatedUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch current user details from backend
        const res = await api.get('/auth/me');
        setUser(res.data);
      } catch (error) {
        console.error('Failed to restore session', error);
        localStorage.removeItem('token');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = (token: string, userData: AuthenticatedUser) => {
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
