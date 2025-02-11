export type ScheduleFrequency = 
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'custom';

export interface TradeSchedule {
  id: string;
  userId: string;
  asset: string;
  amount: number;
  frequency: ScheduleFrequency;
  customInterval?: number; // in minutes
  startTime: Date;
  endTime?: Date;
  isActive: boolean;
  lastExecuted?: Date;
  nextExecution?: Date;
  executionCount: number;
  maxExecutions?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScheduleCreationParams {
  userId: string;
  asset: string;
  amount: number;
  frequency: ScheduleFrequency;
  customInterval?: number;
  startTime: Date;
  endTime?: Date;
  maxExecutions?: number;
}

export interface ScheduleExecutionResult {
  success: boolean;
  tradeId?: string;
  error?: string;
  executionTime: Date;
} 