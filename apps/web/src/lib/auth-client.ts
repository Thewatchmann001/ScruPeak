import { usePrivy, useWallets } from '@privy-io/react-auth';

export { usePrivy, useWallets };

export const useAuth = () => {
  const {
    ready,
    authenticated,
    user,
    login,
    logout,
    getAccessToken
  } = usePrivy();

  return {
    ready,
    authenticated,
    user,
    login,
    logout,
    getAccessToken,
    isLoading: !ready,
  };
};
