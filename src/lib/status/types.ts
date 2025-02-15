export type TradeStatus = 'pending' | 'executing' | 'completed' | 'failed';
export type StatusType = 'info' | 'warning' | 'error' | 'success';

export interface TradeStatusUpdate {
  id: string;
  executionId: string;
  status: StatusType;
  message: string;
  details?: Record<string, any>;
  createdAt: Date;
}

export interface StatusSubscription {
  executionId: string;
  onUpdate: (update: TradeStatusUpdate) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

export interface TradeExecution {
  id: string;
  scheduleId?: string;
  userId: string;
  asset: string;
  amount: number;
  price?: number;
  status: TradeStatus;
  error?: string;
  executionTime: Date;
  completedAt?: Date;
  transactionHash?: string;
  gasUsed?: number;
  gasPrice?: number;
  createdAt: Date;
  updatedAt: Date;
} 