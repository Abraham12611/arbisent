import { Asset, AssetType, PriceSource } from "@/types/price-dashboard";
import { BasePriceService } from "./price.service";

export class CoinGeckoService extends BasePriceService {
  private readonly API_URL = "https://api.coingecko.com/api/v3";
  private lastCallTime: number = 0;
  private readonly RATE_LIMIT_DELAY = 10000; // 10 seconds between calls for public API
  private readonly MAX_RETRIES = 3;
  
  constructor(private apiKey: string) {
    super();
    if (!apiKey) {
      throw new Error('CoinGecko API key is required');
    }
    console.log('CoinGecko service initialized with API key:', apiKey.substring(0, 5) + '...');
  }

  getName(): string {
    return "CoinGecko";
  }

  private async rateLimitedFetch(url: string, retryCount = 0): Promise<Response> {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCallTime;
    
    if (timeSinceLastCall < this.RATE_LIMIT_DELAY) {
      const waitTime = this.RATE_LIMIT_DELAY - timeSinceLastCall;
      console.log(`Rate limiting: waiting ${waitTime}ms before next call`);
      await new Promise(resolve => 
        setTimeout(resolve, waitTime)
      );
    }
    
    try {
      console.log(`Making CoinGecko API call (attempt ${retryCount + 1}/${this.MAX_RETRIES + 1})`);
      this.lastCallTime = Date.now();

      // First try without API key (public API)
      let response = await fetch(`${url}`);
      
      // If we get rate limited, try with API key
      if (response.status === 429) {
        console.log('Rate limited on public API, retrying with API key...');
        response = await fetch(`${url}${url.includes('?') ? '&' : '?'}x_cg_demo_api_key=${this.apiKey}`, {
          headers: {
            'x-cg-demo-api-key': this.apiKey
          }
        });
      }

      console.log('CoinGecko API response status:', response.status);

      // Handle rate limiting with API key
      if (response.status === 429 && retryCount < this.MAX_RETRIES) {
        const retryAfter = parseInt(response.headers.get('retry-after') || '10');
        console.log(`Still rate limited. Retrying after ${retryAfter} seconds`);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        return this.rateLimitedFetch(url, retryCount + 1);
      }

      return response;
    } catch (error) {
      console.error('CoinGecko API fetch error:', error);
      if (retryCount < this.MAX_RETRIES) {
        console.log('Retrying after error...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        return this.rateLimitedFetch(url, retryCount + 1);
      }
      throw error;
    }
  }

  async getAssets(types: AssetType[]): Promise<Asset[]> {
    try {
      console.log('Fetching assets from CoinGecko...');
      const response = await this.rateLimitedFetch(
        `${this.API_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&sparkline=false&price_change_percentage=24h`
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('CoinGecko API error response:', errorText);
        throw new Error(`Failed to fetch from CoinGecko: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`Successfully fetched ${data.length} assets from CoinGecko`);
      
      if (!Array.isArray(data)) {
        console.error('Invalid response format:', data);
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