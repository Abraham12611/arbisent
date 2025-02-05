// Define common types used across agents
export interface AgentInput {
  marketData?: {
    asset: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface AgentOutput {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: number;
} 