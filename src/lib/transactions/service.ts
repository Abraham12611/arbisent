import { supabase } from '@/integrations/supabase/client';
import { TradeExecution } from '@/lib/status/types';

export interface TransactionFilters {
  status?: string[];
  asset?: string;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface TransactionListResponse {
  data: TradeExecution[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export class TransactionHistoryService {
  async getTransactions(
    userId: string,
    filters?: TransactionFilters,
    pagination?: PaginationParams
  ): Promise<TransactionListResponse> {
    try {
      let query = supabase
        .from('trade_executions')
        .select('*', { count: 'exact' })
        .eq('user_id', userId);

      // Apply filters
      if (filters) {
        if (filters.status && filters.status.length > 0) {
          query = query.in('status', filters.status);
        }
        if (filters.asset) {
          query = query.eq('asset', filters.asset);
        }
        if (filters.startDate) {
          query = query.gte('created_at', filters.startDate.toISOString());
        }
        if (filters.endDate) {
          query = query.lte('created_at', filters.endDate.toISOString());
        }
        if (filters.minAmount) {
          query = query.gte('amount', filters.minAmount);
        }
        if (filters.maxAmount) {
          query = query.lte('amount', filters.maxAmount);
        }
      }

      // Apply pagination
      const { page = 1, pageSize = 10 } = pagination || {};
      const start = (page - 1) * pageSize;
      query = query
        .order('created_at', { ascending: false })
        .range(start, start + pageSize - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data || [],
        total: count || 0,
        page,
        pageSize,
        totalPages: count ? Math.ceil(count / pageSize) : 0
      };
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  }

  async getTransactionsByAsset(userId: string): Promise<Record<string, number>> {
    const { data, error } = await supabase
      .from('trade_executions')
      .select('asset, amount')
      .eq('user_id', userId)
      .eq('status', 'completed');

    if (error) throw error;

    return (data || []).reduce((acc, { asset, amount }) => {
      acc[asset] = (acc[asset] || 0) + amount;
      return acc;
    }, {} as Record<string, number>);
  }

  async getSuccessRate(userId: string): Promise<number> {
    const { data, error } = await supabase
      .from('trade_executions')
      .select('status')
      .eq('user_id', userId);

    if (error) throw error;

    if (!data || data.length === 0) return 0;

    const completed = data.filter(tx => tx.status === 'completed').length;
    return (completed / data.length) * 100;
  }

  async searchTransactions(
    userId: string,
    searchTerm: string,
    limit: number = 10
  ): Promise<TradeExecution[]> {
    const { data, error } = await supabase
      .from('trade_executions')
      .select('*')
      .eq('user_id', userId)
      .or(`asset.ilike.%${searchTerm}%,transaction_hash.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }
} 