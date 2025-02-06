import { TradeResult } from "./types";

export class TradeLogger {
  async logTradeOutcome(result: TradeResult): Promise<void> {
    console.log('Logging trade outcome:', result);
    // Implement trade logging
    // This could be expanded to store in Supabase or emit events
  }
}