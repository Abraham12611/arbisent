import { describe, expect, test, jest, beforeEach } from '@jest/globals';
import { LiquidityAggregator } from '../liquidity';
import { OneinchConfigManager } from '../config';
import { BigNumber } from 'ethers';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('LiquidityAggregator', () => {
  let aggregator: LiquidityAggregator;

  beforeEach(() => {
    // Reset singleton instances
    (LiquidityAggregator as any).instance = null;
    (OneinchConfigManager as any).instance = null;

    // Mock OneinchConfigManager
    (OneinchConfigManager as any).prototype.getConfig = jest.fn().mockReturnValue({
      apiKey: 'test-api-key',
      supportedNetworks: [1, 137],
      fusionApiUrl: 'https://fusion.1inch.io'
    });
    (OneinchConfigManager as any).prototype.getFusionApiUrl = jest.fn().mockReturnValue('https://fusion.1inch.io/v1.0/1');

    // Mock axios responses
    mockedAxios.get.mockImplementation((url) => {
      if (url.includes('/liquidity-sources')) {
        return Promise.resolve({
          data: {
            protocols: [{
              name: 'Uniswap V3',
              address: '0x1234',
              tokens: ['0xtoken1', '0xtoken2'],
              liquidity: '1000000000000000000',
              volume24h: '5000000000000000000'
            }]
          }
        });
      } else if (url.includes('/quote')) {
        return Promise.resolve({
          data: {
            fromTokenAmount: '1000000000000000000',
            toTokenAmount: '2000000000000000000',
            estimatedPriceImpact: 0.5,
            protocols: [['Uniswap V3', 'Sushiswap']],
            estimatedGas: '150000'
          }
        });
      } else if (url.includes('/pools')) {
        return Promise.resolve({
          data: {
            pools: [{
              address: '0xpool1',
              token0: '0xtoken1',
              token1: '0xtoken2',
              reserve0: '10000000000000000000',
              reserve1: '20000000000000000000',
              fee: 300,
              protocol: 'Uniswap V3'
            }]
          }
        });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });

    aggregator = LiquidityAggregator.getInstance();
  });

  test('getInstance returns singleton instance', () => {
    const instance1 = LiquidityAggregator.getInstance();
    const instance2 = LiquidityAggregator.getInstance();
    expect(instance1).toBe(instance2);
  });

  test('initialize sets up liquidity sources', async () => {
    await aggregator.initialize();
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://fusion.1inch.io/v1.0/1/liquidity-sources',
      expect.any(Object)
    );
  });

  test('getQuote returns formatted quote', async () => {
    await aggregator.initialize();
    
    const quote = await aggregator.getQuote(
      1,
      '0xtoken1',
      '0xtoken2',
      BigNumber.from('1000000000000000000')
    );

    expect(quote.sourceToken).toBe('0xtoken1');
    expect(quote.targetToken).toBe('0xtoken2');
    expect(quote.sourceAmount).toEqual(BigNumber.from('1000000000000000000'));
    expect(quote.targetAmount).toEqual(BigNumber.from('2000000000000000000'));
    expect(quote.priceImpact).toBe(0.5);
    expect(quote.protocols).toEqual(['Uniswap V3', 'Sushiswap']);
    expect(quote.estimatedGas).toEqual(BigNumber.from('150000'));
  });

  test('getAggregatedLiquidity returns pool data', async () => {
    await aggregator.initialize();
    
    const liquidity = await aggregator.getAggregatedLiquidity(
      1,
      '0xtoken1',
      '0xtoken2'
    );

    expect(liquidity.pools).toHaveLength(1);
    expect(liquidity.totalLiquidity).toBeDefined();
    expect(liquidity.bestPrice).toBeDefined();
    expect(liquidity.priceImpact).toBe(0.5);
    expect(liquidity.estimatedGas).toEqual(BigNumber.from('150000'));
  });

  test('handles API errors gracefully', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('API Error'));
    
    await expect(aggregator.getQuote(
      1,
      '0xtoken1',
      '0xtoken2',
      BigNumber.from('1000000000000000000')
    )).rejects.toThrow('API Error');
  });

  test('updates liquidity sources periodically', async () => {
    jest.useFakeTimers();
    await aggregator.initialize();
    
    // Fast-forward 5 minutes
    jest.advanceTimersByTime(5 * 60 * 1000);
    
    expect(mockedAxios.get).toHaveBeenCalledTimes(4); // Initial calls + periodic update
    
    jest.useRealTimers();
  });

  test('caches and returns liquidity sources', async () => {
    await aggregator.initialize();
    
    // Second call should use cached data
    await (aggregator as any).getLiquiditySources(1);
    expect(mockedAxios.get).toHaveBeenCalledTimes(2); // Only initial calls
  });

  test('finds relevant pools for token pair', async () => {
    await aggregator.initialize();
    
    const pools = await (aggregator as any).findRelevantPools(
      1,
      '0xtoken1',
      '0xtoken2'
    );

    expect(pools).toHaveLength(1);
    expect(pools[0].address).toBe('0xpool1');
    expect(pools[0].token0).toBe('0xtoken1');
    expect(pools[0].token1).toBe('0xtoken2');
  });
}); 