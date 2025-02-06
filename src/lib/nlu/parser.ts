import { TradingIntent, TradingParameters, ParsedTradeMessage, ConversationContext } from './types';
import { supabase } from '@/integrations/supabase/client';

export class TradingNLUParser {
  private context: ConversationContext;

  constructor() {
    this.context = {
      messageHistory: []
    };
  }

  async parseMessage(message: string): Promise<ParsedTradeMessage> {
    try {
      console.log('Parsing trade message:', message);
      
      // Call our edge function to process the message with GPT
      const { data, error } = await supabase.functions.invoke('parse-trade-intent', {
        body: { 
          message,
          context: this.context
        }
      });

      if (error) throw error;

      // Update conversation context
      this.context.messageHistory.push(message);
      this.context.currentAsset = data.parameters.asset || this.context.currentAsset;
      this.context.lastIntent = data.intent;

      return {
        intent: data.intent,
        parameters: data.parameters,
        confidence: data.confidence,
        rawMessage: message
      };
    } catch (error) {
      console.error('Error parsing trade message:', error);
      throw error;
    }
  }

  getContext(): ConversationContext {
    return this.context;
  }

  resetContext() {
    this.context = {
      messageHistory: []
    };
  }
}