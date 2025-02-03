import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PriceFilter } from "@/types/price-dashboard";
import { debounce } from "lodash";
import { useCallback } from "react";

interface FilterBarProps {
  onFilterChange: (filters: PriceFilter) => void;
}

export const FilterBar = ({ onFilterChange }: FilterBarProps) => {
  const handleFilterChange = useCallback(
    debounce((field: keyof PriceFilter, value: string) => {
      onFilterChange((prev: PriceFilter) => ({
        ...prev,
        [field]: value,
      }));
    }, 300),
    [onFilterChange]
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6 p-4 bg-black/20 rounded-lg">
      <div>
        <Label htmlFor="search" className="text-arbisent-text mb-2">
          Search Asset
        </Label>
        <Input
          id="search"
          placeholder="Search by name or symbol..."
          className="bg-black/40 border-arbisent-text/20 text-arbisent-text"
          onChange={(e) => handleFilterChange("search", e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="minPrice" className="text-arbisent-text mb-2">
          Min Price ($)
        </Label>
        <Input
          id="minPrice"
          type="number"
          placeholder="0"
          className="bg-black/40 border-arbisent-text/20 text-arbisent-text"
          onChange={(e) => handleFilterChange("minPrice", e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="maxPrice" className="text-arbisent-text mb-2">
          Max Price ($)
        </Label>
        <Input
          id="maxPrice"
          type="number"
          placeholder="999999"
          className="bg-black/40 border-arbisent-text/20 text-arbisent-text"
          onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="minMarketCap" className="text-arbisent-text mb-2">
          Min Market Cap ($)
        </Label>
        <Input
          id="minMarketCap"
          type="number"
          placeholder="0"
          className="bg-black/40 border-arbisent-text/20 text-arbisent-text"
          onChange={(e) => handleFilterChange("minMarketCap", e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="maxMarketCap" className="text-arbisent-text mb-2">
          Max Market Cap ($)
        </Label>
        <Input
          id="maxMarketCap"
          type="number"
          placeholder="999999999999"
          className="bg-black/40 border-arbisent-text/20 text-arbisent-text"
          onChange={(e) => handleFilterChange("maxMarketCap", e.target.value)}
        />
      </div>
    </div>
  );
};