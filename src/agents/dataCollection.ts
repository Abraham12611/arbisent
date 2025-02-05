import { BaseAgent } from "@langchain/core";
import axios from "axios";
import { AgentInput, AgentOutput } from "../types/agent";

interface CookieDataSwarmConfig {
  apiKey: string;
  baseUrl: string;
}

interface HistoricalData {
  timestamp: number;
  price: number;
  volume: number;
  marketCap: number;
}

interface SentimentData {
  timestamp: number;
  overall: 'positive' | 'negative' | 'neutral';
  confidence: number;
  sources: {
    twitter: number;
    reddit: number;
    telegram: number;
  };
  volume: 'high' | 'medium' | 'low';
}

class DataCollectionAgent extends BaseAgent {
  private config: CookieDataSwarmConfig;

  constructor(config: CookieDataSwarmConfig) {
    super();
    this.config = config;
  }

  async process(input: AgentInput): Promise<AgentOutput> {
    try {
      // Fetch data in parallel
      const [historicalData, sentimentData] = await Promise.all([
        this.fetchHistoricalPatterns(input.marketData?.asset),
        this.fetchSocialAnalytics(input.marketData?.asset)
      ]);

      // Normalize and validate data
      const normalizedData = this.normalizeData(historicalData, sentimentData);

      return {
        success: true,
        data: normalizedData,
        timestamp: Date.now()
      };
    } catch (error: any) {
      console.error('Data collection failed:', error);
      return {
        success: false,
        error: error?.message || 'Unknown error occurred',
        timestamp: Date.now()
      };
    }
  }

  private async fetchHistoricalPatterns(asset: string): Promise<HistoricalData[]> {
    try {
      const response = await axios.get(
        `${this.config.baseUrl}/v1/historical-patterns`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          params: {
            asset,
            interval: '1h',
            limit: 168 // Last 7 days hourly data
          }
        }
      );

      return response.data.data;
    } catch (error: any) {
      throw new Error(`Historical patterns fetch failed: ${error?.message}`);
    }
  }

  private async fetchSocialAnalytics(asset: string): Promise<SentimentData> {
    try {
      const response = await axios.get(
        `${this.config.baseUrl}/v1/social-analytics`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          params: {
            asset,
            timeframe: '24h'
          }
        }
      );

      return response.data.data;
    } catch (error: any) {
      throw new Error(`Social analytics fetch failed: ${error?.message}`);
    }
  }

  private normalizeData(
    historical: HistoricalData[],
    sentiment: SentimentData
  ) {
    // Calculate key metrics
    const recentPrices = historical.slice(-24); // Last 24 hours
    const priceVolatility = this.calculateVolatility(recentPrices);
    const volumeTrend = this.calculateVolumeTrend(recentPrices);

    return {
      historical: {
        data: historical,
        metrics: {
          volatility: priceVolatility,
          volumeTrend,
          lastPrice: historical[historical.length - 1].price
        }
      },
      sentiment: {
        current: sentiment,
        analysis: {
          strength: sentiment.confidence > 0.7 ? 'strong' : 'weak',
          volumeQuality: this.analyzeSentimentVolume(sentiment)
        }
      }
    };
  }

  private calculateVolatility(prices: HistoricalData[]): number {
    const returns = prices.slice(1).map((p, i) => {
      return (p.price - prices[i].price) / prices[i].price;
    });
    
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance);
  }

  private calculateVolumeTrend(data: HistoricalData[]): 'increasing' | 'decreasing' | 'stable' {
    const volumes = data.map(d => d.volume);
    const trend = volumes.slice(1).reduce((acc, vol, i) => acc + (vol - volumes[i]), 0);
    
    if (trend > 0) return 'increasing';
    if (trend < 0) return 'decreasing';
    return 'stable';
  }

  private analyzeSentimentVolume(sentiment: SentimentData): 'reliable' | 'unreliable' {
    const totalSources = Object.values(sentiment.sources).reduce((a, b) => a + b, 0);
    return totalSources > 1000 ? 'reliable' : 'unreliable';
  }
}

export default DataCollectionAgent; 