import { PublicKey } from "@solana/web3.js";

export interface TradeParameters {
  side: 'buy' | 'sell';
  asset: string;
  amount: number;
  price: number;
  slippage: number;
  dex: string;
}

export interface TradeResult {
  status: 'success' | 'failed';
  signature?: string;
  error?: string;
  metrics: {
    executionTime: number;
    priceImpact: number;
    fees: number;
  };
}

export interface TokenData {
  symbol: string;
  decimals: number;
}

export interface ExecutionConfig {
  llm: any; // ChatOpenAI type from langchain
}