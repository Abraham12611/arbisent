import { Input } from "@/components/ui/input";
import { useState } from "react";
import type { PriceFilter } from "@/types/price-dashboard";

interface FilterBarProps {
  onFilterChange: (filters: PriceFilter) => void;
}

export const FilterBar = ({ onFilterChange }: FilterBarProps) => {
  const [filters, setFilters] = useState<PriceFilter>({
    search: "",
    minPrice: "",
    maxPrice: "",
    minMarketCap: "",
    maxMarketCap: "",
  });

  const handleFilterChange = (key: keyof PriceFilter, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
      <Input
        placeholder="Search by name or symbol"
        value={filters.search}
        onChange={(e) => handleFilterChange("search", e.target.value)}
        className="bg-arbisent-secondary/50"
      />
      <Input
        placeholder="Min Price ($)"
        type="number"
        value={filters.minPrice}
        onChange={(e) => handleFilterChange("minPrice", e.target.value)}
        className="bg-arbisent-secondary/50"
      />
      <Input
        placeholder="Max Price ($)"
        type="number"
        value={filters.maxPrice}
        onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
        className="bg-arbisent-secondary/50"
      />
      <Input
        placeholder="Min Market Cap ($)"
        type="number"
        value={filters.minMarketCap}
        onChange={(e) => handleFilterChange("minMarketCap", e.target.value)}
        className="bg-arbisent-secondary/50"
      />
      <Input
        placeholder="Max Market Cap ($)"
        type="number"
        value={filters.maxMarketCap}
        onChange={(e) => handleFilterChange("maxMarketCap", e.target.value)}
        className="bg-arbisent-secondary/50"
      />
    </div>
  );
};