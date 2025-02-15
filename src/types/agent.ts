import { StateGraph } from "@langchain/langgraph";

export interface MarketData {
  asset: string;
  price: number;
  volume: number;
  timestamp: number;
}

export interface SentimentData {
  overall: string;
  confidence: number;
  source: string;
  timestamp: number;
}

export interface AgentInput {
  urls?: string[];
  marketData?: MarketData;
  sentiment?: SentimentData;
  parameters?: any;
}

export interface AgentOutput {
  status: 'success' | 'failed';
  strategies?: any[];
  analysis?: string;
  error?: string;
}

export interface WorkflowState {
  query: string;
  context: {
    urls?: string[];
    marketData?: any;
    sentiment?: any;
    parameters?: any;
  };
  history: any[];
  activeAgent: string;
  status: 'running' | 'completed' | 'failed';
  data: {
    research?: any;
    strategy?: any;
    execution?: any;
    error?: string;
  };
}

export interface StateDefinition {
  workflow: WorkflowState;
}

export type WorkflowStateReducer = (state: WorkflowState) => Promise<WorkflowState>;