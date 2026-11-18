// app/src/contexts/LicenseContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  licenseService,
  LicenseStatus,
} from '../services/license/license.service';

interface LicenseContextType {
  licenseStatus: LicenseStatus | null;
  isLocked: boolean;
  isLoading: boolean;
  activateLicense: (licenseKey: string) => Promise<boolean>;
  refreshLicense: () => Promise<void>;
  gracePeriodDaysLeft: number;
}

const LicenseContext = createContext<LicenseContextType | undefined>(undefined);

export const LicenseProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus | null>(null);
  const [isLocked, setIsLocked] = useState<boolean>(true); // ← Start as true
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [gracePeriodDaysLeft, setGracePeriodDaysLeft] = useState<number>(0);

  // Check license on mount
  useEffect(() => {
    checkLicense();
  }, []);

  // Check license periodically (every hour)
  useEffect(() => {
    const interval = setInterval(() => {
      checkLicense();
    }, 60 * 60 * 1000); // 1 hour

    return () => clearInterval(interval);
  }, []);

  const checkLicense = async () => {
    try {
      setIsLoading(true);

      const status = await licenseService.verifyLicense();
      setLicenseStatus(status);

      const shouldLock = await licenseService.shouldLock();
      setIsLocked(shouldLock);

      if (status.isExpired) {
        const graceDays = await licenseService.getGracePeriodDaysRemaining();
        setGracePeriodDaysLeft(graceDays);
      } else {
        setGracePeriodDaysLeft(0);
      }
    } catch (error) {
      setIsLocked(true);
    } finally {
      setIsLoading(false);
    }
  };

 const activateLicense = async (licenseKey: string): Promise<boolean> => {
  try {
    
    const status = await licenseService.verifyLicense(licenseKey);

    if (!status.isValid) {
      return false;
    }

    await licenseService.saveLicense(licenseKey);

    // Immediately update state
    setLicenseStatus(status);
    setIsLocked(false); // ← UNLOCK IMMEDIATELY
    
    // Refresh in background
    setTimeout(() => checkLicense(), 100);

    return true;
  } catch (error) {
    return false;
  }
};

  const refreshLicense = async () => {
    await checkLicense();
  };

  const value: LicenseContextType = {
    licenseStatus,
    isLocked,
    isLoading,
    activateLicense,
    refreshLicense,
    gracePeriodDaysLeft,
  };

  return (
    <LicenseContext.Provider value={value}>{children}</LicenseContext.Provider>
  );
};

export const useLicense = () => {
  const context = useContext(LicenseContext);

  if (context === undefined) {
    throw new Error('useLicense must be used within a LicenseProvider');
  }

  return context;
};