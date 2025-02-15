import { describe, expect, test, beforeAll, jest } from '@jest/globals';
import ArbiSentOrchestrator from '../orchestrator';

describe('ArbiSentOrchestrator', () => {
  let orchestrator: ArbiSentOrchestrator;

  beforeAll(() => {
    orchestrator = new ArbiSentOrchestrator();
  });

  test('should execute complete workflow successfully', async () => {
    const input = {
      urls: [
        'https://example.com/trading-strategy',
        'https://example.com/market-analysis'
      ],
      marketData: {
        asset: 'SOL/USDC',
        price: 100,
        volume: 1000000,
        timestamp: Date.now()
      },
      sentiment: {
        overall: 'positive',
        confidence: 0.8
      },
      parameters: {
        side: 'buy',
        asset: 'So11111111111111111111111111111111111111112',
        amount: 1,
        price: 100,
        slippage: 0.5,
        dex: 'Orca'
      }
    };

    const result = await orchestrator.run(input);

    expect(result.status).toBe('completed');
    expect(result.data).toHaveProperty('research');
    expect(result.data).toHaveProperty('strategy');
    expect(result.data).toHaveProperty('execution');
  }, 120000);

  test('should handle research failure gracefully', async () => {
    const input = {
      urls: ['invalid-url'],
      marketData: {},
      sentiment: {},
      parameters: {}
    };

    const result = await orchestrator.run(input);

    expect(result.status).toBe('failed');
    expect(result.data).toBeDefined();
  }, 60000);
}); 