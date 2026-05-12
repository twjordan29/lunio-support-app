import axios from 'axios';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { config } from '@/src/config/env';
import { setApiAuthToken } from '@/src/api/client';
import { clearAuthToken, getAuthToken, getUser, saveAuthToken, saveUser } from '@/src/auth/tokenStorage';

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
};

type AuthContextValue = {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  loginWithCredentials: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const storedToken = await getAuthToken();
      const storedUser = await getUser();
      setToken(storedToken);
      setUser(storedUser);
      setApiAuthToken(storedToken);
      setIsLoading(false);
    })();
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    token,
    user,
    isLoading,
    loginWithCredentials: async (email: string, password: string) => {
      const response = await axios.post(`${config.lunioWebUrl}/api/mobile/support/login`, {
        email,
        password,
      });

      if (!response.data.ok) {
        const error = response.data.error;
        if (error === 'invalid_credentials') throw new Error('Invalid email or password.');
        if (error === 'forbidden') throw new Error('Access denied. Admin or support access required.');
        throw new Error('Login failed. Please try again.');
      }

      const { support_token, user: userData } = response.data;
      await saveAuthToken(support_token);
      await saveUser(userData);
      setApiAuthToken(support_token);
      setToken(support_token);
      setUser(userData);
    },
    logout: async () => {
      await clearAuthToken();
      setApiAuthToken(null);
      setToken(null);
      setUser(null);
    },
  }), [token, user, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
