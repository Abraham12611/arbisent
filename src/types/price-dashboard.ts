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

export enum AssetType {
  CRYPTO = 'CRYPTO',
  TOKEN = 'TOKEN',
  MEMECOIN = 'MEMECOIN'
}

export enum PriceSource {
  COINGECKO = 'COINGECKO',
  CMC = 'CMC',
  DEX = 'DEX'
}

export interface Asset {
  id: string;
  name: string;
  symbol: string;
  type: AssetType;
  price: number;
  priceChange24h: number;
  marketCap: number;
  volume24h: number;
  lastUpdated: Date;
  source: PriceSource;
}

export interface PriceServiceConfig {
  coingeckoApiKey?: string;
  cmcApiKey?: string;
  etherscanApiKey?: string;
  bscscanApiKey?: string;
}