import { supabase } from '@/integrations/supabase/client';
import { 
  TradeSchedule, 
  ScheduleCreationParams, 
  ScheduleExecutionResult,
  ScheduleFrequency 
} from './types';
import { addMinutes, addHours, addDays, addWeeks, addMonths } from 'date-fns';

export class TradeScheduler {
  private calculateNextExecution(schedule: TradeSchedule): Date {
    const baseTime = schedule.lastExecuted || schedule.startTime;
    
    switch (schedule.frequency) {
      case 'hourly':
        return addHours(baseTime, 1);
      case 'daily':
        return addDays(baseTime, 1);
      case 'weekly':
        return addWeeks(baseTime, 1);
      case 'monthly':
        return addMonths(baseTime, 1);
      case 'custom':
        return addMinutes(baseTime, schedule.customInterval || 60);
      default:
        throw new Error('Invalid frequency');
    }
  }

  async createSchedule(params: ScheduleCreationParams): Promise<TradeSchedule> {
    const now = new Date();
    
    const schedule: Omit<TradeSchedule, 'id'> = {
      ...params,
      isActive: true,
      executionCount: 0,
      nextExecution: params.startTime,
      createdAt: now,
      updatedAt: now
    };

    const { data, error } = await supabase
      .from('trade_schedules')
      .insert([schedule])
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to create schedule');

    return data;
  }

  async executeScheduledTrade(schedule: TradeSchedule): Promise<ScheduleExecutionResult> {
    try {
      const now = new Date();

      // Execute trade using the execution agent
      const { data: tradeResult, error: tradeError } = await supabase.functions.invoke('execute-trade', {
        body: {
          asset: schedule.asset,
          amount: schedule.amount,
          userId: schedule.userId
        }
      });

      if (tradeError) throw tradeError;

      // Update schedule
      const updates = {
        lastExecuted: now,
        nextExecution: this.calculateNextExecution(schedule),
        executionCount: schedule.executionCount + 1,
        isActive: schedule.maxExecutions ? schedule.executionCount + 1 < schedule.maxExecutions : true,
        updatedAt: now
      };

      const { error: updateError } = await supabase
        .from('trade_schedules')
        .update(updates)
        .eq('id', schedule.id);

      if (updateError) throw updateError;

      return {
        success: true,
        tradeId: tradeResult.tradeId,
        executionTime: now
      };
    } catch (error) {
      console.error('Failed to execute scheduled trade:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: new Date()
      };
    }
  }

  async getActiveSchedules(userId: string): Promise<TradeSchedule[]> {
    const { data, error } = await supabase
      .from('trade_schedules')
      .select('*')
      .eq('userId', userId)
      .eq('isActive', true)
      .order('nextExecution', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async cancelSchedule(scheduleId: string): Promise<void> {
    const { error } = await supabase
      .from('trade_schedules')
      .update({ isActive: false, updatedAt: new Date() })
      .eq('id', scheduleId);

    if (error) throw error;
  }

  async updateSchedule(
    scheduleId: string, 
    updates: Partial<Omit<TradeSchedule, 'id' | 'userId' | 'createdAt'>>
  ): Promise<TradeSchedule> {
    const { data, error } = await supabase
      .from('trade_schedules')
      .update({ ...updates, updatedAt: new Date() })
      .eq('id', scheduleId)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to update schedule');

    return data;
  }
} 