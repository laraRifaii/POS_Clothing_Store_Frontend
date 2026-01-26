// app/src/components/LicenseGuard.tsx
import React from 'react';
import { useLicense } from '../contexts/LicenseContext';
import { LicenseActivationPage } from '../pages/LicenseActivationPage';
import { AlertTriangle } from 'lucide-react';

interface LicenseGuardProps {
  children: React.ReactNode;
}

export const LicenseGuard: React.FC<LicenseGuardProps> = ({ children }) => {
  const { isLocked, isLoading, licenseStatus, gracePeriodDaysLeft } = useLicense();

  // Show loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Verifying license...</p>
        </div>
      </div>
    );
  }

  // Show activation page if locked
  if (isLocked) {
    return <LicenseActivationPage />;
  }

  // Show grace period warning banner
  const showGracePeriodWarning = licenseStatus?.isExpired && gracePeriodDaysLeft > 0;

  return (
    <>
      {showGracePeriodWarning && (
        <div className="bg-yellow-500 text-white py-3 px-4 text-center">
          <div className="flex items-center justify-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">
              License Expired - Grace Period: {gracePeriodDaysLeft} days remaining
            </span>
          </div>
        </div>
      )}
      {children}
    </>
  );
};