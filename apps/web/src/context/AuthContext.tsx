import { createContext, useContext, useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { api, setAuthToken } from '@/services/api';

interface AuthContextType {
  user: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isPrivyAuthenticated: boolean;
  authError: string | null;
  privyUser: any | null;
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
  const [authError, setAuthError] = useState<string | null>(null);

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

    const syncBackendUser = async (retries = 3) => {
      if (!ready) return;
      setIsBackendLoading(true);
      setAuthSyncing(true);

      if (!authenticated) {
        setAuthToken(null);
        setBackendUser(null);
        setAuthError(null);
        setIsBackendLoading(false);
        setAuthSyncing(false);
        return;
      }

      try {
        const token = await getAccessToken();
        const email = privyUser?.email?.address;
        setAuthToken(token, email);

        if (!token) {
          throw new Error('Unable to obtain Privy token');
        }

        // Add a small delay to ensure backend has processed the login if it was just created
        const response = await api.get('/api/v1/users/me');
        if (!cancelled) {
          setBackendUser(response.data);
          setAuthError(null);
          setIsBackendLoading(false);
          setAuthSyncing(false);
          console.log("Backend user synchronized:", response.data.email, "Role:", response.data.role);
        }
      } catch (error: any) {
        console.error(`Failed to synchronize backend user (Retries left: ${retries})`, error);
        if (!cancelled) {
          if (error?.response?.status === 404 || error?.response?.status === 401) {
            setAuthError('Account not registered. Please sign up to continue.');
            setBackendUser(null);
            setIsBackendLoading(false);
            setAuthSyncing(false);
            return;
          }
        }
        if (retries > 0 && !cancelled) {
          setTimeout(() => syncBackendUser(retries - 1), 2000);
          return;
        }
        if (!cancelled) {
          setBackendUser(null);
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
      user: backendUser,
      isLoading: !ready || isBackendLoading || authSyncing,
      isAuthenticated: authenticated && !!backendUser,
      isPrivyAuthenticated: authenticated,
      authError,
      privyUser,
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
