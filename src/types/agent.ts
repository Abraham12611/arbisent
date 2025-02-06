export interface AgentInput {
  urls?: string[];
  marketData?: {
    asset: string;
    [key: string]: any;
  };
  sentiment?: any;
  parameters?: any;
}

export interface AgentOutput {
  status?: 'success' | 'failed';
  error?: string;
  strategies?: any[];
  analysis?: string;
  metrics?: {
    executionTime?: number;
    priceImpact?: number;
    fees?: number;
  };
}

export interface SentimentData {
  overall: string;
  confidence: number;
  source: string;
  timestamp: number;
}

export interface ExecutionConfig {
  llm: any;
}

export interface WorkflowState {
  query: string;
  context: any;
  history: any[];
  activeAgent: string;
  status: 'running' | 'completed' | 'failed';
  data?: {
    research?: any;
    strategy?: any;
    execution?: any;
    error?: string;
  };
}