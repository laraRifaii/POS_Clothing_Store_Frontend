// src/renderer/types/auth.types.ts

export enum UserRole {
  CASHIER = 'CASHIER',
  MANAGER = 'MANAGER',
  ADMIN = 'ADMIN'
}

export enum Permissions {
  // User Management
  MANAGE_USERS = 'MANAGE_USERS',
  VIEW_USERS = 'VIEW_USERS',
  
  // Sales
  CREATE_SALE = 'CREATE_SALE',
  VIEW_SALES = 'VIEW_SALES',
  REFUND_SALE = 'REFUND_SALE',
  
  // Inventory
  MANAGE_INVENTORY = 'MANAGE_INVENTORY',
  VIEW_INVENTORY = 'VIEW_INVENTORY',
  
  // Reports
  VIEW_REPORTS = 'VIEW_REPORTS',
  EXPORT_REPORTS = 'EXPORT_REPORTS',

  // Settings
  MANAGE_SETTINGS = 'MANAGE_SETTINGS',
}

export interface User {
  id: number;
  username: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  user: User;
  loginTime: string;
  expiresAt: string;
  sessionId: string;
}

export interface SignInDto {
  username: string;
  password: string;
}

export interface SignInResponse {
  user: User;
  message?: string;
}

export interface AuthState {
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Role-Permission mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permissions[]> = {
  [UserRole.CASHIER]: [
    Permissions.CREATE_SALE,
    Permissions.VIEW_SALES,
    Permissions.VIEW_INVENTORY,
  ],
  [UserRole.MANAGER]: [
    Permissions.CREATE_SALE,
    Permissions.VIEW_SALES,
    Permissions.REFUND_SALE,
    Permissions.VIEW_INVENTORY,
    Permissions.MANAGE_INVENTORY,
    Permissions.VIEW_REPORTS,
    Permissions.VIEW_USERS,
    Permissions.MANAGE_SETTINGS,
  ],
  [UserRole.ADMIN]: [
    Permissions.MANAGE_USERS,
    Permissions.VIEW_USERS,
    Permissions.CREATE_SALE,
    Permissions.VIEW_SALES,
    Permissions.REFUND_SALE,
    Permissions.MANAGE_INVENTORY,
    Permissions.VIEW_INVENTORY,
    Permissions.VIEW_REPORTS,
    Permissions.EXPORT_REPORTS,
    Permissions.MANAGE_SETTINGS,
  ],
};