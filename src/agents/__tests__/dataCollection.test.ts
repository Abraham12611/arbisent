import { jest } from '@jest/globals';
import axios from 'axios';
import DataCollectionAgent from '../dataCollection';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

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
    mockedAxios.get.mockImplementation(async (url: string) => {
      if (url.includes('historical-patterns')) {
        return {
          data: {
            data: [
              {
                timestamp: 1234567890,
                price: 100,
                volume: 1000,
                marketCap: 1000000
              }
            ]
          }
        };
      }
      if (url.includes('social-analytics')) {
        return {
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