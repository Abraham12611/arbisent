import { Asset, AssetType, PriceSource } from "@/types/price-dashboard";
import { BasePriceService } from "./price.service";

export class CoinGeckoService extends BasePriceService {
  private readonly API_URL = "https://api.coingecko.com/api/v3";
  private lastCallTime: number = 0;
  private readonly RATE_LIMIT_DELAY = 2000; // 2 seconds between calls for public API
  private readonly MAX_RETRIES = 3;
  
  constructor(private apiKey: string) {
    super();
    if (!apiKey) {
      throw new Error('CoinGecko API key is required');
    }
  }

  getName(): string {
    return "CoinGecko";
  }

  private async rateLimitedFetch(url: string, retryCount = 0): Promise<Response> {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCallTime;
    
    if (timeSinceLastCall < this.RATE_LIMIT_DELAY) {
      await new Promise(resolve => 
        setTimeout(resolve, this.RATE_LIMIT_DELAY - timeSinceLastCall)
      );
    }
    
    try {
      this.lastCallTime = Date.now();
      const response = await fetch(url, {
        headers: {
          'x-cg-demo-api-key': this.apiKey,
          'Accept': 'application/json'
        }
      });

      // Handle rate limiting
      if (response.status === 429 && retryCount < this.MAX_RETRIES) {
        const retryAfter = parseInt(response.headers.get('retry-after') || '5');
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        return this.rateLimitedFetch(url, retryCount + 1);
      }

      return response;
    } catch (error) {
      if (retryCount < this.MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return this.rateLimitedFetch(url, retryCount + 1);
      }
      throw error;
    }
  }

  async getAssets(types: AssetType[]): Promise<Asset[]> {
    try {
      const response = await this.rateLimitedFetch(
        `${this.API_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&sparkline=false&price_change_percentage=24h&x_cg_demo_api_key=${this.apiKey}`
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch from CoinGecko: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format from CoinGecko');
      }

      return data.map((coin: any) => ({
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol.toUpperCase(),
        type: this.determineAssetType(coin),
        price: coin.current_price || 0,
        priceChange24h: coin.price_change_percentage_24h || 0,
        marketCap: coin.market_cap || 0,
        volume24h: coin.total_volume || 0,
        lastUpdated: new Date(),
        source: PriceSource.COINGECKO
      }));
    } catch (error) {
      console.error("CoinGecko API error:", error);
      throw error; // Propagate error to PriceService for handling
    }
  }

  private determineAssetType(coin: any): AssetType {
    if (!coin.market_cap_rank) return AssetType.MEMECOIN;
    if (coin.market_cap_rank <= 20) return AssetType.CRYPTO;
    if (coin.market_cap_rank <= 100) return AssetType.TOKEN;
    return AssetType.MEMECOIN;
  }
} 