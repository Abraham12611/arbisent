import { useState, useEffect } from 'react';
import { Connection, Keypair } from '@solana/web3.js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useSolanaConfig = () => {
  const [connection, setConnection] = useState<Connection | null>(null);
  const [wallet, setWallet] = useState<Keypair | null>(null);

  useEffect(() => {
    const initializeSolanaConfig = async () => {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('wallet_addresses')
          .single();

        if (profile?.wallet_addresses) {
          const walletData = profile.wallet_addresses as Record<string, { address: string; privateKey?: string }>;
          const phantomWallet = walletData.phantom;

          if (phantomWallet?.privateKey) {
            const secretKey = Uint8Array.from(JSON.parse(phantomWallet.privateKey));
            const keypair = Keypair.fromSecretKey(secretKey);
            setWallet(keypair);
          }
        }

        const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';
        const conn = new Connection(rpcUrl);
        setConnection(conn);
      } catch (error: any) {
        console.error('Error initializing Solana config:', error);
        toast.error('Failed to initialize Solana configuration');
      }
    };

    initializeSolanaConfig();
  }, []);

  return { connection, wallet };
};