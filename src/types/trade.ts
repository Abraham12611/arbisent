export interface TradeOrder {
  pair: string;
  type: 'market' | 'limit';
  side: 'buy' | 'sell';
  amount: number;
  price?: number;
  slippage: number;
}

export interface TradeFormData extends TradeOrder {
  confirmationRequired: boolean;
}