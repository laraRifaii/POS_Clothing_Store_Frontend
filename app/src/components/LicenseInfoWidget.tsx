// app/src/components/LicenseInfoWidget.tsx
import React from 'react';
import { useLicense } from '../contexts/LicenseContext';
import { Shield, Calendar, AlertCircle } from 'lucide-react';

export const LicenseInfoWidget: React.FC = () => {
  const { licenseStatus } = useLicense();

  if (!licenseStatus?.isValid || !licenseStatus.data) {
    return null;
  }

  const daysRemaining = licenseStatus.daysRemaining || 0;
  const isExpiringSoon = daysRemaining <= 30 && daysRemaining > 0;
  const isExpired = licenseStatus.isExpired;

  return (
    <div className={`rounded-lg p-4 ${
      isExpired ? 'bg-red-50 border border-red-200' :
      isExpiringSoon ? 'bg-yellow-50 border border-yellow-200' :
      'bg-green-50 border border-green-200'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${
          isExpired ? 'bg-red-100' :
          isExpiringSoon ? 'bg-yellow-100' :
          'bg-green-100'
        }`}>
          {isExpired || isExpiringSoon ? (
            <AlertCircle className={`w-5 h-5 ${
              isExpired ? 'text-red-600' : 'text-yellow-600'
            }`} />
          ) : (
            <Shield className="w-5 h-5 text-green-600" />
          )}
        </div>

        <div className="flex-1">
          <h3 className={`font-medium mb-1 ${
            isExpired ? 'text-red-900' :
            isExpiringSoon ? 'text-yellow-900' :
            'text-green-900'
          }`}>
            {isExpired ? 'License Expired' :
             isExpiringSoon ? 'License Expiring Soon' :
             'License Active'}
          </h3>

          <div className="text-sm space-y-1">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-gray-700">
                {isExpired ? 'Expired' : 'Expires'}: {' '}
                {licenseStatus.expiryDate
                  ? new Date(licenseStatus.expiryDate).toLocaleDateString()
                  : 'N/A'}
              </span>
            </div>

            {!isExpired && (
              <p className={`text-xs ${
                isExpiringSoon ? 'text-yellow-700' : 'text-gray-600'
              }`}>
                {daysRemaining} days remaining
              </p>
            )}

            {isExpiringSoon && !isExpired && (
              <p className="text-xs text-yellow-700 font-medium mt-2">
                ⚠️ Please contact support to renew your license
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};