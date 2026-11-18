// app/src/services/storage/storage.service.ts
import { Session } from '../../types/auth.enum';

class StorageService {
  private readonly SESSION_KEY = 'pos_session';
  private readonly SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours in milliseconds

  /**
   * Check if electron API is available
   */
  private isElectronAvailable(): boolean {
    return typeof window !== 'undefined' && window.electron && window.electron.store !== undefined;
  }

  /**
   * Save session to electron store
   */
  async saveSession(session: Session): Promise<void> {
    if (!this.isElectronAvailable()) {
      throw new Error('Electron store is not available');
    }

    try {
      const result = await window.electron.store.set(this.SESSION_KEY, session);
      if (!result) {
        throw new Error('Failed to save session');
      }
    } catch (error) {
      console.error('Failed to save session:', error);
      throw new Error('Could not save session');
    }
  }

  /**
   * Get session from electron store
   */
  async getSession(): Promise<Session | null> {
    if (!this.isElectronAvailable()) {
      console.warn('Electron store is not available');
      return null;
    }

    try {
      const session = await window.electron.store.get(this.SESSION_KEY);
      
      if (!session) {
        return null;
      }

      // Check if session is expired
      if (this.isSessionExpired(session)) {
        await this.clearSession();
        return null;
      }

      return session as Session;
    } catch (error) {
      console.error('Failed to get session:', error);
      return null;
    }
  }

  /**
   * Clear session from storage
   */
  async clearSession(): Promise<void> {
    if (!this.isElectronAvailable()) {
      throw new Error('Electron store is not available');
    }

    try {
      await window.electron.store.delete(this.SESSION_KEY);
    } catch (error) {
      console.error('Failed to clear session:', error);
      throw new Error('Could not clear session');
    }
  }

  /**
   * Check if session is expired
   */
  private isSessionExpired(session: Session): boolean {
    const expiresAt = new Date(session.expiresAt).getTime();
    return Date.now() > expiresAt;
  }

  /**
   * Extend session expiration
   */
  async extendSession(): Promise<void> {
    const session = await this.getSession();
    
    if (session) {
      const extendedSession: Session = {
        ...session,
        expiresAt: new Date(Date.now() + this.SESSION_DURATION).toISOString(),
      };
      
      await this.saveSession(extendedSession);
    }
  }

  /**
   * Get session duration in milliseconds
   */
  getSessionDuration(): number {
    return this.SESSION_DURATION;
  }
}

export const storageService = new StorageService();