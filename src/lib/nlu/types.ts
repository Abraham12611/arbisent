
export type TradingIntent = 
  | 'MARKET_BUY' 
  | 'MARKET_SELL'
  | 'LIMIT_BUY'
  | 'LIMIT_SELL'
  | 'ANALYZE'
  | 'SET_STOP_LOSS'
  | 'SET_TAKE_PROFIT'
  | 'SCHEDULE_TRADE';

export interface TimeframeParameters {
  type: 'recurring' | 'one-time';
  interval?: 'hourly' | 'daily' | 'weekly' | 'monthly';
  startTime: string;
  endTime?: string;
}

export interface TradingParameters {
  asset?: string;
  amount?: number;
  price?: number;
  stopLoss?: number;
  takeProfit?: number;
  timeframe?: TimeframeParameters;
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
