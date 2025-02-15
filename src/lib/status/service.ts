import { supabase } from '@/integrations/supabase/client';
import { 
  TradeStatus, 
  StatusType, 
  TradeStatusUpdate, 
  StatusSubscription,
  TradeExecution 
} from './types';

export class TradeStatusService {
  private subscriptions: Map<string, StatusSubscription[]> = new Map();

  constructor() {
    this.initializeRealtimeSubscription();
  }

  private initializeRealtimeSubscription() {
    supabase
      .channel('trade-status')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trade_status_updates'
        },
        (payload) => {
          const update = payload.new as TradeStatusUpdate;
          this.notifySubscribers(update);
        }
      )
      .subscribe();
  }

  private notifySubscribers(update: TradeStatusUpdate) {
    const subs = this.subscriptions.get(update.executionId) || [];
    subs.forEach(sub => {
      sub.onUpdate(update);
      
      // Check if this is a final status
      if (update.status === 'success' && sub.onComplete) {
        sub.onComplete();
      } else if (update.status === 'error' && sub.onError) {
        sub.onError(new Error(update.message));
      }
    });
  }

  async createExecution(params: Omit<TradeExecution, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<TradeExecution> {
    const { data, error } = await supabase
      .from('trade_executions')
      .insert([{
        ...params,
        status: 'pending'
      }])
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to create execution');

    return data;
  }

  async updateExecutionStatus(
    executionId: string,
    status: TradeStatus,
    details?: {
      error?: string;
      transactionHash?: string;
      gasUsed?: number;
      gasPrice?: number;
      price?: number;
    }
  ): Promise<void> {
    const updates: any = {
      status,
      updatedAt: new Date().toISOString()
    };

    if (status === 'completed') {
      updates.completedAt = new Date().toISOString();
    }

    if (details) {
      Object.assign(updates, details);
    }

    const { error } = await supabase
      .from('trade_executions')
      .update(updates)
      .eq('id', executionId);

    if (error) throw error;
  }

  async addStatusUpdate(
    executionId: string,
    status: StatusType,
    message: string,
    details?: Record<string, any>
  ): Promise<TradeStatusUpdate> {
    const { data, error } = await supabase
      .from('trade_status_updates')
      .insert([{
        execution_id: executionId,
        status,
        message,
        details
      }])
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to create status update');

    return data;
  }

  async getExecutionStatus(executionId: string): Promise<TradeExecution> {
    const { data, error } = await supabase
      .from('trade_executions')
      .select('*')
      .eq('id', executionId)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Execution not found');

    return data;
  }

  async getStatusUpdates(executionId: string): Promise<TradeStatusUpdate[]> {
    const { data, error } = await supabase
      .from('trade_status_updates')
      .select('*')
      .eq('execution_id', executionId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  subscribeToExecution(subscription: StatusSubscription): () => void {
    const subs = this.subscriptions.get(subscription.executionId) || [];
    subs.push(subscription);
    this.subscriptions.set(subscription.executionId, subs);

    // Return unsubscribe function
    return () => {
      const currentSubs = this.subscriptions.get(subscription.executionId) || [];
      this.subscriptions.set(
        subscription.executionId,
        currentSubs.filter(sub => sub !== subscription)
      );
    };
  }
} 