export type TradingIntent = 
  | 'MARKET_BUY' 
  | 'MARKET_SELL'
  | 'LIMIT_BUY'
  | 'LIMIT_SELL'
  | 'ANALYZE'
  | 'SET_STOP_LOSS'
  | 'SET_TAKE_PROFIT';

export interface TradingParameters {
  asset?: string;
  amount?: number;
  price?: number;
  stopLoss?: number;
  takeProfit?: number;
  timeframe?: string;
  strategy?: string;
}

export interface ParsedTradeMessage {
  intent: TradingIntent;
  parameters: TradingParameters;
  confidence: number;
  rawMessage: string;
}

export interface ConversationContext {
  currentAsset?: string;
  currentStrategy?: string;
  lastIntent?: TradingIntent;
  messageHistory: string[];
}