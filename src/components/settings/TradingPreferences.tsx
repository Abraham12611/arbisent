import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { TradingPairsSection } from "./trading/TradingPairsSection";
import { RiskManagementSection } from "./trading/RiskManagementSection";
import { InterfaceSection } from "./trading/InterfaceSection";
import type { TradingPreferences } from "@/types/preferences";

export function TradingPreferences() {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<TradingPreferences>({
    defaultValues: async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: profile } = await supabase
          .from('profiles')
          .select('trading_preferences')
          .eq('id', user?.id)
          .single();

        const defaultPreferences: TradingPreferences = {
          default_pairs: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'],
          risk_management: {
            default_stop_loss_percentage: 5,
            default_take_profit_percentage: 10,
            max_position_size_usd: 1000,
          },
          interface_preferences: {
            chart_type: 'candlestick',
            default_timeframe: '1h',
            layout: 'default',
          },
        };

        if (!profile?.trading_preferences) {
          return defaultPreferences;
        }

        const preferences = profile.trading_preferences as TradingPreferences;
        return {
          default_pairs: preferences.default_pairs || defaultPreferences.default_pairs,
          risk_management: {
            default_stop_loss_percentage: preferences.risk_management?.default_stop_loss_percentage || defaultPreferences.risk_management.default_stop_loss_percentage,
            default_take_profit_percentage: preferences.risk_management?.default_take_profit_percentage || defaultPreferences.risk_management.default_take_profit_percentage,
            max_position_size_usd: preferences.risk_management?.max_position_size_usd || defaultPreferences.risk_management.max_position_size_usd,
          },
          interface_preferences: {
            chart_type: preferences.interface_preferences?.chart_type || defaultPreferences.interface_preferences.chart_type,
            default_timeframe: preferences.interface_preferences?.default_timeframe || defaultPreferences.interface_preferences.default_timeframe,
            layout: preferences.interface_preferences?.layout || defaultPreferences.interface_preferences.layout,
          },
        };
      } catch (error) {
        console.error('Error loading trading preferences:', error);
        return {
          default_pairs: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'],
          risk_management: {
            default_stop_loss_percentage: 5,
            default_take_profit_percentage: 10,
            max_position_size_usd: 1000,
          },
          interface_preferences: {
            chart_type: 'candlestick',
            default_timeframe: '1h',
            layout: 'default',
          },
        };
      }
    },
  });

  const onSubmit = async (values: TradingPreferences) => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("No user found");

      const { error } = await supabase
        .from('profiles')
        .update({
          trading_preferences: values
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success("Trading preferences updated successfully");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Trading Preferences</h3>
        <p className="text-sm text-muted-foreground">
          Customize your trading experience and risk management settings
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <TradingPairsSection control={form.control} />
          <RiskManagementSection control={form.control} />
          <InterfaceSection control={form.control} />

          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Preferences
          </Button>
        </form>
      </Form>
    </div>
  );
}