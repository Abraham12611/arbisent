
import { PublicKey } from "@solana/web3.js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WalletAddresses, WalletAddress } from "@/types/preferences";

export class WalletService {
  static async validateWallet(address: string, chain: 'solana' | 'ethereum'): Promise<boolean> {
    try {
      if (chain === 'solana') {
        new PublicKey(address); // This will throw if invalid
        return true;
      }
      // Add ethereum validation if needed
      return true;
    } catch {
      return false;
    }
  }

  static async getWalletBalance(address: string, chain: 'solana' | 'ethereum'): Promise<string> {
    try {
      if (chain === 'solana') {
        // Implement Solana balance check
        return "0"; // Placeholder
      }
      return "0";
    } catch (error) {
      console.error('Error getting wallet balance:', error);
      return "0";
    }
  }

  static async updateWalletAddresses(
    userId: string, 
    addresses: WalletAddresses
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate all addresses before saving
      for (const [type, wallet] of Object.entries(addresses)) {
        if (wallet) {
          const isValid = await this.validateWallet(wallet.address, wallet.chain);
          if (!isValid) {
            throw new Error(`Invalid ${type} wallet address`);
          }
          // Get and store balance
          wallet.balance = await this.getWalletBalance(wallet.address, wallet.chain);
          wallet.lastUsed = new Date();
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update({ 
          wallet_addresses: this.convertToJson(addresses),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error('Error updating wallet addresses:', error);
      return { success: false, error: error.message };
    }
  }

  private static convertToJson(addresses: WalletAddresses): Record<string, any> {
    return Object.entries(addresses).reduce((acc, [key, wallet]) => {
      if (wallet) {
        acc[key] = {
          ...wallet,
          lastUsed: wallet.lastUsed?.toISOString(),
        };
      }
      return acc;
    }, {} as Record<string, any>);
  }
}
