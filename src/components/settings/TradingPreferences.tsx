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

interface TradingPreferencesFormValues {
  default_pairs: string[];
  risk_management: {
    default_stop_loss_percentage: number;
    default_take_profit_percentage: number;
    max_position_size_usd: number;
  };
  interface_preferences: {
    chart_type: string;
    default_timeframe: string;
    layout: string;
  };
}

export function TradingPreferences() {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<TradingPreferencesFormValues>({
    defaultValues: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('trading_preferences')
        .eq('id', user?.id)
        .single();

      return {
        default_pairs: profile?.trading_preferences?.default_pairs || ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'],
        risk_management: {
          default_stop_loss_percentage: profile?.trading_preferences?.risk_management?.default_stop_loss_percentage || 5,
          default_take_profit_percentage: profile?.trading_preferences?.risk_management?.default_take_profit_percentage || 10,
          max_position_size_usd: profile?.trading_preferences?.risk_management?.max_position_size_usd || 1000,
        },
        interface_preferences: {
          chart_type: profile?.trading_preferences?.interface_preferences?.chart_type || 'candlestick',
          default_timeframe: profile?.trading_preferences?.interface_preferences?.default_timeframe || '1h',
          layout: profile?.trading_preferences?.interface_preferences?.layout || 'default',
        },
      };
    },
  });

  const onSubmit = async (values: TradingPreferencesFormValues) => {
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