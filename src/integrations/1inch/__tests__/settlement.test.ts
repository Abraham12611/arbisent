import { describe, expect, test, jest, beforeEach } from '@jest/globals';
import { SettlementRulesEngine } from '../settlement';
import { OneinchConfigManager } from '../config';
import { LiquidityAggregator } from '../liquidity';
import { MEVProtectionService } from '../mev';
import { providers, BigNumber } from 'ethers';

// Mock dependencies
jest.mock('../config');
jest.mock('../liquidity');
jest.mock('../mev');

describe('SettlementRulesEngine', () => {
  let settlementEngine: SettlementRulesEngine;
  let mockProvider: jest.Mocked<providers.Provider>;

  beforeEach(() => {
    // Reset singleton instances
    (SettlementRulesEngine as any).instance = null;
    (OneinchConfigManager as any).instance = null;

    // Create mock provider
    mockProvider = {
      getNetwork: jest.fn().mockResolvedValue({ chainId: 1 }),
      getGasPrice: jest.fn().mockResolvedValue(BigNumber.from('50000000000')) // 50 Gwei
    } as unknown as jest.Mocked<providers.Provider>;

    // Mock OneinchConfigManager
    (OneinchConfigManager as any).prototype.getConfig = jest.fn().mockReturnValue({
      apiKey: 'test-api-key',
      supportedNetworks: [1, 137]
    });
    (OneinchConfigManager as any).prototype.getProvider = jest.fn().mockReturnValue(mockProvider);

    // Mock LiquidityAggregator
    (LiquidityAggregator.getInstance as jest.Mock).mockReturnValue({
      initialize: jest.fn().mockResolvedValue(undefined),
      getAggregatedLiquidity: jest.fn().mockResolvedValue({
        pools: [{
          address: '0xpool1',
          token0: '0xtoken1',
          token1: '0xtoken2',
          reserve0: BigNumber.from('10000000000000000000'),
          reserve1: BigNumber.from('20000000000000000000'),
          fee: 300
        }],
        totalLiquidity: BigNumber.from('30000000000000000000'),
        bestPrice: BigNumber.from('2000000000000000000'),
        priceImpact: 0.5,
        estimatedGas: BigNumber.from('150000')
      })
    });

    // Mock MEVProtectionService
    (MEVProtectionService.getInstance as jest.Mock).mockReturnValue({
      initialize: jest.fn().mockResolvedValue(undefined),
      assessMEVRisk: jest.fn().mockResolvedValue({
        riskScore: 50,
        estimatedLoss: BigNumber.from('1000000000000000'),
        recommendedDelay: 2,
        protectionStrategies: ['private-tx'],
        warnings: []
      })
    });

    settlementEngine = SettlementRulesEngine.getInstance();
  });

  test('getInstance returns singleton instance', () => {
    const instance1 = SettlementRulesEngine.getInstance();
    const instance2 = SettlementRulesEngine.getInstance();
    expect(instance1).toBe(instance2);
  });

  test('initialize sets up dependencies and rules', async () => {
    const customRules = {
      maxSlippage: 0.5,
      minLiquidity: BigNumber.from('2000000000000000000')
    };

    await settlementEngine.initialize(customRules);
    
    expect(LiquidityAggregator.getInstance().initialize).toHaveBeenCalled();
    expect(MEVProtectionService.getInstance().initialize).toHaveBeenCalled();
  });

  test('validateSettlement returns comprehensive validation', async () => {
    await settlementEngine.initialize();
    
    const validation = await settlementEngine.validateSettlement(
      1,
      '0xtoken1',
      '0xtoken2',
      BigNumber.from('1000000000000000000'),
      '0xuser'
    );

    expect(validation.isValid).toBeDefined();
    expect(validation.errors).toBeInstanceOf(Array);
    expect(validation.warnings).toBeInstanceOf(Array);
    expect(validation.estimatedGas).toBeDefined();
    expect(validation.expectedSlippage).toBeDefined();
    expect(validation.priceImpact).toBeDefined();
  });

  test('determineSettlementStrategy selects appropriate strategy', async () => {
    await settlementEngine.initialize();
    
    const validation = {
      isValid: true,
      errors: [],
      warnings: ['High MEV risk detected'],
      estimatedGas: BigNumber.from('150000'),
      expectedSlippage: 0.8,
      priceImpact: 1.5
    };

    const strategy = await settlementEngine.determineSettlementStrategy(
      validation,
      BigNumber.from('5000000000000000000')
    );

    expect(strategy.type).toBe('private');
    expect(strategy.params.isPrivate).toBe(true);
  });

  test('handles insufficient liquidity', async () => {
    await settlementEngine.initialize();
    
    // Mock low liquidity
    (LiquidityAggregator.getInstance().getAggregatedLiquidity as jest.Mock)
      .mockResolvedValueOnce({
        totalLiquidity: BigNumber.from('100000000000000000'),
        priceImpact: 0.5,
        estimatedGas: BigNumber.from('150000')
      });

    const validation = await settlementEngine.validateSettlement(
      1,
      '0xtoken1',
      '0xtoken2',
      BigNumber.from('1000000000000000000'),
      '0xuser'
    );

    expect(validation.isValid).toBe(false);
    expect(validation.errors).toContain('Insufficient liquidity for settlement');
  });

  test('handles high MEV risk', async () => {
    await settlementEngine.initialize();
    
    // Mock high MEV risk
    (MEVProtectionService.getInstance().assessMEVRisk as jest.Mock)
      .mockResolvedValueOnce({
        riskScore: 80,
        estimatedLoss: BigNumber.from('2000000000000000'),
        recommendedDelay: 3,
        protectionStrategies: ['private-tx', 'time-delay'],
        warnings: ['High frontrunning risk']
      });

    const validation = await settlementEngine.validateSettlement(
      1,
      '0xtoken1',
      '0xtoken2',
      BigNumber.from('1000000000000000000'),
      '0xuser'
    );

    expect(validation.warnings).toContain('High MEV risk detected');
  });

  test('handles high gas price', async () => {
    await settlementEngine.initialize();
    
    // Mock high gas price
    mockProvider.getGasPrice.mockResolvedValueOnce(
      BigNumber.from('200000000000') // 200 Gwei
    );

    await expect(settlementEngine.executeSettlement(
      1,
      '0xtoken1',
      '0xtoken2',
      BigNumber.from('1000000000000000000'),
      '0xuser',
      { type: 'standard', params: {} }
    )).rejects.toThrow('Gas price too high for settlement');
  });

  test('selects split strategy for high price impact', async () => {
    await settlementEngine.initialize();
    
    const validation = {
      isValid: true,
      errors: [],
      warnings: [],
      estimatedGas: BigNumber.from('150000'),
      expectedSlippage: 0.8,
      priceImpact: 1.2
    };

    const strategy = await settlementEngine.determineSettlementStrategy(
      validation,
      BigNumber.from('1000000000000000000')
    );

    expect(strategy.type).toBe('split');
    expect(strategy.params.parts).toBe(3); // ceil(1.2 * 2)
    expect(strategy.params.interval).toBe(30);
  });

  test('selects batched strategy for large orders', async () => {
    await settlementEngine.initialize();
    
    const validation = {
      isValid: true,
      errors: [],
      warnings: [],
      estimatedGas: BigNumber.from('150000'),
      expectedSlippage: 1.5,
      priceImpact: 2.5
    };

    const strategy = await settlementEngine.determineSettlementStrategy(
      validation,
      BigNumber.from('20000000000000000000') // 20 ETH
    );

    expect(strategy.type).toBe('batched');
    expect(strategy.params.batchSize).toBe(3);
  });
}); 