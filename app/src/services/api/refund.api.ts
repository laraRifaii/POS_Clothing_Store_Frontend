// src/renderer/services/api/refund.api.ts
import { apiService } from './api.service';
import { Sale } from './sale.api';
import { Product } from './product.api';

export enum RefundType {
  FULL = 'FULL',
  PARTIAL = 'PARTIAL',
  EXCHANGE = 'EXCHANGE',
}

export interface RefundItem {
  id: number;
  refundId: number;
  saleItemId: number;
  quantity: number;
  refundAmount: number;
  saleItem: {
    id: number;
    productId: number;
    quantity: number;
    price: number;
    discount: number;
    product: Product;
  };
}

export interface Refund {
  id: number;
  saleId: number;
  userId: number;
  refundType: RefundType;
  reason: string;
  notes: string | null;
  totalRefunded: number;
  createdAt: string;
  items: RefundItem[];
  sale: Sale;
  user: {
    id: number;
    username: string;
  };
}

export interface RefundsResponse {
  refunds: Refund[];
  total: number;
}

export interface CreateRefundItemDto {
  saleItemId: number;
  quantity: number;
  refundAmount: number;
}

export interface CreateRefundDto {
  saleId: number;
  refundType: RefundType;
  reason: string;
  notes?: string;
  items: CreateRefundItemDto[];
}

export interface RefundQueryParams {
  saleId?: number;
  userId?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface RefundStats {
  totalRefunds: number;
  totalAmount: number;
  refundsByType: Array<{
    type: RefundType;
    count: number;
    total: number;
  }>;
  startDate: string;
  endDate: string;
}

class RefundApi {
  private readonly REFUND_PREFIX = '/refunds';

  /**
   * Get all refunds with optional filters (Manager/Admin only)
   */
  async getAll(params?: RefundQueryParams): Promise<RefundsResponse> {
    const response = await apiService.get<RefundsResponse>(
      this.REFUND_PREFIX,
      { params }
    );
    return response;
  }

  /**
   * Get refund by ID (Manager/Admin only)
   */
  async getById(id: number): Promise<Refund> {
    const response = await apiService.get<Refund>(
      `${this.REFUND_PREFIX}/${id}`
    );
    return response;
  }

  /**
   * Create new refund (Manager/Admin only)
   */
  async create(data: CreateRefundDto): Promise<Refund> {
    const response = await apiService.post<Refund>(
      this.REFUND_PREFIX,
      data
    );
    return response;
  }

  /**
   * Get refund statistics (Manager/Admin only)
   */
  async getStats(startDate: string, endDate: string): Promise<RefundStats> {
    const response = await apiService.get<RefundStats>(
      `${this.REFUND_PREFIX}/stats`,
      { params: { startDate, endDate } }
    );
    return response;
  }

  /**
   * Get refunds for a specific sale
   */
  async getBySaleId(saleId: number): Promise<Refund[]> {
    const response = await this.getAll({ saleId });
    return response.refunds;
  }
}

export const refundApi = new RefundApi();