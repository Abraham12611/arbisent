import { Asset, AssetType, PriceSource } from "@/types/price-dashboard";
import { BasePriceService } from "./price.service";

export class CoinGeckoService extends BasePriceService {
  private readonly API_URL = "https://api.coingecko.com/api/v3";
  
  constructor(private apiKey: string) {
    super();
  }

  getName(): string {
    return "CoinGecko";
  }

  async getAssets(types: AssetType[]): Promise<Asset[]> {
    try {
      const response = await fetch(
        `${this.API_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&sparkline=false&x_cg_demo_api_key=${this.apiKey}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch from CoinGecko");
      }

      const data = await response.json();
      return data.map((coin: any) => ({
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol.toUpperCase(),
        type: this.determineAssetType(coin),
        price: coin.current_price,
        priceChange24h: coin.price_change_percentage_24h,
        marketCap: coin.market_cap,
        volume24h: coin.total_volume,
        lastUpdated: new Date(),
        source: PriceSource.COINGECKO
      }));
    } catch (error) {
      console.error("CoinGecko API error:", error);
      return [];
    }
  }

  private determineAssetType(coin: any): AssetType {
    // Simple logic - can be enhanced based on actual requirements
    if (coin.market_cap_rank <= 20) return AssetType.CRYPTO;
    if (coin.market_cap_rank <= 100) return AssetType.TOKEN;
    return AssetType.MEMECOIN;
  }
} 