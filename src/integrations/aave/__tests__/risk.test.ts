import { describe, expect, test, jest, beforeEach } from '@jest/globals';
import { RiskAssessmentService } from '../risk';
import { AaveConfigManager } from '../config';
import { CollateralManager } from '../collateral';
import { Pool } from '@aave/contract-helpers';
import { providers, BigNumber } from 'ethers';

// Mock the Pool class
jest.mock('@aave/contract-helpers', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    getReserveData: jest.fn().mockResolvedValue({
      availableLiquidity: '10000000000000000000', // 10 tokens
      totalStableDebt: '2000000000000000000',     // 2 tokens
      totalVariableDebt: '3000000000000000000',   // 3 tokens
      priceInEth: BigNumber.from('2000000000000000000')
    })
  }))
}));

// Mock the CollateralManager
jest.mock('../collateral', () => ({
  CollateralManager: {
    getInstance: jest.fn().mockReturnValue({
      initialize: jest.fn().mockResolvedValue(undefined),
      getUserCollateral: jest.fn().mockResolvedValue([{
        asset: {
          tokenAddress: '0x1234',
          symbol: 'TEST',
          decimals: 18,
          ltv: 8000,
          liquidationThreshold: 8500,
          liquidationPenalty: 500,
          supplyAPY: '50000000000000000',
          isActive: true
        },
        amount: BigNumber.from('1000000000000000000'),
        amountUSD: BigNumber.from('2000000000000000000'),
        healthFactor: BigNumber.from('1500000000000000000'),
        isCollateral: true
      }])
    })
  }
}));

describe('RiskAssessmentService', () => {
  let riskService: RiskAssessmentService;
  let mockProvider: jest.Mocked<providers.Provider>;

  beforeEach(() => {
    // Reset singleton instances
    (RiskAssessmentService as any).instance = null;
    (AaveConfigManager as any).instance = null;

    // Create mock provider
    mockProvider = {
      getNetwork: jest.fn().mockResolvedValue({ chainId: 1 }),
      getGasPrice: jest.fn().mockResolvedValue(BigNumber.from('20000000000'))
    } as unknown as jest.Mocked<providers.Provider>;

    // Mock AaveConfigManager
    (AaveConfigManager as any).prototype.getConfig = jest.fn().mockReturnValue({
      supportedNetworks: [1, 137]
    });
    (AaveConfigManager as any).prototype.getPool = jest.fn().mockReturnValue(new Pool(mockProvider, {}));
    (AaveConfigManager as any).prototype.getProvider = jest.fn().mockReturnValue(mockProvider);

    riskService = RiskAssessmentService.getInstance();
  });

  test('getInstance returns singleton instance', () => {
    const instance1 = RiskAssessmentService.getInstance();
    const instance2 = RiskAssessmentService.getInstance();
    expect(instance1).toBe(instance2);
  });

  test('initialize sets up pools and collateral manager', async () => {
    await riskService.initialize();
    expect(AaveConfigManager.prototype.getPool).toHaveBeenCalledTimes(2);
    expect(CollateralManager.getInstance().initialize).toHaveBeenCalled();
  });

  test('assessFlashLoanRisk returns comprehensive risk assessment', async () => {
    await riskService.initialize();
    
    const assessment = await riskService.assessFlashLoanRisk(
      1,
      '0x1234',
      BigNumber.from('1000000000000000000'), // 1 token
      '0xuser'
    );

    expect(assessment.riskScore).toBeDefined();
    expect(assessment.maxLoanAmount).toBeDefined();
    expect(assessment.recommendedCollateral).toBeDefined();
    expect(assessment.estimatedGasCost).toBeDefined();
    expect(Array.isArray(assessment.warnings)).toBe(true);
    expect(typeof assessment.isViable).toBe('boolean');
  });

  test('high utilization triggers warning', async () => {
    await riskService.initialize();
    
    // Mock high utilization (80%)
    (Pool as jest.Mock).mockImplementationOnce(() => ({
      getReserveData: jest.fn().mockResolvedValue({
        availableLiquidity: '2000000000000000000',  // 2 tokens
        totalStableDebt: '4000000000000000000',     // 4 tokens
        totalVariableDebt: '4000000000000000000'    // 4 tokens
      })
    }));

    const assessment = await riskService.assessFlashLoanRisk(
      1,
      '0x1234',
      BigNumber.from('1000000000000000000'),
      '0xuser'
    );

    expect(assessment.warnings).toContain('High pool utilization may lead to increased costs');
  });

  test('large loan size triggers warning', async () => {
    await riskService.initialize();
    
    const assessment = await riskService.assessFlashLoanRisk(
      1,
      '0x1234',
      BigNumber.from('5000000000000000000'), // 5 tokens (much larger than average)
      '0xuser'
    );

    expect(assessment.warnings).toContain('Loan size significantly above average');
  });

  test('low collateral triggers warning', async () => {
    await riskService.initialize();
    
    // Mock low collateral
    (CollateralManager.getInstance().getUserCollateral as jest.Mock).mockResolvedValueOnce([{
      asset: {
        tokenAddress: '0x1234',
        symbol: 'TEST',
        decimals: 18,
        ltv: 8000,
        liquidationThreshold: 8500,
        liquidationPenalty: 500,
        supplyAPY: '50000000000000000',
        isActive: true
      },
      amount: BigNumber.from('100000000000000000'),
      amountUSD: BigNumber.from('200000000000000000'),
      healthFactor: BigNumber.from('1100000000000000000'),
      isCollateral: true
    }]);

    const assessment = await riskService.assessFlashLoanRisk(
      1,
      '0x1234',
      BigNumber.from('1000000000000000000'),
      '0xuser'
    );

    expect(assessment.warnings).toContain('Consider increasing collateral');
  });

  test('handles uninitialized pool error', async () => {
    await expect(riskService.assessFlashLoanRisk(
      999,
      '0x1234',
      BigNumber.from('1000000000000000000'),
      '0xuser'
    )).rejects.toThrow('No pool initialized for network 999');
  });

  test('calculates correct max loan amount', async () => {
    await riskService.initialize();
    
    const assessment = await riskService.assessFlashLoanRisk(
      1,
      '0x1234',
      BigNumber.from('1000000000000000000'),
      '0xuser'
    );

    // Max loan should be 80% of total liquidity (8 tokens)
    expect(assessment.maxLoanAmount).toEqual(BigNumber.from('8000000000000000000'));
  });

  test('estimates gas costs correctly', async () => {
    await riskService.initialize();
    
    const assessment = await riskService.assessFlashLoanRisk(
      1,
      '0x1234',
      BigNumber.from('1000000000000000000'),
      '0xuser'
    );

    // Gas price (20 Gwei) * Gas limit (300,000)
    expect(assessment.estimatedGasCost).toEqual(BigNumber.from('6000000000000000'));
  });
}); 