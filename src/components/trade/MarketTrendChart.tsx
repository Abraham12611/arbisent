import {
  BarChart,
  Card,
} from "@tremor/react";
import { AssetType, Asset } from "@/types/price-dashboard";

interface MarketTrendChartProps {
  trends: {
    type: AssetType;
    avgPriceChange: number;
    totalVolume: number;
  }[];
}

export const MarketTrendChart = ({ trends }: MarketTrendChartProps) => {
  const chartData = trends.map(trend => ({
    name: trend.type,
    "Price Change %": parseFloat(trend.avgPriceChange.toFixed(2)),
    "Volume": trend.totalVolume,
  }));

  return (
    <Card className="p-4 bg-arbisent-background-light">
      <h3 className="text-sm font-medium text-arbisent-text mb-4">Market Trends Overview</h3>
      <div className="h-48">
        <BarChart
          data={chartData}
          index="name"
          categories={["Price Change %"]}
          colors={["blue"]}
          valueFormatter={(number: number) => `${number.toFixed(2)}%`}
          showGridLines={true}
          showLegend={true}
        />
      </div>
    </Card>
  );
}; 