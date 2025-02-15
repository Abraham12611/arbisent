import { useState, useCallback, useEffect } from 'react';
import { ParsedTradeMessage, NLUResult } from '@/lib/nlu/types';
import { parseTradeMessage, validateTradeParameters } from '@/lib/nlu/parser';
import { toast } from 'sonner';
import { ArbitrageService } from '../services/arbitrage/arbitrage.service';
import { providers } from 'ethers';
import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';
import { supabase } from '@/integrations/supabase/client';
import { WalletAddresses } from '@/types/preferences';

export type MessageType = 'text' | 'trade' | 'arbitrage';

export interface Message {
  id: string;
  type: MessageType;
  content: string;
  timestamp: number;
  data?: any;
}

export function useTradeNLU() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastParsedMessage, setLastParsedMessage] = useState<ParsedTradeMessage | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [provider, setProvider] = useState<providers.Web3Provider | null>(null);
  const [storedWallets, setStoredWallets] = useState<WalletAddresses>({});
  const { publicKey, connected, wallet } = useSolanaWallet();

  // Fetch stored wallet addresses
  useEffect(() => {
    const fetchStoredWallets = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('No user found for wallet fetch');
          return;
        }

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('wallet_addresses')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          return;
        }

        if (profile?.wallet_addresses) {
          console.log('Stored wallets:', profile.wallet_addresses);
          setStoredWallets(profile.wallet_addresses as WalletAddresses);
        }
      } catch (error) {
        console.error('Error fetching stored wallets:', error);
      }
    };

    fetchStoredWallets();
  }, []);

  // Auto-update stored wallet when Solana wallet connects
  useEffect(() => {
    const updateStoredWallet = async () => {
      if (connected && publicKey) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const walletAddress = publicKey.toString();
          const updatedWallets: WalletAddresses = {
            ...storedWallets,
            phantom: {
              address: walletAddress,
              chain: 'solana',
              isDefault: true,
              lastUsed: new Date()
            }
          };

          const { error } = await supabase
            .from('profiles')
            .update({ wallet_addresses: updatedWallets })
            .eq('id', user.id);

          if (!error) {
            setStoredWallets(updatedWallets);
            console.log('Updated stored wallet:', walletAddress);
          }
        } catch (error) {
          console.error('Error updating stored wallet:', error);
        }
      }
    };

    updateStoredWallet();
  }, [connected, publicKey]);

  // Initialize Web3 provider when window.ethereum is available
  useEffect(() => {
    const initProvider = async () => {
      if (window.ethereum) {
        const web3Provider = new providers.Web3Provider(window.ethereum);
        try {
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          setProvider(web3Provider);
        } catch (error) {
          console.error('User denied account access');
        }
      }
    };

    initProvider();
  }, []);

  // Check if Solana wallet is properly connected
  const isSolanaConnected = Boolean(connected && publicKey) || Boolean(storedWallets.phantom?.address);
  
  // Initialize arbitrage service with provider
  const arbitrageService = provider ? new ArbitrageService(provider) : null;

  // Define processTradeMessage first since it's used in processMessage
  const processTradeMessage = async (message: string): Promise<ParsedTradeMessage | null> => {
    try {
      setIsProcessing(true);
      setErrors([]);

      const result: NLUResult = parseTradeMessage(message);

      // If it's not a trade message, don't treat it as an error
      if (!result.success && !message.toLowerCase().includes('trade')) {
        return null;
      }

      if (!result.success || !result.parsed) {
        setErrors([result.error || 'Could not determine trade intent']);
        return null;
      }

      const validationErrors = validateTradeParameters(result.parsed);
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        return null;
      }

      setLastParsedMessage(result.parsed);
      return result.parsed;
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'An error occurred']);
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const processMessage = useCallback(async (input: string) => {
    const lowerInput = input.toLowerCase();
    const newMessage: Message = {
      id: crypto.randomUUID(),
      type: 'text',
      content: input,
      timestamp: Date.now(),
    };

    try {
      // Check for arbitrage-related queries
      if (
        lowerInput.includes('arbitrage') || 
        lowerInput.includes('find opportunities') ||
        (lowerInput.includes('search') && lowerInput.includes('opportunities'))
      ) {
        // Only require wallet connection for actual trading, not for searching
        newMessage.type = 'arbitrage';
        const pair = extractTradingPair(lowerInput) || 'ETH/USDT';
        
        try {
          const opportunities = await arbitrageService?.scanForOpportunities(pair) || [];
          newMessage.data = { opportunities, pair };
          setMessages(prev => [...prev, newMessage]);
          return newMessage;
        } catch (error) {
          console.error('Error scanning for opportunities:', error);
          toast.error('Failed to scan for arbitrage opportunities');
          return null;
        }
      }

      // For trade execution commands
      if (
        lowerInput.includes('buy') || 
        lowerInput.includes('sell') || 
        lowerInput.includes('trade')
      ) {
        const parsedTrade = await processTradeMessage(input);
        if (!parsedTrade) return null;
        
        newMessage.type = 'trade';
        newMessage.data = { parsedTrade };
      }

      // For general queries, just return the message
      setMessages(prev => [...prev, newMessage]);
      return newMessage;
    } catch (error) {
      console.error('Error processing message:', error);
      toast.error('Failed to process message');
      return null;
    }
  }, [arbitrageService]);

  const confirmTrade = async () => {
    if (!isSolanaConnected) {
      toast.error('Please connect your Solana wallet to execute trades');
      return false;
    }
    return true;
  };

  return {
    messages,
    processMessage,
    processTradeMessage,
    isProcessing,
    lastParsedMessage,
    errors,
    clearMessages: () => setMessages([]),
    isEthereumConnected: !!provider,
    isSolanaConnected,
    storedWallets,
    confirmTrade,
  };
}

function extractTradingPair(input: string): string | null {
  // Common trading pair patterns
  const patterns = [
    /\b(ETH|BTC|USDT|USDC|DAI|BNB|MATIC)\/?(ETH|BTC|USDT|USDC|DAI|BNB|MATIC)\b/i,
    /\b(ETH|BTC|USDT|USDC|DAI|BNB|MATIC)\s*-\s*(ETH|BTC|USDT|USDC|DAI|BNB|MATIC)\b/i,
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) {
      const [_, base, quote] = match;
      return `${base.toUpperCase()}/${quote.toUpperCase()}`;
    }
  }

  return null;
}