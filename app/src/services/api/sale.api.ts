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
  costPrice: number;  // Added for profit calculation
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

export interface SalesResponse {
  sales: Sale[];
  total: number;
  message:string;
}

export interface PaymentBreakdown {
  paymentType: PaymentType;
  count: number;
  total: number;
}

export interface TopSellingProduct {
  product: Product;
  quantitySold: number;
  revenue: number;
  cost: number;
  profit: number;
  profitMargin: number;
}

export interface SalesReport {
  totalSales: number;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  profitMargin: number;
  totalDiscount: number;
  paymentBreakdown: PaymentBreakdown[];
  topSellingProducts: TopSellingProduct[];
  startDate: string;
  endDate: string;
  
}

export interface CategoryProfit {
  category: string;
  revenue: number;
  cost: number;
  profit: number;
  profitMargin: number;
  itemsSold: number;
}

class SaleApi {
  private readonly SALE_PREFIX = '/sales';

  async create(data: CreateSaleDto): Promise<Sale> {
    const response = await apiService.post<Sale>(this.SALE_PREFIX, data);
    return response;
  }

  async getAll(params?: SaleQueryParams): Promise<SalesResponse> {
    const response = await apiService.get<SalesResponse>(
      this.SALE_PREFIX,
      { params }
    );
    return response;
  }

  async getById(id: number): Promise<Sale> {
    const response = await apiService.get<Sale>(
      `${this.SALE_PREFIX}/${id}`
    );
    return response;
  }

  async getReport(startDate: string, endDate: string): Promise<SalesReport> {
    const response = await apiService.get<SalesReport>(
      `${this.SALE_PREFIX}/reports/`,
      {
        params: { startDate, endDate }
      }
    );
    return response;
  }

  async getDailyReport(date: string): Promise<SalesReport> {
    const response = await apiService.get<SalesReport>(
      `${this.SALE_PREFIX}/sales/daily`,
      {
        params: { date }
      }
    );
    return response;
  }

  async getCategoryProfit(startDate: string, endDate: string): Promise<CategoryProfit[]> {
    const response = await apiService.get<CategoryProfit[]>(
      `${this.SALE_PREFIX}/reports/category-profit`,
      {
        params: { startDate, endDate }
      }
    );
    return response;
  }
}

export const saleApi = new SaleApi();