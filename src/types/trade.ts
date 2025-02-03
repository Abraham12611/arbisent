export interface TradeOrder {
  pair: string;
  type: 'market' | 'limit';
  side: 'buy' | 'sell';
  amount: number;
  price?: number;
  slippage: number;
}

export interface Trade {
  id: string;
  user_id: string;
  pair_name: string;
  type: string;
  side: string;
  entry_price: number;
  exit_price?: number;
  amount: number;
  profit_loss?: number;
  status: string;
  stop_loss?: number;
  take_profit?: number;
  created_at: string;
  closed_at?: string;
}