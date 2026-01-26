// src/renderer/services/api/user.api.ts
import { apiService } from './api.service';

export interface User {
  id: number;
  username: string;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  username: string;
  password: string;
  role: string;
}

export interface UpdateUserDto {
  username?: string;
  password?: string;
  role?: string;
}

class UserApi {
  private readonly AUTH_PREFIX = '/auth';

  /**
   * Get all users (Admin/Manager only)
   */
  async getAll(): Promise<User[]> {
    const response = await apiService.get<User[]>(
      `${this.AUTH_PREFIX}/users`
    );
    return response;
  }

  /**
   * Get user by ID (Admin/Manager only)
   */
  async getById(id: number): Promise<User> {
    const response = await apiService.get<User>(
      `${this.AUTH_PREFIX}/users/${id}`
    );
    return response;
  }

  /**
   * Create new user (Admin only)
   */
  async create(data: CreateUserDto): Promise<User> {
    const response = await apiService.post<User>(
      `${this.AUTH_PREFIX}/signup`,
      data
    );
    return response;
  }

  /**
   * Update user (Admin only)
   */
  async update(id: number, data: UpdateUserDto): Promise<User> {
    const response = await apiService.put<User>(
      `${this.AUTH_PREFIX}/users/${id}`,
      data
    );
    return response;
  }

  /**
   * Toggle user active status (Admin only)
   */
  async toggleActive(id: number): Promise<User> {
    const response = await apiService.put<User>(
      `${this.AUTH_PREFIX}/users/${id}/toggle-active`,
      {}
    );
    return response;
  }

  /**
   * Soft delete user (Admin only)
   */
  async softDelete(id: number): Promise<{ message: string }> {
    const response = await apiService.delete<{ message: string }>(
      `${this.AUTH_PREFIX}/users/${id}`
    );
    return response;
  }

  /**
   * Hard delete user (Admin only)
   */
  async hardDelete(id: number): Promise<{ message: string }> {
    const response = await apiService.delete<{ message: string }>(
      `${this.AUTH_PREFIX}/users/${id}/hard`
    );
    return response;
  }
}

export const userApi = new UserApi();