// src/renderer/pages/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Permissions, UserRole } from '../types/auth.enum';
import { RotateCcw } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, session, signOut, hasPermission } = useAuth();
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    if (!session) return;

    const updateTimeRemaining = () => {
      const now = Date.now();
      const expiresAt = new Date(session.expiresAt).getTime();
      const remaining = expiresAt - now;

      if (remaining <= 0) {
        setTimeRemaining('Expired');
        return;
      }

      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

      setTimeRemaining(`${hours}h ${minutes}m`);
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [session]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">POS Dashboard</h1>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {user.username}
              </p>
              <p className="text-xs text-gray-500">{user.role}</p>
            </div>

            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
       

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {hasPermission(Permissions.CREATE_SALE) && (
            <button
              onClick={() => navigate('/sales')}
              className="bg-blue-600 text-white px-6 py-10 rounded-lg shadow hover:bg-blue-700 transition-colors"
            >
              <h3 className="text-lg font-semibold mb-2">New Sale</h3>
              <p className="text-sm opacity-90">Process a new transaction</p>
            </button>
          )}

          {hasPermission(Permissions.VIEW_INVENTORY) && (
            <button
              onClick={() => navigate('/inventory')}
              className="bg-green-600 text-white px-6 py-10 rounded-lg shadow hover:bg-green-700 transition-colors"
            >
              <h3 className="text-lg font-semibold mb-2">Inventory</h3>
              <p className="text-sm opacity-90">Manage stock levels</p>
            </button>
          )}

          {hasPermission(Permissions.VIEW_REPORTS) && (
            <button
              onClick={() => navigate('/reports')}
              className="bg-purple-600 text-white px-6 py-10 rounded-lg shadow hover:bg-purple-700 transition-colors"
            >
              <h3 className="text-lg font-semibold mb-2">Reports</h3>
              <p className="text-sm opacity-90">View sales analytics</p>
            </button>
          )}

          {hasPermission(Permissions.MANAGE_USERS) && (
            <button
              onClick={() => navigate('/users')}
              className="bg-orange-600 text-white px-6 py-10 rounded-lg shadow hover:bg-orange-700 transition-colors"
            >
              <h3 className="text-lg font-semibold mb-2">Users</h3>
              <p className="text-sm opacity-90">Manage user accounts</p>
            </button>
          )}
          {hasPermission(Permissions.REFUND_SALE) && (
            <button
              onClick={() => navigate('/refunds')}
              className="bg-red-600 text-white px-6 py-10 rounded-lg shadow hover:bg-red-700 transition-colors"
            >
              <h3 className="text-lg font-semibold mb-2">Refunds & Returns</h3>
              <p className="text-sm opacity-90">Manage refunds and returns </p>
            </button>
          )}
           {hasPermission(Permissions.REFUND_SALE) && (
            <button
              onClick={() => navigate('/settings')}
              className="bg-gray-600 text-white px-6 py-10 rounded-lg shadow hover:bg-gray-700 transition-colors"
            >
              <h3 className="text-lg font-semibold mb-2">Settings</h3>
              <p className="text-sm opacity-90">Manage your store info </p>
            </button>
          )}
        </div>

       
      
      </main>
    </div>
  );
};
