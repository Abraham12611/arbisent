import { describe, expect, test, beforeAll, jest } from '@jest/globals';
import axios from 'axios';
import DataCollectionAgent from '../dataCollection';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('DataCollectionAgent', () => {
  let agent: DataCollectionAgent;

  beforeAll(() => {
    agent = new DataCollectionAgent({
      apiKey: 'test_api_key',
      baseUrl: 'https://api.cookie.fun'
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should fetch and normalize data successfully', async () => {
    // Mock historical data
    mockedAxios.get.mockImplementation((url) => {
      if (url.includes('historical-patterns')) {
        return Promise.resolve({
          data: {
            data: Array(168).fill(null).map((_, i) => ({
              timestamp: Date.now() - i * 3600000,
              price: 100 + Math.random() * 10,
              volume: 1000000 + Math.random() * 500000,
              marketCap: 1000000000
            }))
          }
        });
      }
      // Mock sentiment data
      return Promise.resolve({
        data: {
          data: {
            timestamp: Date.now(),
            overall: 'positive',
            confidence: 0.85,
            sources: {
              twitter: 1200,
              reddit: 800,
              telegram: 500
            },
            volume: 'high'
          }
        }
      });
    });

    const result = await agent.process({
      marketData: {
        asset: 'SOL/USDC'
      }
    });

    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('historical');
    expect(result.data).toHaveProperty('sentiment');
    expect(result.data.historical.metrics).toHaveProperty('volatility');
    expect(result.data.sentiment.analysis).toHaveProperty('strength');
  });

  test('should handle API errors gracefully', async () => {
    mockedAxios.get.mockRejectedValue(new Error('API Error'));

    const result = await agent.process({
      marketData: {
        asset: 'SOL/USDC'
      }
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
}); 