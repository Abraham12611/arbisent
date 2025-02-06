import { jest } from '@jest/globals';
import axios, { AxiosResponse, AxiosRequestConfig } from 'axios';
import DataCollectionAgent from '../dataCollection';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Define response types
interface HistoricalDataPoint {
  timestamp: number;
  price: number;
  volume: number;
  marketCap: number;
}

interface SentimentDataPoint {
  timestamp: number;
  overall: string;
  confidence: number;
  sources: {
    twitter: number;
    reddit: number;
    telegram: number;
  };
  volume: string;
}

type ApiResponse<T> = {
  data: {
    data: T;
  };
};

describe('DataCollectionAgent', () => {
  let agent: DataCollectionAgent;

  beforeEach(() => {
    agent = new DataCollectionAgent({
      apiKey: 'test-api-key',
      baseUrl: 'https://api.dataswarm.com'
    });

    // Reset mocks
    mockedAxios.get.mockReset();
  });

  it('should successfully collect and normalize data', async () => {
    // Mock API responses
    (mockedAxios.get as jest.Mock).mockImplementation(async (url: string) => {
      if (url.includes('historical-patterns')) {
        return {
          data: {
            data: [{
              timestamp: '2024-02-01T00:00:00Z',
              price: '100.50',
              volume: '1000000',
              market_cap: '10000000000',
              volatility: '0.15',
              trend: 'bullish'
            }],
            meta: {
              asset: 'BTC',
              interval: '1h',
              count: 1
            }
          }
        };
      }
      if (url.includes('social-analytics')) {
        return {
          data: {
            data: {
              timestamp: '2024-02-01T00:00:00Z',
              sentiment: {
                overall: 'positive',
                confidence: '0.85'
              },
              sources: {
                twitter: { count: '500', sentiment: 'positive' },
                reddit: { count: '300', sentiment: 'neutral' },
                telegram: { count: '200', sentiment: 'positive' }
              },
              volume_classification: 'high',
              sentiment_momentum: '0.2',
              social_dominance: '0.15',
              engagement_rate: '0.08'
            }
          }
        };
      }
      throw new Error('Unknown endpoint');
    });

    const result = await agent.process({
      marketData: {
        asset: 'BTC'
      }
    });

    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('historical');
    expect(result.data).toHaveProperty('sentiment');
    expect(result.data.historical.metrics).toHaveProperty('volatility');
    expect(result.data.sentiment.analysis).toHaveProperty('strength');
  });

  it('should handle API errors gracefully', async () => {
    mockedAxios.get.mockRejectedValue(new Error('API Error'));

    const result = await agent.process({
      marketData: {
        asset: 'BTC'
      }
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
}); 