// src/renderer/pages/SettingsPage.tsx
import React, { useState, useEffect } from 'react';
import {
  storeInfoApi,
  StoreInfo,
  CreateStoreInfoDto,
  UpdateStoreInfoDto,
} from '../services/api/store-info.api';
import BackButton from '../components/backButton';
import {
  Store,
  Upload,
  Save,
  AlertCircle,
  Check,
  Image as ImageIcon,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState<CreateStoreInfoDto>({
    name: '',
    address: '',
    phone: '',
    email: '',
  });
 
  useEffect(() => {
    fetchStoreInfo();
  }, []);

  const fetchStoreInfo = async () => {
    try {
      setLoading(true);
      const data = await storeInfoApi.get();

      if (data) {
        setStoreInfo(data);
        setFormData({
          name: data.name,
          address: data.address,
          phone: data.phone,
          email: data.email,
        });
        setIsEditing(false);
      } else {
        // No store info exists yet
        setStoreInfo(null);
        setFormData({
          name: '',
          address: '',
          phone: '',
          email: '',
        });
        setIsEditing(true); // Automatically show create form
      }
    } catch (error: any) {
      console.error('Error fetching store info:', error);
      setMessage({
        type: 'error',
        text: 'Failed to load store information. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      let result: StoreInfo;

      if (storeInfo) {
        // Update existing
        result = await storeInfoApi.update(formData);
        setMessage({
          type: 'success',
          text: 'Store information updated successfully!',
        });
      } else {
        // Create new
        result = await storeInfoApi.create(formData);
        setMessage({
          type: 'success',
          text: 'Store information created successfully!',
        });
      }

      setStoreInfo(result);
      setIsEditing(false);

      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('Error saving store info:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Failed to save store information',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please upload an image file' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      // 5MB
      setMessage({ type: 'error', text: 'Image size must be less than 5MB' });
      return;
    }

    setUploadingLogo(true);
    setMessage(null);

    try {
      const result = await storeInfoApi.uploadLogo(file);
      setStoreInfo(result);
      setMessage({ type: 'success', text: 'Logo uploaded successfully!' });

      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Failed to upload logo',
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleCancel = () => {
    if (storeInfo) {
      setFormData({
        name: storeInfo.name,
        address: storeInfo.address,
        phone: storeInfo.phone,
        email: storeInfo.email,
      });
      setIsEditing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen">
        <BackButton />
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
            
          <div className='flex gap-4 items-center'>
            <BackButton />
            <div>
            <h1 className="text-3xl font-bold text-gray-900">Store Settings</h1>
            <p className="text-gray-600 mt-1">
              Manage your store information for receipts and invoices
            </p>
            </div>
          </div>
          <Store size={48} className="text-blue-600" />
        </div>

        {/* Message Alert */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {message.type === 'success' ? (
              <Check size={20} />
            ) : (
              <AlertCircle size={20} />
            )}
            {message.text}
          </div>
        )}

        {/* Store Information Form */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Store Information</h2>
            {storeInfo && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Edit
              </button>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Store Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="My Fashion Store"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder="123 Main Street, City, Country"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="+1 234 567 8900"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="store@example.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                >
                  <Save size={20} />
                  {saving
                    ? 'Saving...'
                    : storeInfo
                      ? 'Update Information'
                      : 'Create Store'}
                </button>

                {storeInfo && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          ) : storeInfo ? (
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-600">Store Name</div>
                <div className="text-lg font-semibold text-gray-900">
                  {storeInfo.name}
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-600">Address</div>
                <div className="text-gray-900">{storeInfo.address}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Phone</div>
                  <div className="text-gray-900">{storeInfo.phone}</div>
                </div>

                <div>
                  <div className="text-sm text-gray-600">Email</div>
                  <div className="text-gray-900">{storeInfo.email}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No store information configured. Click the button above to add
              your store details.
            </div>
          )}
        </div>

        {/* Logo Upload */}
        {storeInfo && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-6">Store Logo</h2>

            <div className="flex items-start gap-6">
              {/* Logo Preview */}
              <div className="shrink-0">
                {storeInfo.logoUrl ? (
                  <div className="w-32 h-32 border-2 border-gray-300 rounded-lg overflow-hidden">
                    <img
                      src={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/${storeInfo.logoUrl}`}
                      alt="Store Logo"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                    <ImageIcon size={32} className="text-gray-400" />
                  </div>
                )}
              </div>

              {/* Upload Section */}
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-4">
                  Upload your store logo to appear on receipts and invoices.
                  Recommended size: 200x200px. Max file size: 5MB.
                </p>

                <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition">
                  <Upload size={20} />
                  {uploadingLogo
                    ? 'Uploading...'
                    : storeInfo.logoUrl
                      ? 'Change Logo'
                      : 'Upload Logo'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                    className="hidden"
                  />
                </label>

                {storeInfo.logoUrl && (
                  <p className="text-xs text-gray-500 mt-2">
                    Current logo: {storeInfo.logoUrl.split('/').pop()}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Preview Section */}
        {storeInfo && (
          <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
            <h2 className="text-xl font-semibold mb-4">Receipt Preview</h2>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 font-mono text-sm">
              <div className="text-center space-y-1">
                {storeInfo.logoUrl && (
                  <div className="flex justify-center mb-4">
                    <img
                      src={`${import.meta.env.VITE_BACKEND || 'http://localhost:3000'}/${storeInfo.logoUrl}`}
                      alt="Logo"
                      className="h-16 object-contain"
                    />
                  </div>
                )}
                <div className="font-bold text-lg">{storeInfo.name}</div>
                <div>{storeInfo.address}</div>
                <div>{storeInfo.phone}</div>
                <div>{storeInfo.email}</div>
                <div className="border-t border-gray-400 my-2"></div>
                <div className="text-left">
                  <div>Invoice #: 12345</div>
                  <div>Date: {new Date().toLocaleDateString()}</div>
                  <div>Cashier: John Doe</div>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-4">
              This is how your store information will appear on printed receipts
              and invoices.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
