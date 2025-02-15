import { PriceSource } from "@/types/price-dashboard";

interface Token {
  symbol: string;
  name: string;
  id: string;
}

interface TradingPair {
  symbol: string;  // e.g., "ETH/USDT"
  baseToken: Token;
  quoteToken: Token;
}

export class CoinGeckoTradingService {
  private static instance: CoinGeckoTradingService;
  private readonly API_URL = "https://api.coingecko.com/api/v3";
  private readonly API_KEY = import.meta.env.VITE_COINGECKO_API_KEY;
  private readonly CACHE_KEY = "coingecko_trading_pairs";
  private readonly CACHE_DURATION = 1000 * 60 * 60; // 1 hour
  private cachedPairs: TradingPair[] | null = null;
  private lastFetchTime: number = 0;
  private readonly RATE_LIMIT_DELAY = 10000; // 10 seconds between calls for public API

  private constructor() {
    if (!this.API_KEY) {
      console.warn('CoinGecko API key not found. Using public API with rate limiting.');
    }
  }

  static getInstance(): CoinGeckoTradingService {
    if (!CoinGeckoTradingService.instance) {
      CoinGeckoTradingService.instance = new CoinGeckoTradingService();
    }
    return CoinGeckoTradingService.instance;
  }

  private async rateLimitedFetch(url: string): Promise<Response> {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastFetchTime;
    
    if (timeSinceLastCall < this.RATE_LIMIT_DELAY) {
      const waitTime = this.RATE_LIMIT_DELAY - timeSinceLastCall;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastFetchTime = Date.now();
    const apiUrl = this.API_KEY 
      ? `${url}${url.includes('?') ? '&' : '?'}x_cg_demo_api_key=${this.API_KEY}`
      : url;

    const response = await fetch(apiUrl, {
      headers: this.API_KEY ? { 'x-cg-demo-api-key': this.API_KEY } : {}
    });

    return response;
  }

  async getTradingPairs(): Promise<TradingPair[]> {
    // Check cache first
    if (this.shouldUseCache()) {
      console.log("Using cached trading pairs");
      return this.cachedPairs!;
    }

    try {
      console.log("Fetching trading pairs from CoinGecko");
      
      // Fetch top coins by market cap
      const response = await this.rateLimitedFetch(
        `${this.API_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&sparkline=false`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch from CoinGecko: ${response.status}`);
      }

      const coins = await response.json();
      
      // Create trading pairs
      const pairs: TradingPair[] = [];
      const stablecoins = ["USDT", "USDC", "DAI", "BUSD"];
      
      // Add pairs with stablecoins
      for (const coin of coins) {
        const baseToken = {
          symbol: coin.symbol.toUpperCase(),
          name: coin.name,
          id: coin.id
        };

        // Skip if the coin is a stablecoin
        if (stablecoins.includes(baseToken.symbol)) continue;

        // Add pairs with major stablecoins
        for (const stablecoin of stablecoins) {
          pairs.push({
            symbol: `${baseToken.symbol}/${stablecoin}`,
            baseToken,
            quoteToken: {
              symbol: stablecoin,
              name: stablecoin,
              id: stablecoin.toLowerCase()
            }
          });
        }

        // Add pairs with ETH and BTC for major coins
        if (coin.market_cap_rank <= 20) {
          if (baseToken.symbol !== "BTC") {
            pairs.push({
              symbol: `${baseToken.symbol}/BTC`,
              baseToken,
              quoteToken: {
                symbol: "BTC",
                name: "Bitcoin",
                id: "bitcoin"
              }
            });
          }
          
          if (baseToken.symbol !== "ETH") {
            pairs.push({
              symbol: `${baseToken.symbol}/ETH`,
              baseToken,
              quoteToken: {
                symbol: "ETH",
                name: "Ethereum",
                id: "ethereum"
              }
            });
          }
        }
      }

      // Cache the results
      this.cachedPairs = pairs;
      this.lastFetchTime = Date.now();
      localStorage.setItem(this.CACHE_KEY, JSON.stringify({
        pairs,
        timestamp: this.lastFetchTime
      }));

      return pairs;
    } catch (error) {
      console.error("Error fetching trading pairs:", error);
      
      // Try to use cached data even if expired
      const cachedData = localStorage.getItem(this.CACHE_KEY);
      if (cachedData) {
        const { pairs } = JSON.parse(cachedData);
        this.cachedPairs = pairs;
        return pairs;
      }
      
      throw error;
    }
  }

  private shouldUseCache(): boolean {
    if (!this.cachedPairs) {
      const cachedData = localStorage.getItem(this.CACHE_KEY);
      if (cachedData) {
        const { pairs, timestamp } = JSON.parse(cachedData);
        this.cachedPairs = pairs;
        this.lastFetchTime = timestamp;
      }
    }

    return !!(
      this.cachedPairs &&
      Date.now() - this.lastFetchTime < this.CACHE_DURATION
    );
  }

  // Helper method to check if a pair is supported
  async isPairSupported(baseSymbol: string, quoteSymbol: string): Promise<boolean> {
    const pairs = await this.getTradingPairs();
    return pairs.some(pair => pair.symbol === `${baseSymbol}/${quoteSymbol}`);
  }

  // Get token details by symbol
  async getTokenBySymbol(symbol: string): Promise<Token | null> {
    const pairs = await this.getTradingPairs();
    const pair = pairs.find(p => 
      p.baseToken.symbol === symbol || p.quoteToken.symbol === symbol
    );
    if (!pair) return null;
    return pair.baseToken.symbol === symbol ? pair.baseToken : pair.quoteToken;
  }
} 