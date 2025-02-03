import { TradeHistory } from "./TradeHistory";
import { PerformanceAnalytics } from "./PerformanceAnalytics";

export const HistoryView = () => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold mb-2">Trade History</h2>
        <p className="text-muted-foreground">
          View and analyze your trading history and performance metrics
        </p>
      </div>

      <PerformanceAnalytics />
      
      <div className="mt-8">
        <TradeHistory />
      </div>
    </div>
  );
};