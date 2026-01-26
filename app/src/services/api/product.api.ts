// src/renderer/services/api/product.api.ts
import { apiService } from './api.service';

export interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  size: string;
  color: string;
  costPrice: number;  // What you paid for it
  salePrice: number;  // What you sell it for
  stock: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductsResponse {
  message: string;
  products: Product[];
  total: number;
}

export interface CreateProductDto {
  name: string;
  sku: string;
  category: string;
  size: string;
  color: string;
  costPrice: number;
  salePrice: number;
  stock: number;
}

export interface UpdateProductDto {
  name?: string;
  sku?: string;
  category?: string;
  size?: string;
  color?: string;
  costPrice?: number;
  salePrice?: number;
  stock?: number;
  isActive?: boolean;
}

export interface ProductQueryParams {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
  isActive?: boolean;
}

class ProductApi {
  private readonly PRODUCT_PREFIX = '/products';

  /**
   * Get all products with optional filters
   */
  async getAll(params?: ProductQueryParams): Promise<ProductsResponse> {
    const response = await apiService.get<ProductsResponse>(
      this.PRODUCT_PREFIX,
      { params }
    );
    return response;
  }

  /**
   * Get product by ID
   */
  async getById(id: number): Promise<Product> {
    const response = await apiService.get<Product>(
      `${this.PRODUCT_PREFIX}/${id}`
    );
    return response;
  }

  /**
   * Get product by SKU
   */
  async getBySku(sku: string): Promise<Product> {
    const response = await apiService.get<Product>(
      `${this.PRODUCT_PREFIX}/sku/${sku}`
    );
    return response;
  }

  /**
   * Create new product (Manager/Admin only)
   */
  async create(data: CreateProductDto): Promise<Product> {
    const response = await apiService.post<Product>(
      this.PRODUCT_PREFIX,
      data
    );
    return response;
  }

  /**
   * Update product (Manager/Admin only)
   */
  async update(id: number, data: UpdateProductDto): Promise<Product> {
    const response = await apiService.patch<Product>(
      `${this.PRODUCT_PREFIX}/${id}`,
      data
    );
    return response;
  }

  /**
   * Update product stock (Manager/Admin only)
   */
  async updateStock(id: number, quantity: number): Promise<Product> {
    const response = await apiService.patch<Product>(
      `${this.PRODUCT_PREFIX}/${id}/stock`,
      { quantity }
    );
    return response;
  }

  /**
   * Delete product (Admin only)
   */
  async delete(id: number): Promise<Product> {
    const response = await apiService.delete<Product>(
      `${this.PRODUCT_PREFIX}/${id}`
    );
    return response;
  }

  /**
   * Get all categories
   */
  async getCategories(): Promise<string[]> {
    const response = await apiService.get<string[]>(
      `${this.PRODUCT_PREFIX}/categories`
    );
    return response;
  }

  /**
   * Get low stock products (Manager/Admin only)
   */
  async getLowStock(threshold?: number): Promise<Product[]> {
    const response = await apiService.get<Product[]>(
      `${this.PRODUCT_PREFIX}/low-stock`,
      { params: { threshold } }
    );
    return response;
  }
}

export const productApi = new ProductApi();

// Helper to calculate profit margin
export const calculateProfitMargin = (costPrice: number, salePrice: number): number => {
  if (salePrice === 0) return 0;
  return ((salePrice - costPrice) / salePrice) * 100;
};

// Helper to calculate markup
export const calculateMarkup = (costPrice: number, salePrice: number): number => {
  if (costPrice === 0) return 0;
  return ((salePrice - costPrice) / costPrice) * 100;
};