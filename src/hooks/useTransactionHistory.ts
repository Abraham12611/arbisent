import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  TransactionHistoryService, 
  TransactionFilters, 
  PaginationParams 
} from '@/lib/transactions/service';
import { TradeExecution } from '@/lib/status/types';

const transactionService = new TransactionHistoryService();

export function useTransactionHistory(userId: string) {
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [pagination, setPagination] = useState<PaginationParams>({
    page: 1,
    pageSize: 10
  });

  const {
    data: transactionData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['transactions', userId, filters, pagination],
    queryFn: () => transactionService.getTransactions(userId, filters, pagination)
  });

  const { data: assetDistribution } = useQuery({
    queryKey: ['transactions-by-asset', userId],
    queryFn: () => transactionService.getTransactionsByAsset(userId)
  });

  const { data: successRate } = useQuery({
    queryKey: ['transaction-success-rate', userId],
    queryFn: () => transactionService.getSuccessRate(userId)
  });

  const searchTransactions = useCallback(async (searchTerm: string): Promise<TradeExecution[]> => {
    return transactionService.searchTransactions(userId, searchTerm);
  }, [userId]);

  const updateFilters = useCallback((newFilters: Partial<TransactionFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page on filter change
  }, []);

  const updatePagination = useCallback((newPagination: Partial<PaginationParams>) => {
    setPagination(prev => ({ ...prev, ...newPagination }));
  }, []);

  return {
    transactions: transactionData?.data || [],
    total: transactionData?.total || 0,
    totalPages: transactionData?.totalPages || 0,
    currentPage: pagination.page,
    pageSize: pagination.pageSize,
    filters,
    isLoading,
    error,
    assetDistribution: assetDistribution || {},
    successRate: successRate || 0,
    updateFilters,
    updatePagination,
    searchTransactions,
    refetch
  };
} 