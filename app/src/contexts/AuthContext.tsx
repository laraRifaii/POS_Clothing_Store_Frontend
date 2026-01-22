// src/renderer/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authService } from '../services/auth/auth.service';
import { 
  Session, 
  User, 
  SignInDto, 
  UserRole, 
  Permissions,
  AuthState,
  ROLE_PERMISSIONS 
} from '../types/auth.enum';

interface AuthContextType extends AuthState {
  signIn: (credentials: SignInDto) => Promise<void>;
  signOut: () => Promise<void>;
  user: User | null;
  hasRole: (role: UserRole) => boolean;
  hasPermission: (permission: Permissions) => boolean;
  hasAnyPermission: (permissions: Permissions[]) => boolean;
  hasAllPermissions: (permissions: Permissions[]) => boolean;
  extendSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    session: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  // Listen for session expiration
  useEffect(() => {
    const handleSessionExpired = () => {
      handleSignOut();
    };

    window.addEventListener('session-expired', handleSessionExpired);
    
    return () => {
      window.removeEventListener('session-expired', handleSessionExpired);
    };
  }, []);

  const initializeAuth = async () => {
    try {
      const session = await authService.getCurrentSession();
      
      setState({
        session,
        isAuthenticated: session !== null,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState({
        session: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Failed to initialize authentication',
      });
    }
  };

  const handleSignIn = async (credentials: SignInDto) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const session = await authService.signIn(credentials);
      
      setState({
        session,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed';
      
      setState({
        session: null,
        isAuthenticated: false,
        isLoading: false,
        error: errorMessage,
      });
      
      throw error;
    }
  };

  const handleSignOut = async () => {
    try {
      await authService.signOut();
      
      setState({
        session: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const hasRole = useCallback((role: UserRole): boolean => {
    return state.session?.user.role === role;
  }, [state.session]);

  const hasPermission = useCallback((permission: Permissions): boolean => {
    if (!state.session) return false;
    
    const user = state.session.user;
    const userPermissions = ROLE_PERMISSIONS[user.role];
    
    return userPermissions.includes(permission);
  }, [state.session]);

  const hasAnyPermission = useCallback((permissions: Permissions[]): boolean => {
    return permissions.some((permission) => hasPermission(permission));
  }, [hasPermission]);

  const hasAllPermissions = useCallback((permissions: Permissions[]): boolean => {
    return permissions.every((permission) => hasPermission(permission));
  }, [hasPermission]);

  const handleExtendSession = async () => {
    try {
      await authService.extendSession();
      const session = await authService.getCurrentSession();
      
      if (session) {
        setState((prev) => ({ ...prev, session }));
      }
    } catch (error) {
      console.error('Failed to extend session:', error);
    }
  };

  const value: AuthContextType = {
    ...state,
    user: state.session?.user || null,
    signIn: handleSignIn,
    signOut: handleSignOut,
    hasRole,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    extendSession: handleExtendSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  
  return context;
};