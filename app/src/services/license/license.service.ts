// app/src/services/license/license.service.ts

export interface LicenseData {
  id: string;
  name: string;
  exp: number;
  maxUsers: number;
  iat: number;
  version: string;
}

export interface LicenseStatus {
  isValid: boolean;
  isExpired: boolean;
  data?: LicenseData;
  expiryDate?: string;
  daysRemaining?: number;
  error?: string;
}

class LicenseService {
  private readonly LICENSE_KEY = 'app_license_key';
  private readonly GRACE_PERIOD_DAYS = 7; // 7 days grace period

  /**
   * Save license key to storage
   */
  async saveLicense(licenseKey: string): Promise<void> {
    try {
      await window.electron.store.set(this.LICENSE_KEY, licenseKey);
    } catch (error) {
      console.error('Failed to save license:', error);
      throw new Error('Could not save license key');
    }
  }

  /**
   * Get stored license key
   */
  async getLicense(): Promise<string | null> {
    try {
      return await window.electron.store.get(this.LICENSE_KEY);
    } catch (error) {
      console.error('Failed to get license:', error);
      return null;
    }
  }

  /**
   * Verify license key (uses Electron main process crypto)
   */
  async verifyLicense(formattedKey?: string): Promise<LicenseStatus> {
    try {
      // Get license from storage if not provided
      const licenseKey = formattedKey || await this.getLicense();

      if (!licenseKey) {
        return {
          isValid: false,
          isExpired: true,
          error: 'No license key found',
        };
      }

      // Call Electron main process to verify (crypto happens there)
      const status = await window.electron.license.verify(licenseKey);
      return status;
    } catch (error) {
      console.error('License verification error:', error);
      return {
        isValid: false,
        isExpired: true,
        error: error instanceof Error ? error.message : 'Invalid license key',
      };
    }
  }

  /**
   * Check if app should be locked
   */
  async shouldLock(): Promise<boolean> {
    const status = await this.verifyLicense();

    if (!status.isValid) {
      return true; // Lock if invalid
    }

    if (status.isExpired) {
      // Check grace period
      const daysExpired = Math.abs(status.daysRemaining || 0);
      return daysExpired > this.GRACE_PERIOD_DAYS;
    }

    return false;
  }

  /**
   * Check if in grace period
   */
  async isInGracePeriod(): Promise<boolean> {
    const status = await this.verifyLicense();

    if (!status.isValid || !status.isExpired) {
      return false;
    }

    const daysExpired = Math.abs(status.daysRemaining || 0);
    return daysExpired <= this.GRACE_PERIOD_DAYS;
  }

  /**
   * Get days remaining in grace period
   */
  async getGracePeriodDaysRemaining(): Promise<number> {
    const status = await this.verifyLicense();

    if (!status.isValid || !status.isExpired) {
      return 0;
    }

    const daysExpired = Math.abs(status.daysRemaining || 0);
    const graceDaysLeft = this.GRACE_PERIOD_DAYS - daysExpired;

    return Math.max(0, graceDaysLeft);
  }

  /**
   * Clear license
   */
  async clearLicense(): Promise<void> {
    try {
      await window.electron.store.delete(this.LICENSE_KEY);
    } catch (error) {
      console.error('Failed to clear license:', error);
    }
  }
}

export const licenseService = new LicenseService();