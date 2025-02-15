import { PublicKey } from "@solana/web3.js";
import { solanaConfig } from "@/utils/solanaConfig";
import { TradeParameters } from "./types";
import { toast } from "sonner";

export class TradeValidator {
  async validateTradeParameters(params: TradeParameters): Promise<void> {
    console.log('Validating trade parameters:', params);
    
    try {
      // Validate asset exists
      const assetPubkey = new PublicKey(params.asset);
      const connection = solanaConfig.getConnection();
      const accountInfo = await connection.getAccountInfo(assetPubkey);
      
      if (!accountInfo) {
        throw new Error(`Invalid asset: ${params.asset}`);
      }

      // Validate price and amount
      if (params.price <= 0 || params.amount <= 0) {
        throw new Error('Invalid price or amount');
      }

      // Validate slippage
      if (params.slippage < 0 || params.slippage > 100) {
        throw new Error('Invalid slippage percentage');
      }

      console.log('Trade parameters validated successfully');
    } catch (error: any) {
      console.error('Parameter validation failed:', error);
      throw new Error(`Parameter validation failed: ${error.message}`);
    }
  }
}