import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { setApiAuthToken } from '@/src/api/client';
import { clearAuthToken, getAuthToken, saveAuthToken } from '@/src/auth/tokenStorage';

type AuthContextValue = {
  token: string | null;
  isLoading: boolean;
  loginWithBridgeToken: (token: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const storedToken = await getAuthToken();
      setToken(storedToken);
      setApiAuthToken(storedToken);
      setIsLoading(false);
    })();
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    token,
    isLoading,
    loginWithBridgeToken: async (nextToken: string) => {
      await saveAuthToken(nextToken);
      setApiAuthToken(nextToken);
      setToken(nextToken);
    },
    logout: async () => {
      await clearAuthToken();
      setApiAuthToken(null);
      setToken(null);
    },
  }), [token, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
