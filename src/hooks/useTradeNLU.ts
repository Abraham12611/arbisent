import { useState, useCallback } from 'react';
import { ParsedTradeMessage, NLUResult } from '@/lib/nlu/types';
import { parseTradeMessage, validateTradeParameters } from '@/lib/nlu/parser';
import { toast } from 'sonner';
import { ArbitrageService } from '../services/arbitrage/arbitrage.service';
import { providers } from 'ethers';
import { useWallet } from '@solana/wallet-adapter-react';

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
  const { publicKey, signTransaction } = useWallet();
  
  // Initialize provider and arbitrage service
  const provider = new providers.JsonRpcProvider(
    import.meta.env.VITE_ETHEREUM_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/your-api-key'
  );
  
  const arbitrageService = new ArbitrageService(provider);

  const processMessage = useCallback(async (input: string) => {
    if (!publicKey) {
      toast.error('Please connect your wallet first');
      return null;
    }

    const lowerInput = input.toLowerCase();
    const newMessage: Message = {
      id: crypto.randomUUID(),
      type: 'text',
      content: input,
      timestamp: Date.now(),
    };

    try {
      // Check for arbitrage scanning request
      if (lowerInput.includes('arbitrage') || 
          (lowerInput.includes('search') && lowerInput.includes('opportunities'))) {
        newMessage.type = 'arbitrage';
        
        // Extract trading pair if specified, default to ETH/USDT
        const pair = extractTradingPair(lowerInput) || 'ETH/USDT';
        
        // Scan for opportunities
        const opportunities = await arbitrageService.scanForOpportunities(pair);
        newMessage.data = { opportunities, pair };
      }
      // Add other message type handlers here...

      setMessages(prev => [...prev, newMessage]);
      return newMessage;
    } catch (error) {
      console.error('Error processing message:', error);
      toast.error('Failed to process message');
      return null;
    }
  }, [publicKey, arbitrageService]);

  const processTradeMessage = async (message: string): Promise<ParsedTradeMessage | null> => {
    if (!publicKey) {
      setErrors(['Please connect your wallet first']);
      return null;
    }

    try {
      setIsProcessing(true);
      setErrors([]);

      // Parse the message
      const result: NLUResult = parseTradeMessage(message);

      if (!result.success || !result.parsed) {
        setErrors([result.error || 'Failed to parse message']);
        return null;
      }

      // Validate the parsed parameters
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

  return {
    messages,
    processMessage,
    processTradeMessage,
    isProcessing,
    lastParsedMessage,
    errors,
    clearMessages: () => setMessages([]),
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