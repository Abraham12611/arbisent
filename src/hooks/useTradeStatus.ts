import { useState, useEffect } from 'react';
import { TradeStatusService } from '@/lib/status/service';
import { TradeStatusUpdate, TradeExecution } from '@/lib/status/types';
import { toast } from 'sonner';

const statusService = new TradeStatusService();

export function useTradeStatus(executionId?: string) {
  const [execution, setExecution] = useState<TradeExecution | null>(null);
  const [updates, setUpdates] = useState<TradeStatusUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!executionId) return;

    let unsubscribe: (() => void) | undefined;

    const loadStatus = async () => {
      try {
        setIsLoading(true);
        
        // Load initial status
        const [executionData, updatesData] = await Promise.all([
          statusService.getExecutionStatus(executionId),
          statusService.getStatusUpdates(executionId)
        ]);

        setExecution(executionData);
        setUpdates(updatesData);

        // Subscribe to updates
        unsubscribe = statusService.subscribeToExecution({
          executionId,
          onUpdate: (update) => {
            setUpdates(prev => [...prev, update]);
            
            // Show toast for important updates
            if (['error', 'success'].includes(update.status)) {
              toast[update.status === 'error' ? 'error' : 'success'](update.message);
            }
          },
          onComplete: () => {
            toast.success('Trade execution completed successfully');
          },
          onError: (error) => {
            toast.error(`Trade execution failed: ${error.message}`);
          }
        });
      } catch (error) {
        console.error('Error loading trade status:', error);
        toast.error('Failed to load trade status');
      } finally {
        setIsLoading(false);
      }
    };

    loadStatus();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [executionId]);

  const addUpdate = async (
    status: 'info' | 'warning' | 'error' | 'success',
    message: string,
    details?: Record<string, any>
  ) => {
    if (!executionId) return;

    try {
      const update = await statusService.addStatusUpdate(
        executionId,
        status,
        message,
        details
      );
      setUpdates(prev => [...prev, update]);
    } catch (error) {
      console.error('Error adding status update:', error);
    }
  };

  const updateStatus = async (
    status: 'pending' | 'executing' | 'completed' | 'failed',
    details?: {
      error?: string;
      transactionHash?: string;
      gasUsed?: number;
      gasPrice?: number;
      price?: number;
    }
  ) => {
    if (!executionId) return;

    try {
      await statusService.updateExecutionStatus(executionId, status, details);
      const updated = await statusService.getExecutionStatus(executionId);
      setExecution(updated);
    } catch (error) {
      console.error('Error updating execution status:', error);
    }
  };

  return {
    execution,
    updates,
    isLoading,
    addUpdate,
    updateStatus
  };
} 