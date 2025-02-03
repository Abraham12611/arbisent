import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowUpDown, TrendingUp, AlertCircle, BarChart } from "lucide-react";
import { toast } from "sonner";

interface KPIMetrics {
  active_opportunities: number;
  total_profit_24h: number;
  risk_level: string;
  success_rate: number;
}

export const KPIMetrics = () => {
  const [metrics, setMetrics] = useState<KPIMetrics>({
    active_opportunities: 0,
    total_profit_24h: 0,
    risk_level: "Low",
    success_rate: 0,
  });

  useEffect(() => {
    const fetchKPIMetrics = async () => {
      try {
        const { data, error } = await supabase
          .from("kpi_metrics")
          .select("*")
          .maybeSingle();

        if (error) {
          console.error("Error fetching KPI metrics:", error);
          toast.error("Failed to fetch KPI metrics");
          return;
        }

        if (data) {
          setMetrics({
            active_opportunities: data.active_opportunities,
            total_profit_24h: data.total_profit_24h,
            risk_level: data.risk_level,
            success_rate: data.success_rate,
          });
        }
      } catch (error: any) {
        console.error("Error in fetchKPIMetrics:", error);
        toast.error("An error occurred while fetching KPI metrics");
      }
    };

    // Initial fetch
    fetchKPIMetrics();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("kpi_metrics_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "kpi_metrics",
        },
        (payload) => {
          console.log("KPI metrics changed:", payload);
          if (payload.new) {
            setMetrics({
              active_opportunities: payload.new.active_opportunities,
              total_profit_24h: payload.new.total_profit_24h,
              risk_level: payload.new.risk_level,
              success_rate: payload.new.success_rate,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div className="bg-black/40 p-6 rounded-lg border border-arbisent-text/10 backdrop-blur-sm hover:bg-black/50 transition-colors">
        <div className="flex items-center justify-between">
          <h3 className="text-arbisent-text font-medium">Active Opportunities</h3>
          <ArrowUpDown className="text-arbisent-accent" size={20} />
        </div>
        <p className="text-2xl font-bold text-arbisent-text mt-2">
          {metrics.active_opportunities}
        </p>
        <p className="text-sm text-arbisent-text/70 mt-1">Updated in real-time</p>
      </div>

      <div className="bg-black/40 p-6 rounded-lg border border-arbisent-text/10 backdrop-blur-sm hover:bg-black/50 transition-colors">
        <div className="flex items-center justify-between">
          <h3 className="text-arbisent-text font-medium">Total Profit (24h)</h3>
          <TrendingUp className="text-green-500" size={20} />
        </div>
        <p className="text-2xl font-bold text-arbisent-text mt-2">
          ${metrics.total_profit_24h.toFixed(2)}
        </p>
        <p className="text-sm text-green-500 mt-1">Updated in real-time</p>
      </div>

      <div className="bg-black/40 p-6 rounded-lg border border-arbisent-text/10 backdrop-blur-sm hover:bg-black/50 transition-colors">
        <div className="flex items-center justify-between">
          <h3 className="text-arbisent-text font-medium">Risk Level</h3>
          <AlertCircle className="text-yellow-500" size={20} />
        </div>
        <p className="text-2xl font-bold text-arbisent-text mt-2">
          {metrics.risk_level}
        </p>
        <p className="text-sm text-arbisent-text/70 mt-1">Based on market volatility</p>
      </div>

      <div className="bg-black/40 p-6 rounded-lg border border-arbisent-text/10 backdrop-blur-sm hover:bg-black/50 transition-colors">
        <div className="flex items-center justify-between">
          <h3 className="text-arbisent-text font-medium">Success Rate</h3>
          <BarChart className="text-arbisent-accent" size={20} />
        </div>
        <p className="text-2xl font-bold text-arbisent-text mt-2">
          {metrics.success_rate.toFixed(1)}%
        </p>
        <p className="text-sm text-arbisent-text/70 mt-1">Last 100 trades</p>
      </div>
    </div>
  );
};