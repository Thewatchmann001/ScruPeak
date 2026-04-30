import { createContext, useContext, useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { api, setAuthToken } from '@/services/api';

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
  const { ready, authenticated, user: privyUser, login, logout, getAccessToken } = usePrivy();
  const [backendUser, setBackendUser] = useState<any | null>(null);
  const [isBackendLoading, setIsBackendLoading] = useState(false);
  const [authSyncing, setAuthSyncing] = useState(true);

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
    let cancelled = false;

    const syncBackendUser = async () => {
      if (!ready) return;
      setIsBackendLoading(true);
      setAuthSyncing(true);

      if (!authenticated) {
        setAuthToken(null);
        setBackendUser(null);
        setIsBackendLoading(false);
        setAuthSyncing(false);
        return;
      }

      try {
        const token = await getAccessToken();
        setAuthToken(token);

        if (!token) {
          throw new Error('Unable to obtain Privy token');
        }

        const response = await api.get('/api/v1/users/me');
        if (!cancelled) {
          setBackendUser(response.data);
        }
      } catch (error) {
        console.error('Failed to synchronize backend user', error);
        if (!cancelled) {
          setBackendUser(null);
        }
      } finally {
        if (!cancelled) {
          setIsBackendLoading(false);
          setAuthSyncing(false);
        }
      }
    };

    syncBackendUser();

    return () => {
      cancelled = true;
    };
  }, [ready, authenticated, getAccessToken]);

  return (
    <AuthContext.Provider value={{
      user: backendUser || (authenticated ? privyUser : null),
      isLoading: !ready || isBackendLoading || authSyncing,
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
