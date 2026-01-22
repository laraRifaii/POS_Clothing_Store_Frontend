// app/src/routes/AppRoutes.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../routes/ProtectedRoute';
import  PermissionGuard  from '../routes/PermissionGuard';
import { Login } from '../pages/Login';
import { Dashboard } from '../pages/Dashboard';
import { UserRole, Permissions } from '../types/auth.enum';
import { InventoryPage } from '../pages/InventoryPage';
import { ReportsPage } from '../pages/ReportsPage';
import { UsersPage } from '../pages/UsersPage';
import { SalesPage } from '../pages/SalesPage';
import UnauthorizedPage from '../pages/Unauthorized';
import { RefundsPage } from '../pages/RefundsPage';
import { SettingsPage } from '../pages/SettingsPage';


export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Protected routes - all require authentication */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Refunds */}
         <Route
          path="/refunds"
          element={
            <PermissionGuard permissions={[Permissions.REFUND_SALE]}>
              <RefundsPage />
            </PermissionGuard>
          }
        />
        <Route
          path="/settings"
          element={
            <PermissionGuard 
              roles={[UserRole.ADMIN]}
              permissions={[Permissions.MANAGE_USERS]}
            >
              <SettingsPage />
            </PermissionGuard>
          }
        />
        {/* Sales - All authenticated users can create sales */}
        <Route
          path="/sales"
          element={
            <PermissionGuard permissions={[Permissions.CREATE_SALE]}>
              <SalesPage />
            </PermissionGuard>
          }
        />

        {/* Inventory - Manager and Admin only */}
        <Route
          path="/inventory"
          element={
            <PermissionGuard permissions={[Permissions.VIEW_INVENTORY]}>
              <InventoryPage />
            </PermissionGuard>
          }
        />

        {/* Reports - Manager and Admin only */}
        <Route
          path="/reports"
          element={
            <PermissionGuard permissions={[Permissions.VIEW_REPORTS]}>
              <ReportsPage />
            </PermissionGuard>
          }
        />

        {/* Users - Admin only */}
        <Route
          path="/users"
          element={
            <PermissionGuard 
              roles={[UserRole.ADMIN]}
              permissions={[Permissions.MANAGE_USERS]}
            >
              <UsersPage />
            </PermissionGuard>
          }
        />
      </Route>

      {/* Redirects */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};