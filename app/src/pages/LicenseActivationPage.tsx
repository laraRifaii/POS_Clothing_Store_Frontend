// app/src/pages/LicenseActivationPage.tsx
import React, { useState } from 'react';
import { useLicense } from '../contexts/LicenseContext';
import { Key, Lock, AlertCircle, CheckCircle } from 'lucide-react';

export const LicenseActivationPage: React.FC = () => {
  const { activateLicense, licenseStatus, gracePeriodDaysLeft } = useLicense();
  const [licenseKey, setLicenseKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await activateLicense(licenseKey);

      if (success) {
        // License activated successfully
        window.location.reload();
      } else {
        setError('Invalid license key. Please check and try again.');
      }
    } catch (err) {
      setError('Failed to activate license. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Auto-format with dashes
    let value = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    
    // Add dashes every 5 characters
    const formatted = value.match(/.{1,5}/g)?.join('-') || value;
    
    setLicenseKey(formatted);
  };

  const isGracePeriod = licenseStatus?.isExpired && gracePeriodDaysLeft > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Lock Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
            <Lock className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            License Required
          </h1>
          <p className="text-gray-600">
            {isGracePeriod
              ? `Grace period: ${gracePeriodDaysLeft} days remaining`
              : 'Please enter your license key to continue'}
          </p>
        </div>

        {/* Grace Period Warning */}
        {isGracePeriod && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-900 mb-1">
                  License Expired
                </h3>
                <p className="text-sm text-yellow-800">
                  Your license has expired. You have {gracePeriodDaysLeft} days remaining
                  in the grace period. Please renew to continue using the application.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Activation Card */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                License Key
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={licenseKey}
                  onChange={handleInputChange}
                  placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  required
                  maxLength={500}
                />
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Enter the license key provided by your vendor
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !licenseKey}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Activating...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Activate License
                </>
              )}
            </button>
          </form>

          {/* Current License Info */}
          {licenseStatus?.isValid && licenseStatus?.data && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Current License Information
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Client:</span>
                  <span className="font-medium text-gray-900">
                    {licenseStatus.data.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Expires:</span>
                  <span className={`font-medium ${licenseStatus.isExpired ? 'text-red-600' : 'text-gray-900'}`}>
                    {licenseStatus.expiryDate
                      ? new Date(licenseStatus.expiryDate).toLocaleDateString()
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium ${licenseStatus.isExpired ? 'text-red-600' : 'text-green-600'}`}>
                    {licenseStatus.isExpired ? 'Expired' : 'Active'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Support Info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Need help? Contact support at{' '}
            <a href="mailto:support@yourcompany.com" className="text-blue-600 hover:underline">
              support@yourcompany.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};