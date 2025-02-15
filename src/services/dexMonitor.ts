import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface DexPrice {
  dex: string;
  pair: string;
  price: number;
  timestamp: number;
}

export class DexMonitorService {
  private channels: { [key: string]: any } = {};
  private priceCallbacks: ((prices: DexPrice[]) => void)[] = [];

  constructor() {
    console.log('Initializing DexMonitorService');
  }

  async monitorPair(pair: string) {
    console.log('Starting monitoring for pair:', pair);
    
    if (this.channels[pair]) {
      console.log('Already monitoring pair:', pair);
      return;
    }

    try {
      // Subscribe to real-time price updates
      const channel = supabase
        .channel(`dex-${pair}`)
        .on(
          'broadcast',
          { event: 'price_update' },
          (payload) => {
            console.log('Received price update:', payload);
            this.handlePriceUpdate(payload.payload as DexPrice);
          }
        )
        .subscribe((status) => {
          console.log('Subscription status:', status);
          
          if (status === 'SUBSCRIBED') {
            toast.success(`Started monitoring ${pair}`);
          }
        });

      this.channels[pair] = channel;

      // Store the watched pair in the database
      const { error } = await supabase
        .from('watched_pairs')
        .insert({
          pair_name: pair,
          dex_name: 'all', // We'll monitor all DEXs for this pair
          pair_address: '', // This will be populated by the backend
        });

      if (error) {
        console.error('Error storing watched pair:', error);
        toast.error(`Failed to store ${pair} in watched pairs`);
      }

    } catch (error) {
      console.error('Error setting up monitoring:', error);
      toast.error(`Failed to start monitoring ${pair}`);
    }
  }

  async stopMonitoring(pair: string) {
    console.log('Stopping monitoring for pair:', pair);
    
    if (!this.channels[pair]) {
      console.log('Not monitoring pair:', pair);
      return;
    }

    try {
      await supabase.removeChannel(this.channels[pair]);
      delete this.channels[pair];

      // Remove from watched pairs
      const { error } = await supabase
        .from('watched_pairs')
        .delete()
        .match({ pair_name: pair });

      if (error) {
        console.error('Error removing watched pair:', error);
        toast.error(`Failed to remove ${pair} from watched pairs`);
      } else {
        toast.success(`Stopped monitoring ${pair}`);
      }

    } catch (error) {
      console.error('Error stopping monitoring:', error);
      toast.error(`Failed to stop monitoring ${pair}`);
    }
  }

  onPriceUpdate(callback: (prices: DexPrice[]) => void) {
    this.priceCallbacks.push(callback);
    return () => {
      this.priceCallbacks = this.priceCallbacks.filter(cb => cb !== callback);
    };
  }

  private handlePriceUpdate(price: DexPrice) {
    this.priceCallbacks.forEach(callback => callback([price]));
  }
}

export const dexMonitor = new DexMonitorService();