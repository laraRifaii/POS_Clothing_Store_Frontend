// src/renderer/hooks/useAuth.ts
import { useAuthContext } from '../contexts/AuthContext';

/**
 * Custom hook to access auth context
 * Provides convenient access to authentication state and methods
 */
export const useAuth = () => {
  return useAuthContext();
};

export default useAuth;