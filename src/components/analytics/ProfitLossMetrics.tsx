import { TrendingUp, TrendingDown } from "lucide-react";

export const ProfitLossMetrics = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-black/40 p-6 rounded-lg border border-arbisent-text/10 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-arbisent-text font-medium">Total Profit/Loss</h3>
          <TrendingUp className="text-green-500" size={20} />
        </div>
        <p className="text-2xl font-bold text-arbisent-text mt-2">$12,450</p>
        <p className="text-sm text-green-500 mt-1">+15.3% all time</p>
      </div>

      <div className="bg-black/40 p-6 rounded-lg border border-arbisent-text/10 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-arbisent-text font-medium">ROI</h3>
          <TrendingUp className="text-green-500" size={20} />
        </div>
        <p className="text-2xl font-bold text-arbisent-text mt-2">23.5%</p>
        <p className="text-sm text-arbisent-text/70 mt-1">Based on initial investment</p>
      </div>

      <div className="bg-black/40 p-6 rounded-lg border border-arbisent-text/10 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-arbisent-text font-medium">Win Rate</h3>
          <TrendingDown className="text-red-500" size={20} />
        </div>
        <p className="text-2xl font-bold text-arbisent-text mt-2">68.2%</p>
        <p className="text-sm text-arbisent-text/70 mt-1">Last 100 trades</p>
      </div>
    </div>
  );
};