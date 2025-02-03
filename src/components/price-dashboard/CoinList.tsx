import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { CoinRow } from "./CoinRow";
import { CoinTableHeader } from "./CoinTableHeader";
import { LoadingSpinner } from "./LoadingSpinner";
import { FilterBar } from "./FilterBar";
import { useState, useMemo } from "react";
import type { PriceFilter, SortConfig } from "@/types/price-dashboard";

interface CoinData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency: number;
  market_cap: number;
  total_volume: number;
  sparkline_in_7d: {
    price: number[];
  };
}

export const CoinList = () => {
  const [filters, setFilters] = useState<PriceFilter>({
    search: "",
    minPrice: "",
    maxPrice: "",
    minMarketCap: "",
    maxMarketCap: "",
  });

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "market_cap",
    direction: "desc",
  });

  const { data: coinData, isLoading } = useQuery({
    queryKey: ["crypto-prices"],
    queryFn: async () => {
      try {
        const response = await fetch(
          "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=true&price_change_percentage=24h,7d"
        );
        if (!response.ok) {
          throw new Error("Failed to fetch crypto data");
        }
        return response.json() as Promise<CoinData[]>;
      } catch (error: any) {
        console.error("Error fetching crypto data:", error);
        toast.error("Failed to fetch crypto data. Please try again later.");
        throw error;
      }
    },
    refetchInterval: 30000,
  });

  const filteredAndSortedData = useMemo(() => {
    if (!coinData) return [];

    let filtered = coinData.filter((coin) => {
      const matchesSearch =
        coin.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        coin.symbol.toLowerCase().includes(filters.search.toLowerCase());

      const matchesPrice =
        (!filters.minPrice || coin.current_price >= parseFloat(filters.minPrice)) &&
        (!filters.maxPrice || coin.current_price <= parseFloat(filters.maxPrice));

      const matchesMarketCap =
        (!filters.minMarketCap || coin.market_cap >= parseFloat(filters.minMarketCap)) &&
        (!filters.maxMarketCap || coin.market_cap <= parseFloat(filters.maxMarketCap));

      return matchesSearch && matchesPrice && matchesMarketCap;
    });

    return filtered.sort((a, b) => {
      const aValue = a[sortConfig.key as keyof CoinData];
      const bValue = b[sortConfig.key as keyof CoinData];

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue;
      }
      return 0;
    });
  }, [coinData, filters, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <FilterBar onFilterChange={setFilters} />
      <div className="overflow-x-auto">
        <table className="w-full">
          <CoinTableHeader onSort={handleSort} sortConfig={sortConfig} />
          <tbody>
            {filteredAndSortedData.map((coin) => (
              <CoinRow
                key={coin.id}
                coin={{
                  name: coin.name,
                  symbol: coin.symbol,
                  price: coin.current_price,
                  marketCap: coin.market_cap,
                  volume24h: coin.total_volume,
                  priceChange24h: coin.price_change_percentage_24h || 0,
                }}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};