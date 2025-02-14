import { Asset, AssetType, PriceServiceConfig } from "@/types/price-dashboard";

export abstract class BasePriceService {
  abstract getAssets(types: AssetType[]): Promise<Asset[]>;
  abstract getName(): string;
}

export class PriceService {
  private services: BasePriceService[] = [];
  private cache: Map<string, Asset> = new Map();
  private cacheTimeout = 30000; // 30 seconds

  constructor(private config: PriceServiceConfig) {}

  registerService(service: BasePriceService) {
    this.services.push(service);
  }

  async getAssets(types: AssetType[]): Promise<Asset[]> {
    const now = Date.now();
    const promises = this.services.map(service => service.getAssets(types));
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

    return assets;
  }
} 