import { describe, expect, test, jest, beforeEach } from '@jest/globals';
import { MEVProtectionService } from '../mev';
import { OneinchConfigManager } from '../config';
import { LiquidityAggregator } from '../liquidity';
import { BigNumber } from 'ethers';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock LiquidityAggregator
jest.mock('../liquidity', () => ({
  LiquidityAggregator: {
    getInstance: jest.fn().mockReturnValue({
      initialize: jest.fn().mockResolvedValue(undefined),
      getAggregatedLiquidity: jest.fn().mockResolvedValue({
        pools: [{
          address: '0xpool1',
          token0: '0xtoken1',
          token1: '0xtoken2',
          reserve0: BigNumber.from('10000000000000000000'),
          reserve1: BigNumber.from('20000000000000000000'),
          fee: 300,
          protocol: 'Uniswap V3'
        }],
        totalLiquidity: BigNumber.from('30000000000000000000'),
        bestPrice: BigNumber.from('2000000000000000000'),
        priceImpact: 0.5,
        estimatedGas: BigNumber.from('150000')
      })
    })
  }
}));

describe('MEVProtectionService', () => {
  let mevService: MEVProtectionService;

  beforeEach(() => {
    // Reset singleton instances
    (MEVProtectionService as any).instance = null;
    (OneinchConfigManager as any).instance = null;

    // Mock OneinchConfigManager
    (OneinchConfigManager as any).prototype.getConfig = jest.fn().mockReturnValue({
      apiKey: 'test-api-key',
      supportedNetworks: [1, 137],
      fusionApiUrl: 'https://fusion.1inch.io'
    });
    (OneinchConfigManager as any).prototype.getFusionApiUrl = jest.fn().mockReturnValue('https://fusion.1inch.io/v1.0/1');

    // Mock axios response for protect-transaction
    mockedAxios.post.mockResolvedValue({
      data: {
        protectedTx: '0xprotected',
        estimatedSavings: '1000000000000000',
        strategies: ['private-tx', 'time-delay'],
        bundleHash: '0xbundle'
      }
    });

    mevService = MEVProtectionService.getInstance();
  });

  test('getInstance returns singleton instance', () => {
    const instance1 = MEVProtectionService.getInstance();
    const instance2 = MEVProtectionService.getInstance();
    expect(instance1).toBe(instance2);
  });

  test('initialize sets up service with custom config', async () => {
    const customConfig = {
      maxPriceImpact: 0.5,
      maxGasMultiplier: 2,
      minBlockDelay: 2,
      maxBlockDelay: 5
    };

    await mevService.initialize(customConfig);
    expect((mevService as any).protectionConfig).toEqual(customConfig);
  });

  test('assessMEVRisk returns comprehensive risk assessment', async () => {
    await mevService.initialize();
    
    const assessment = await mevService.assessMEVRisk(
      1,
      '0xtoken1',
      '0xtoken2',
      BigNumber.from('1000000000000000000')
    );

    expect(assessment.riskScore).toBeDefined();
    expect(assessment.estimatedLoss).toBeDefined();
    expect(assessment.recommendedDelay).toBeDefined();
    expect(Array.isArray(assessment.protectionStrategies)).toBe(true);
    expect(Array.isArray(assessment.warnings)).toBe(true);
  });

  test('protectTransaction returns protected transaction data', async () => {
    await mevService.initialize();
    
    const assessment = {
      riskScore: 75,
      estimatedLoss: BigNumber.from('1000000000000000'),
      recommendedDelay: 2,
      protectionStrategies: ['private-tx', 'time-delay'],
      warnings: ['High risk of frontrunning']
    };

    const result = await mevService.protectTransaction(
      1,
      '0xrawtx',
      assessment
    );

    expect(result.originalTx).toBe('0xrawtx');
    expect(result.protectedTx).toBe('0xprotected');
    expect(result.estimatedSavings).toEqual(BigNumber.from('1000000000000000'));
    expect(result.appliedStrategies).toEqual(['private-tx', 'time-delay']);
    expect(result.bundleHash).toBe('0xbundle');
  });

  test('handles high risk transactions with appropriate strategies', async () => {
    await mevService.initialize();
    
    // Mock high-risk scenario
    (LiquidityAggregator.getInstance().getAggregatedLiquidity as jest.Mock).mockResolvedValueOnce({
      pools: [{ /* single pool */ }],
      totalLiquidity: BigNumber.from('10000000000000000000'),
      bestPrice: BigNumber.from('2000000000000000000'),
      priceImpact: 2.5,
      estimatedGas: BigNumber.from('150000')
    });

    const assessment = await mevService.assessMEVRisk(
      1,
      '0xtoken1',
      '0xtoken2',
      BigNumber.from('5000000000000000000') // 50% of liquidity
    );

    expect(assessment.riskScore).toBeGreaterThan(70);
    expect(assessment.protectionStrategies).toContain('bundle-submission');
    expect(assessment.warnings).toContain('High price impact detected');
  });

  test('calculates appropriate block delay based on risk', async () => {
    await mevService.initialize();
    
    const lowRiskAssessment = await mevService.assessMEVRisk(
      1,
      '0xtoken1',
      '0xtoken2',
      BigNumber.from('100000000000000000') // Small amount
    );

    const highRiskAssessment = await mevService.assessMEVRisk(
      1,
      '0xtoken1',
      '0xtoken2',
      BigNumber.from('5000000000000000000') // Large amount
    );

    expect(lowRiskAssessment.recommendedDelay).toBeLessThan(highRiskAssessment.recommendedDelay);
  });

  test('handles API errors gracefully', async () => {
    await mevService.initialize();
    
    mockedAxios.post.mockRejectedValueOnce(new Error('API Error'));

    const assessment = {
      riskScore: 75,
      estimatedLoss: BigNumber.from('1000000000000000'),
      recommendedDelay: 2,
      protectionStrategies: ['private-tx'],
      warnings: []
    };

    await expect(mevService.protectTransaction(1, '0xrawtx', assessment))
      .rejects.toThrow('API Error');
  });

  test('updates protection strategies based on risk score', async () => {
    const strategies = (mevService as any).determineProtectionStrategies(95);
    expect(strategies).toContain('private-tx');
    expect(strategies).toContain('time-delay');
    expect(strategies).toContain('bundle-submission');
    expect(strategies).toContain('flashbots');
  });
}); 