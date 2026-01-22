// src/renderer/services/api/store-info.api.ts
import { apiService } from './api.service';

export interface StoreInfo {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  logoUrl: string | null;
}

export interface CreateStoreInfoDto {
  name: string;
  address: string;
  phone: string;
  email: string;
}

export interface UpdateStoreInfoDto {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
}

class StoreInfoApi {
  private readonly STORE_INFO_PREFIX = '/store-info';

  /**
   * Get store information
   */
  async get(): Promise<StoreInfo | null> {
    try {
      return await apiService.get<StoreInfo>(this.STORE_INFO_PREFIX);
    } catch (error: any) {
      // Return null if 404 (store not found), throw other errors
      if (
        error.message?.includes('Store information not set') ||
        error.message?.includes('not found') ||
        error.response?.status === 404
      ) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Create store information (first time setup)
   */
  async create(data: CreateStoreInfoDto): Promise<StoreInfo> {
    const response = await apiService.post<StoreInfo>(
      this.STORE_INFO_PREFIX,
      data,
    );
    return response;
  }

  /**
   * Update store information
   */
  async update(data: UpdateStoreInfoDto): Promise<StoreInfo> {
    const response = await apiService.patch<StoreInfo>(
      this.STORE_INFO_PREFIX,
      data,
    );
    return response;
  }

  /**
   * Upload logo
   */
  async uploadLogo(file: File): Promise<StoreInfo> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiService.patch<StoreInfo>(
      `${this.STORE_INFO_PREFIX}/logo`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
    return response;
  }

  /**
   * Delete store information
   */
  async delete(): Promise<{ message: string }> {
    const response = await apiService.delete<{ message: string }>(
      this.STORE_INFO_PREFIX,
    );
    return response;
  }
}

export const storeInfoApi = new StoreInfoApi();
