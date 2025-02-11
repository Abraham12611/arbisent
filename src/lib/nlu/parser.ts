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
      
      // Get session first
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('No active session');
      }
      
      // Call our edge function to process the message with GPT
      const { data, error } = await supabase.functions.invoke('parse-trade-intent', {
        body: { 
          message,
          context: this.context
        },
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(`Failed to process message: ${error.message}`);
      }

      if (!data) {
        throw new Error('No response from parse-trade-intent function');
      }

      // Update conversation context
      this.context.messageHistory.push(message);
      this.context.currentAsset = data.parameters?.asset || this.context.currentAsset;
      this.context.lastIntent = data.intent;

      return {
        intent: data.intent || 'ANALYZE',
        parameters: data.parameters || {},
        confidence: data.confidence || 0.5,
        rawMessage: message
      };
    } catch (error) {
      console.error('Error parsing trade message:', error);
      // Return a fallback response instead of throwing
      return {
        intent: 'ANALYZE',
        parameters: {
          strategy: 'error_fallback',
          asset: this.context.currentAsset
        },
        confidence: 0.1,
        rawMessage: message
      };
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