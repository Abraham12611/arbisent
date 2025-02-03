import { PerformanceChart } from "./PerformanceChart";
import { ProfitLossMetrics } from "./ProfitLossMetrics";
import { TradeHistory } from "./TradeHistory";

export const AnalyticsView = () => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-arbisent-text mb-2">Analytics</h2>
        <p className="text-arbisent-text/70">Track your trading performance and history</p>
      </div>
      
      <ProfitLossMetrics />
      <PerformanceChart />
      <TradeHistory />
    </div>
  );
};