import { ArrowDown, ArrowUp } from "lucide-react";
import type { SortConfig } from "@/types/price-dashboard";

interface CoinTableHeaderProps {
  onSort: (key: string) => void;
  sortConfig: SortConfig;
  showSource?: boolean;
  showType?: boolean;
}

export const CoinTableHeader = ({ 
  onSort, 
  sortConfig,
  showSource = false,
  showType = false,
}: CoinTableHeaderProps) => {
  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="w-4 h-4 ml-1" />
    ) : (
      <ArrowDown className="w-4 h-4 ml-1" />
    );
  };

  return (
    <thead className="bg-arbisent-background-light">
      <tr>
        <th className="px-6 py-3 text-left text-xs font-medium text-arbisent-text/60 uppercase tracking-wider">
          Asset
        </th>
        <th
          className="px-6 py-3 text-left text-xs font-medium text-arbisent-text/60 uppercase tracking-wider cursor-pointer"
          onClick={() => onSort("price")}
        >
          <div className="flex items-center">
            Price {getSortIcon("price")}
          </div>
        </th>
        <th
          className="px-6 py-3 text-left text-xs font-medium text-arbisent-text/60 uppercase tracking-wider cursor-pointer"
          onClick={() => onSort("priceChange24h")}
        >
          <div className="flex items-center">
            24h Change {getSortIcon("priceChange24h")}
          </div>
        </th>
        <th
          className="px-6 py-3 text-left text-xs font-medium text-arbisent-text/60 uppercase tracking-wider cursor-pointer"
          onClick={() => onSort("marketCap")}
        >
          <div className="flex items-center">
            Market Cap {getSortIcon("marketCap")}
          </div>
        </th>
        <th
          className="px-6 py-3 text-left text-xs font-medium text-arbisent-text/60 uppercase tracking-wider cursor-pointer"
          onClick={() => onSort("volume24h")}
        >
          <div className="flex items-center">
            Volume (24h) {getSortIcon("volume24h")}
          </div>
        </th>
        {showType && (
          <th className="px-6 py-3 text-left text-xs font-medium text-arbisent-text/60 uppercase tracking-wider">
            Type
          </th>
        )}
        {showSource && (
          <th className="px-6 py-3 text-left text-xs font-medium text-arbisent-text/60 uppercase tracking-wider">
            Source
          </th>
        )}
      </tr>
    </thead>
  );
};