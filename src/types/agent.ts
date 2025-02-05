// Define common types used across agents
export interface AgentInput {
  urls?: string[];
  marketData?: any;
  sentiment?: any;
}

export interface AgentOutput {
  strategies?: any[];
  analysis?: any;
} 