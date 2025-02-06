import { useState, useCallback } from 'react';
import { TradingNLUParser } from '@/lib/nlu/parser';
import { TradingParameterValidator } from '@/lib/nlu/validator';
import { ParsedTradeMessage } from '@/lib/nlu/types';
import { toast } from 'sonner';

export function useTradeNLU() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastParsedMessage, setLastParsedMessage] = useState<ParsedTradeMessage | null>(null);
  
  const parser = new TradingNLUParser();
  const validator = new TradingParameterValidator();

  const processMessage = useCallback(async (message: string) => {
    try {
      setIsProcessing(true);
      
      // Parse the message
      const parsedMessage = await parser.parseMessage(message);
      console.log('Parsed message:', parsedMessage);

      // Validate parameters
      const { isValid, errors } = validator.validateParameters(parsedMessage.parameters);
      
      if (!isValid) {
        errors.forEach(error => toast.error(error));
        return null;
      }

      setLastParsedMessage(parsedMessage);
      return parsedMessage;
    } catch (error) {
      console.error('Error processing trade message:', error);
      toast.error('Failed to process trade message');
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    processMessage,
    isProcessing,
    lastParsedMessage,
    context: parser.getContext(),
    resetContext: parser.resetContext
  };
}