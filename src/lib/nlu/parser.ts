import { TradeIntent, ParsedTradeMessage, NLUResult } from './types';
import { supabase } from '@/integrations/supabase/client';

const INTENT_PATTERNS = {
  SWAP: /\b(?:swap|exchange|convert)\b/i,
  BUY: /\b(?:buy|purchase|long)\b/i,
  SELL: /\b(?:sell|short)\b/i,
  SCHEDULE_TRADE: /\b(?:schedule|daily|weekly|every|recurring)\b/i,
  CANCEL_TRADE: /\b(?:cancel|stop|terminate)\b/i,
  CHECK_STATUS: /\b(?:status|progress|check)\b/i,
  SET_ALERT: /\b(?:alert|notify|when)\b/i
};

const PARAMETER_PATTERNS = {
  asset: /\b(?:SOL|ETH|BTC|USDC|[A-Z]{2,10}\/[A-Z]{2,10})\b/i,
  amount: /\b(\d+(?:\.\d+)?)\s*(?:SOL|ETH|BTC|USDC|tokens?|coins?)\b/i,
  targetPrice: /\b(?:at|price|target|when)\s*(?:\$|USD\s*)?(\d+(?:\.\d+)?)\b/i,
  frequency: /\b(daily|weekly|monthly|hourly|every\s*\d+\s*(?:days?|weeks?|hours?|months?))\b/i,
  duration: /\b(?:for|during)\s*(\d+\s*(?:days?|weeks?|months?|hours?))\b/i,
  exchange: /\b(?:on|via|using|through)\s*(Orca|Jupiter|Raydium|Serum)\b/i,
  slippage: /\b(?:slippage|slip)\s*(?:of)?\s*(\d+(?:\.\d+)?%?)\b/i
};

export function parseTradeMessage(message: string): NLUResult {
  try {
    // Detect intent
    let detectedIntent: TradeIntent | null = null;
    let highestConfidence = 0;

    for (const [intent, pattern] of Object.entries(INTENT_PATTERNS)) {
      const matches = message.match(pattern);
      if (matches) {
        const confidence = matches.length / message.split(' ').length;
        if (confidence > highestConfidence) {
          highestConfidence = confidence;
          detectedIntent = intent as TradeIntent;
        }
      }
    }

    if (!detectedIntent) {
      return {
        success: false,
        error: 'Could not determine trade intent'
      };
    }

    // Extract parameters
    const parameters: ParsedTradeMessage['parameters'] = {};
    
    for (const [param, pattern] of Object.entries(PARAMETER_PATTERNS)) {
      const matches = message.match(pattern);
      if (matches && matches[1]) {
        // Convert numeric values
        if (['amount', 'targetPrice', 'slippage'].includes(param)) {
          parameters[param] = parseFloat(matches[1].replace('%', ''));
        } else {
          parameters[param] = matches[1];
        }
      }
    }

    const parsed: ParsedTradeMessage = {
      intent: detectedIntent,
      confidence: highestConfidence,
      parameters,
      raw: message
    };

    return {
      success: true,
      parsed
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse trade message'
    };
  }
}

export function validateTradeParameters(parsed: ParsedTradeMessage): string[] {
  const errors: string[] = [];

  switch (parsed.intent) {
    case 'SWAP':
    case 'BUY':
    case 'SELL':
      if (!parsed.parameters.asset) {
        errors.push('Asset not specified');
      }
      if (!parsed.parameters.amount) {
        errors.push('Amount not specified');
      }
      break;

    case 'SCHEDULE_TRADE':
      if (!parsed.parameters.asset) {
        errors.push('Asset not specified');
      }
      if (!parsed.parameters.amount) {
        errors.push('Amount not specified');
      }
      if (!parsed.parameters.frequency) {
        errors.push('Trade frequency not specified');
      }
      break;

    case 'SET_ALERT':
      if (!parsed.parameters.asset) {
        errors.push('Asset not specified');
      }
      if (!parsed.parameters.targetPrice) {
        errors.push('Target price not specified');
      }
      break;
  }

  return errors;
}