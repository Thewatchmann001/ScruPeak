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
      getAccessToken().then(async (token) => {
        setAuthToken(token);
        setIsBackendLoading(true);
        try {
          // Use our ApiClient instead of direct fetch to ensure correct URL and proxying
          const response = await api.get('/users/me');
          if (response.data) {
            setBackendUser(response.data);
          }
        } catch (error) {
          console.error("Failed to fetch backend user", error);
        } finally {
          setIsBackendLoading(false);
        }
      });
    } else {
      setAuthToken(null);
      setBackendUser(null);
    }
  }, [authenticated, getAccessToken]);

  return (
    <AuthContext.Provider value={{
      user: backendUser || (authenticated ? privyUser : null),
      isLoading: !ready || isBackendLoading,
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
