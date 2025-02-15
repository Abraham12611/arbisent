import { useState, useMemo } from "react";
import { toast } from "sonner";
import { CoinRow } from "./CoinRow";
import { CoinTableHeader } from "./CoinTableHeader";
import { LoadingSpinner } from "./LoadingSpinner";
import { FilterBar } from "./FilterBar";
import type { PriceFilter, SortConfig, Asset, AssetType } from "@/types/price-dashboard";

interface CoinListProps {
  assets: Asset[];
}

export const CoinList = ({ assets }: CoinListProps) => {
  const [filters, setFilters] = useState<PriceFilter>({
    search: "",
    minPrice: "",
    maxPrice: "",
    minMarketCap: "",
    maxMarketCap: "",
    type: "ALL" as AssetType | "ALL",
  });

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "marketCap",
    direction: "desc",
  });

  const filteredAndSortedData = useMemo(() => {
    let filtered = assets.filter((asset) => {
      const matchesSearch =
        asset.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        asset.symbol.toLowerCase().includes(filters.search.toLowerCase());

      const matchesPrice =
        (!filters.minPrice || asset.price >= parseFloat(filters.minPrice)) &&
        (!filters.maxPrice || asset.price <= parseFloat(filters.maxPrice));

      const matchesMarketCap =
        (!filters.minMarketCap || asset.marketCap >= parseFloat(filters.minMarketCap)) &&
        (!filters.maxMarketCap || asset.marketCap <= parseFloat(filters.maxMarketCap));

      const matchesType = 
        filters.type === "ALL" || asset.type === filters.type;

      return matchesSearch && matchesPrice && matchesMarketCap && matchesType;
    });

    return filtered.sort((a, b) => {
      const aValue = a[sortConfig.key as keyof Asset];
      const bValue = b[sortConfig.key as keyof Asset];

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue;
      }
      return 0;
    });
  }, [assets, filters, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  if (!assets.length) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <FilterBar 
        onFilterChange={setFilters} 
        showTypeFilter={true} 
        initialType="ALL"
      />
      <div className="overflow-x-auto">
        <table className="w-full">
          <CoinTableHeader 
            onSort={handleSort} 
            sortConfig={sortConfig}
            showSource={true}
            showType={true}
          />
          <tbody>
            {filteredAndSortedData.map((asset) => (
              <CoinRow
                key={`${asset.id}-${asset.source}`}
                asset={asset}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};