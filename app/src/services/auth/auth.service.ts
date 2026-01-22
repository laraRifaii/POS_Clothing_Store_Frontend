import { v4 as uuidv4 } from 'uuid';
import { authApi } from '../api/auth.api';
import { storageService } from '../stores/electron-store.service';
import { 
  SignInDto, 
  Session, 
  User, 
  UserRole, 
  Permissions,
  ROLE_PERMISSIONS 
} from '../../types/auth.enum';

class AuthService {
  private sessionCheckInterval: NodeJS.Timeout | null = null;

  /**
   * Sign in and create local session
   */
  async signIn(credentials: SignInDto): Promise<Session> {
    // Call backend API
    const response = await authApi.signIn(credentials);
    
    if (!response.user) {
      throw new Error('Invalid response from server');
    }

    // Create session
    const session = this.createSession(response.user);
    
    // Save session to storage
    await storageService.saveSession(session);
    
    // Start session monitoring
    this.startSessionMonitoring();
    
    return session;
  }

  /**
   * Sign out and clear session
   */
  async signOut(): Promise<void> {
    await storageService.clearSession();
    this.stopSessionMonitoring();
  }

  /**
   * Get current session
   */
  async getCurrentSession(): Promise<Session | null> {
    return await storageService.getSession();
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const session = await this.getCurrentSession();
    return session !== null;
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<User | null> {
    const session = await this.getCurrentSession();
    return session?.user || null;
  }

  /**
   * Check if user has specific role
   */
  async hasRole(role: UserRole): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user?.role === role;
  }

  /**
   * Check if user has specific permission
   */
  async hasPermission(permission: Permissions): Promise<boolean> {
    const user = await this.getCurrentUser();
    if (!user) return false;
    
    const userPermissions = ROLE_PERMISSIONS[user.role];
    return userPermissions.includes(permission);
  }

  /**
   * Check if user has any of the specified permissions
   */
  async hasAnyPermission(permissions: Permissions[]): Promise<boolean> {
    for (const permission of permissions) {
      if (await this.hasPermission(permission)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Extend current session
   */
  async extendSession(): Promise<void> {
    await storageService.extendSession();
  }

  /**
   * Create a new session object
   */
  private createSession(user: User): Session {
    const now = new Date();
    const sessionDuration = storageService.getSessionDuration();
    
    return {
      user,
      loginTime: now.toISOString(),
      expiresAt: new Date(now.getTime() + sessionDuration).toISOString(),
      sessionId: uuidv4(),
    };
  }

  /**
   * Start monitoring session expiration
   */
  private startSessionMonitoring(): void {
    // Check session every minute
    this.sessionCheckInterval = setInterval(async () => {
      const session = await this.getCurrentSession();
      
      if (!session) {
        this.stopSessionMonitoring();
        window.dispatchEvent(new CustomEvent('session-expired'));
      }
    }, 60000); // 1 minute
  }

  /**
   * Stop session monitoring
   */
  private stopSessionMonitoring(): void {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
  }
}

export const authService = new AuthService();