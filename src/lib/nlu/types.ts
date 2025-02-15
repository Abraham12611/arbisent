export type TradeIntent = 
  | 'SWAP'
  | 'BUY'
  | 'SELL'
  | 'SCHEDULE_TRADE'
  | 'CANCEL_TRADE'
  | 'CHECK_STATUS'
  | 'SET_ALERT';

export interface ParsedTradeMessage {
  intent: TradeIntent;
  confidence: number;
  parameters: {
    asset?: string;
    amount?: number;
    targetPrice?: number;
    frequency?: string;
    duration?: string;
    exchange?: string;
    slippage?: number;
    [key: string]: any;
  };
  raw: string;
}

export interface NLUResult {
  success: boolean;
  parsed?: ParsedTradeMessage;
  error?: string;
}

export interface TradeValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
