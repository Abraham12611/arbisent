import { useState } from 'react';
import { ParsedTradeMessage, NLUResult } from '@/lib/nlu/types';
import { parseTradeMessage, validateTradeParameters } from '@/lib/nlu/parser';
import { toast } from 'sonner';

export function useTradeNLU() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastParsedMessage, setLastParsedMessage] = useState<ParsedTradeMessage | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const processMessage = async (message: string): Promise<ParsedTradeMessage | null> => {
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
    processMessage,
    isProcessing,
    lastParsedMessage,
    errors,
  };
}