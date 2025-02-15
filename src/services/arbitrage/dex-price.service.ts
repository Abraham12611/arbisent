import { PriceService } from "../price/price.service";
import { CoinGeckoService } from "../price/coingecko.service";

interface DEXPrice {
  dex: string;
  price: number;
  liquidity: number;
}

export class DexPriceService {
  private readonly UNISWAP_V3_ENDPOINT = "https://api.uniswap.org/v2";
  private readonly SUSHISWAP_ENDPOINT = "https://api.sushi.com/v0";
  private readonly CACHE_DURATION = 30000; // 30 seconds
  private priceCache: Map<string, { prices: DEXPrice[], timestamp: number }> = new Map();
  private priceService: PriceService;

  constructor() {
    this.priceService = new PriceService();
    const coingeckoApiKey = import.meta.env.VITE_COINGECKO_API_KEY;
    this.priceService.registerService(new CoinGeckoService(coingeckoApiKey));
  }

  async getPrices(pair: string): Promise<DEXPrice[]> {
    // Check cache first
    const cached = this.priceCache.get(pair);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.prices;
    }

    try {
      const [baseToken, quoteToken] = pair.split('/');
      const prices: DEXPrice[] = [];

      // Fetch base price from CoinGecko for reference
      const assets = await this.priceService.getAssets(['CRYPTO', 'TOKEN']);
      const baseAsset = assets.find(a => a.symbol === baseToken);
      if (!baseAsset) throw new Error(`Base token ${baseToken} not found`);

      const basePrice = baseAsset.price;

      // Simulate different DEX prices with realistic variations
      const dexes = ['Uniswap V3', 'SushiSwap', 'PancakeSwap', 'Curve'];
      dexes.forEach(dex => {
        // Add realistic price variation (-0.5% to +0.5%)
        const variation = (Math.random() - 0.5) * 0.01;
        const price = basePrice * (1 + variation);
        
        // Simulate liquidity based on market cap
        const liquidity = baseAsset.marketCap * (0.001 + Math.random() * 0.002);

        prices.push({ dex, price, liquidity });
      });

      // Cache results
      this.priceCache.set(pair, { prices, timestamp: Date.now() });
      return prices;
    } catch (error) {
      console.error('Error fetching DEX prices:', error);
      throw error;
    }
  }

  clearCache() {
    this.priceCache.clear();
  }
} 