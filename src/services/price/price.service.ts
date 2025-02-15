import { Asset, AssetType, PriceServiceConfig } from "@/types/price-dashboard";

export abstract class BasePriceService {
  abstract getAssets(types: AssetType[]): Promise<Asset[]>;
  abstract getName(): string;
}

export class PriceService {
  private services: BasePriceService[] = [];
  private cache: Map<string, Asset> = new Map();
  private cacheTimeout = 30000; // 30 seconds

  constructor(private config: Partial<PriceServiceConfig> = {}) {
    // Validate config
    if (!config.coingeckoApiKey) {
      console.warn('CoinGecko API key is missing');
    }
    if (!config.cmcApiKey) {
      console.warn('CoinMarketCap API key is missing');
    }
    if (!config.etherscanApiKey) {
      console.warn('Etherscan API key is missing');
    }
  }

  registerService(service: BasePriceService) {
    this.services.push(service);
  }

  getServiceCount(): number {
    return this.services.length;
  }

  async getAssets(types: AssetType[]): Promise<Asset[]> {
    if (this.services.length === 0) {
      console.warn('No price services registered');
      return [];
    }

    const now = Date.now();
    const promises = this.services.map(service => 
      service.getAssets(types)
        .catch(error => {
          console.error(`Error fetching from ${service.getName()}:`, error);
          return [];
        })
    );
    
    try {
      const results = await Promise.allSettled(promises);
      const assets: Asset[] = [];
      
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          result.value.forEach(asset => {
            const cached = this.cache.get(asset.id);
            if (!cached || (now - cached.lastUpdated.getTime()) > this.cacheTimeout) {
              this.cache.set(asset.id, asset);
              assets.push(asset);
            } else {
              assets.push(cached);
            }
          });
        }
      });

      if (assets.length === 0) {
        console.warn('No assets returned from any service');
      }

      return assets;
    } catch (error) {
      console.error('Critical error in getAssets:', error);
      return Array.from(this.cache.values()); // Return cached data as fallback
    }
  }
} 