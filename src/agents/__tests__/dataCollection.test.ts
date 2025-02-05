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
        const response: ApiResponse<HistoricalDataPoint[]> = {
          data: {
            data: [{
              timestamp: 1234567890,
              price: 100,
              volume: 1000,
              marketCap: 1000000
            }]
          }
        };
        return {
          data: response,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: { url } as any
        };
      }
      if (url.includes('social-analytics')) {
        const response: ApiResponse<SentimentDataPoint> = {
          data: {
            data: {
              timestamp: 1234567890,
              overall: 'positive',
              confidence: 0.8,
              sources: {
                twitter: 500,
                reddit: 300,
                telegram: 200
              },
              volume: 'high'
            }
          }
        };
        return {
          data: response,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: { url } as any
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