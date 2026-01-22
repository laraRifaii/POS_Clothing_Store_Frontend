import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Permissions, UserRole } from '../types/auth.enum';

interface PermissionGuardProps {
  children: React.ReactNode;
  permissions?: Permissions[];
  roles?: UserRole[];
  requireAll?: boolean; // If true, requires all permissions/roles
  fallback?: React.ReactNode;
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  permissions = [],
  roles = [],
  requireAll = false,
  fallback,
}) => {
  const { hasRole, hasPermission, hasAnyPermission, hasAllPermissions, user } = useAuth();

  // Check roles
  if (roles.length > 0) {
    const hasRequiredRole = roles.some((role) => hasRole(role));
    
    if (!hasRequiredRole) {
      return fallback ? <>{fallback}</> : <Navigate to="/unauthorized" replace />;
    }
  }

  // Check permissions
  if (permissions.length > 0) {
    const hasRequiredPermission = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
    
    if (!hasRequiredPermission) {
      return fallback ? <>{fallback}</> : <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};
export default PermissionGuard;