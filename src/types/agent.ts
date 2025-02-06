export interface WorkflowState {
  query: string;
  context: {
    urls?: string[];
    marketData?: any;
    sentiment?: any;
    parameters?: any;
    [key: string]: any;
  };
  history: any[];
  activeAgent: string;
  status: 'running' | 'completed' | 'failed';
  data: {
    research?: any;
    strategy?: any;
    execution?: any;
    error?: string;
    [key: string]: any;
  };
}

export interface AgentInput {
  urls?: string[];
  marketData?: any;
  sentiment?: any;
  parameters?: any;
}

export interface AgentOutput {
  status: 'success' | 'failed';
  error?: string;
  strategies?: any[];
  analysis?: string;
  metrics?: {
    executionTime: number;
    priceImpact: number;
    fees: number;
  };
}

export interface AgentConfig {
  llm: any;
  vectorStore?: any;
  firecrawlApiKey?: string;
}

export interface MarketData {
  asset: string;
  price: number;
  volume: number;
  timestamp: number;
  [key: string]: any;
}

export interface SentimentData {
  overall: string;
  confidence: number;
  source: string;
  timestamp: number;
}

export interface TradeStrategy {
  type: string;
  parameters: any;
  confidence: number;
}

export interface ResearchResult {
  strategies: TradeStrategy[];
  analysis: string;
  error?: string;
}

export interface StrategyResult {
  strategy: any;
  confidence: number;
  error?: string;
}

export interface ExecutionResult {
  status: 'success' | 'failed';
  signature?: string;
  error?: string;
  metrics: {
    executionTime: number;
    priceImpact: number;
    fees: number;
  };
}

export interface ExecutionConfig {
  llm: any;
}