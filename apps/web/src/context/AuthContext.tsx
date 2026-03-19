import { createContext, useContext, useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { setAuthToken } from '@/services/api';

interface AuthContextType {
  user: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  getToken: () => Promise<string | null>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { ready, authenticated, user, login, logout, getAccessToken } = usePrivy();

  const getToken = async () => {
    try {
      return await getAccessToken();
    } catch {
      return null;
    }
  };

  const checkAuth = async () => {
      // Handled automatically by Privy
  };

  useEffect(() => {
    if (authenticated) {
      getAccessToken().then(token => setAuthToken(token));
    } else {
      setAuthToken(null);
    }
  }, [authenticated, getAccessToken]);

  return (
    <AuthContext.Provider value={{
      user: authenticated ? user : null,
      isLoading: !ready,
      isAuthenticated: authenticated,
      login,
      logout,
      getToken,
      checkAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
