export interface PriceFilter {
  search: string;
  minPrice: string;
  maxPrice: string;
  minMarketCap: string;
  maxMarketCap: string;
}

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}