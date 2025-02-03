import { useState } from "react";
import { TradeHistory } from "./TradeHistory";
import { PerformanceAnalytics } from "./PerformanceAnalytics";
import { FilterControls } from "./FilterControls";

export const HistoryView = () => {
  const [filters, setFilters] = useState<{
    dateRange?: { from: Date; to: Date };
    pair?: string;
    type?: string;
    status?: string;
    profitRange?: { min: number; max: number };
  }>({});

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold mb-2">Trade History</h2>
        <p className="text-muted-foreground">
          View and analyze your trading history and performance metrics
        </p>
      </div>

      <FilterControls onFiltersChange={setFilters} />
      
      <PerformanceAnalytics dateRange={filters.dateRange} />
      
      <div className="mt-8">
        <TradeHistory filters={filters} />
      </div>
    </div>
  );
};