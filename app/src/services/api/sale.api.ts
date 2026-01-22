// src/renderer/services/api/sale.api.ts
import { apiService } from './api.service';
import { Product } from './product.api';

export enum PaymentType {
  CASH = 'CASH',
  CARD = 'CARD',
  TRANSFER = 'TRANSFER',
}

export interface SaleItem {
  id: number;
  saleId: number;
  productId: number;
  quantity: number;
  price: number;
  discount: number;
  product: Product;
}

export interface Sale {
  id: number;
  userId: number;
  total: number;
  discount: number;
  paymentType: PaymentType;
  createdAt: string;
  items: SaleItem[];
  user: {
    id: number;
    username: string;
  };
}

export interface SalesResponse {
  sales: Sale[];
  total: number;
}

export interface CreateSaleItemDto {
  productId: number;
  quantity: number;
  price?: number;
  discount?: number;
}

export interface CreateSaleDto {
  items: CreateSaleItemDto[];
  paymentType: PaymentType;
  discount?: number;
}

export interface SaleQueryParams {
  startDate?: string;
  endDate?: string;
  paymentType?: PaymentType;
  userId?: number;
  page?: number;
  limit?: number;
}

export interface SalesReport {
  totalSales: number;
  totalRevenue: number;
  paymentBreakdown: Array<{
    paymentType: PaymentType;
    count: number;
    total: number;
  }>;
  topSellingProducts: Array<{
    product: Product;
    quantitySold: number;
  }>;
  startDate: string;
  endDate: string;
}

class SaleApi {
  private readonly SALE_PREFIX = '/sales';

  /**
   * Get all sales with optional filters (Manager/Admin only)
   */
  async getAll(params?: SaleQueryParams): Promise<SalesResponse> {
    const response = await apiService.get<SalesResponse>(
      this.SALE_PREFIX,
      { params }
    );
    return response;
  }

  /**
   * Get sale by ID (Manager/Admin only)
   */
  async getById(id: number): Promise<Sale> {
    const response = await apiService.get<Sale>(
      `${this.SALE_PREFIX}/${id}`
    );
    return response;
  }

  /**
   * Create new sale (All authenticated users)
   */
  async create(data: CreateSaleDto): Promise<Sale> {
    const response = await apiService.post<Sale>(
      this.SALE_PREFIX,
      data
    );
    return response;
  }

  /**
   * Get sales report (Manager/Admin only)
   */
  async getReport(startDate: string, endDate: string): Promise<SalesReport> {
    const response = await apiService.get<SalesReport>(
      `${this.SALE_PREFIX}/report`,
      { params: { startDate, endDate } }
    );
    return response;
  }

  /**
   * Get daily sales (Manager/Admin only)
   */
  async getDailySales(date: string): Promise<SalesReport> {
    const response = await apiService.get<SalesReport>(
      `${this.SALE_PREFIX}/daily`,
      { params: { date } }
    );
    return response;
  }
}

export const saleApi = new SaleApi();