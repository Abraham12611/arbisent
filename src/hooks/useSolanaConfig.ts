import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { solanaConfig } from '@/utils/solanaConfig';
import { supabase } from '@/integrations/supabase/client';

export const useSolanaConfig = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeSolana = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('wallet_addresses')
          .eq('id', user.id)
          .single();

        if (!profile?.wallet_addresses?.privateKey) {
          console.log('No wallet configuration found');
          setIsLoading(false);
          return;
        }

        await solanaConfig.initialize(
          process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
          profile.wallet_addresses.privateKey
        );

        setIsInitialized(true);
        console.log('Solana configuration initialized');
      } catch (error) {
        console.error('Error initializing Solana:', error);
        toast.error('Failed to initialize Solana configuration');
      } finally {
        setIsLoading(false);
      }
    };

    initializeSolana();
  }, []);

  return { isInitialized, isLoading };
};