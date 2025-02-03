import { ArrowUpDown } from "lucide-react";
import type { SortConfig } from "@/types/price-dashboard";

interface CoinTableHeaderProps {
  onSort: (key: string) => void;
  sortConfig: SortConfig;
}

export const CoinTableHeader = ({ onSort, sortConfig }: CoinTableHeaderProps) => {
  const renderSortIcon = (key: string) => {
    if (sortConfig.key === key) {
      return (
        <ArrowUpDown
          className={`inline-block ml-1 h-4 w-4 transition-transform ${
            sortConfig.direction === "desc" ? "transform rotate-180" : ""
          }`}
        />
      );
    }
    return null;
  };

  return (
    <thead>
      <tr className="text-left text-sm text-arbisent-text/70">
        <th className="px-6 py-3 cursor-pointer" onClick={() => onSort("name")}>
          Asset {renderSortIcon("name")}
        </th>
        <th className="px-6 py-3 cursor-pointer" onClick={() => onSort("current_price")}>
          Price {renderSortIcon("current_price")}
        </th>
        <th className="px-6 py-3 cursor-pointer" onClick={() => onSort("price_change_percentage_24h")}>
          24h Change {renderSortIcon("price_change_percentage_24h")}
        </th>
        <th className="px-6 py-3 cursor-pointer" onClick={() => onSort("price_change_percentage_7d_in_currency")}>
          7d Change {renderSortIcon("price_change_percentage_7d_in_currency")}
        </th>
        <th className="px-6 py-3 cursor-pointer" onClick={() => onSort("market_cap")}>
          Market Cap {renderSortIcon("market_cap")}
        </th>
        <th className="px-6 py-3 cursor-pointer" onClick={() => onSort("total_volume")}>
          Volume (24h) {renderSortIcon("total_volume")}
        </th>
        <th className="px-6 py-3">Actions</th>
      </tr>
    </thead>
  );
};