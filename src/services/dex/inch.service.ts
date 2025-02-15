interface Token {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  logoURI?: string;
}

interface TradingPair {
  symbol: string;  // e.g., "ETH/USDT"
  baseToken: Token;
  quoteToken: Token;
}

export class InchService {
  private static instance: InchService;
  private readonly API_URL = "https://portal.1inch.dev/api/v5.0/1";
  private readonly API_KEY = import.meta.env.VITE_1INCH_API_KEY;
  private readonly CACHE_KEY = "inch_trading_pairs";
  private readonly CACHE_DURATION = 1000 * 60 * 60; // 1 hour
  private cachedPairs: TradingPair[] | null = null;
  private lastFetchTime: number = 0;

  private constructor() {
    if (!this.API_KEY) {
      console.warn('1inch API key not found. Please add VITE_1INCH_API_KEY to your environment variables.');
    }
  }

  static getInstance(): InchService {
    if (!InchService.instance) {
      InchService.instance = new InchService();
    }
    return InchService.instance;
  }

  private async fetchWithAuth(endpoint: string) {
    const response = await fetch(`${this.API_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${this.API_KEY}`,
        'Accept': 'application/json',
      }
    });

    if (response.status === 401) {
      throw new Error('Invalid or missing 1inch API key');
    }

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  async getTradingPairs(): Promise<TradingPair[]> {
    // Check cache first
    if (this.shouldUseCache()) {
      console.log("Using cached trading pairs");
      return this.cachedPairs!;
    }

    try {
      console.log("Fetching trading pairs from 1inch API");
      
      // Fetch tokens
      const tokensData = await this.fetchWithAuth('/tokens');
      const tokens = Object.values(tokensData.tokens) as Token[];

      // Get liquidity sources
      const liquidityData = await this.fetchWithAuth('/liquidity-sources');
      const liquiditySources = liquidityData.protocols;

      // Create trading pairs
      const pairs: TradingPair[] = [];
      const majorStablecoins = tokens.filter(t => 
        ["USDT", "USDC", "DAI"].includes(t.symbol)
      );

      // Add major pairs
      for (const token of tokens) {
        if (token.symbol === "ETH" || token.symbol === "WETH") continue;
        
        // Add ETH pairs
        pairs.push({
          symbol: `${token.symbol}/ETH`,
          baseToken: token,
          quoteToken: tokens.find(t => t.symbol === "WETH")!
        });

        // Add stablecoin pairs
        for (const stablecoin of majorStablecoins) {
          pairs.push({
            symbol: `${token.symbol}/${stablecoin.symbol}`,
            baseToken: token,
            quoteToken: stablecoin
          });
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