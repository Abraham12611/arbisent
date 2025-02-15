import { describe, expect, test } from '@jest/globals';
import { DataCollectionAgent } from '../dataCollection';

describe('DataCollectionAgent', () => {
  let agent: DataCollectionAgent;

  beforeEach(() => {
    agent = new DataCollectionAgent({ apiKey: 'test-key' });
  });

  test('fetchMarketData returns market data', async () => {
    const data = await agent.fetchMarketData('SOL');
    expect(data).toHaveProperty('asset', 'SOL');
    expect(data).toHaveProperty('price');
    expect(data).toHaveProperty('volume');
    expect(data).toHaveProperty('timestamp');
  });

  test('fetchSentimentData returns sentiment data', async () => {
    const data = await agent.fetchSentimentData('SOL');
    expect(data).toHaveProperty('overall');
    expect(data).toHaveProperty('confidence');
    expect(data).toHaveProperty('source');
    expect(data).toHaveProperty('timestamp');
  });
});