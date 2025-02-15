import { describe, expect, test, jest, beforeEach } from '@jest/globals';
import { RiskAssessmentAgent } from '../risk-assessment-agent';
import { RiskAssessmentService } from '../../../integrations/aave/risk';
import { MantleStateValidator } from '../mantle-state-validator';
import { BigNumber } from 'ethers';

// Mock dependencies
jest.mock('../../../integrations/aave/risk');
jest.mock('../mantle-state-validator');

describe('Cross-Chain Risk Assessment', () => {
  let riskAgent: RiskAssessmentAgent;

  beforeEach(() => {
    // Reset singleton instances
    (RiskAssessmentAgent as any).instance = null;
    (RiskAssessmentService as any).instance = null;
    (MantleStateValidator as any).instance = null;

    // Mock RiskAssessmentService
    (RiskAssessmentService.getInstance as jest.Mock).mockReturnValue({
      initialize: jest.fn().mockResolvedValue(undefined),
      getPool: jest.fn().mockReturnValue({
        provider: {
          getGasPrice: jest.fn().mockResolvedValue(BigNumber.from('20000000000'))
        }
      }),
      getMarketCondition: jest.fn().mockResolvedValue({
        totalLiquidity: BigNumber.from('10000000000000000000'), // 10 tokens
        utilizationRate: 0.5,
        volatility24h: 2,
        averageTransactionSize: BigNumber.from('1000000000000000000')
      })
    });

    // Mock MantleStateValidator
    (MantleStateValidator.getInstance as jest.Mock).mockReturnValue({
      initialize: jest.fn().mockResolvedValue(undefined),
      validateNetworkState: jest.fn().mockResolvedValue({
        isValid: true,
        networkMetrics: {
          blockHeight: 1000,
          lastValidatedBlock: 990,
          validationLag: 10,
          stateRoot: '0x1234567890abcdef',
          isHealthy: true,
          validatorCount: 5,
          averageBlockTime: 15000
        },
        riskScore: 20,
        warnings: [],
        timestamp: Date.now()
      })
    });

    riskAgent = RiskAssessmentAgent.getInstance();
  });

  test('assessRisk includes cross-chain risk when targetChainId is provided', async () => {
    await riskAgent.initialize();
    
    const result = await riskAgent.assessRisk(1, {
      tokenAddress: '0xtoken',
      amount: BigNumber.from('1000000000000000000'),
      userAddress: '0xuser',
      targetChainId: 5000
    });

    expect(result.components.crossChainRisk).toBeDefined();
    expect(result.components.crossChainRisk?.score).toBeDefined();
    expect(result.components.crossChainRisk?.warnings).toBeInstanceOf(Array);
    expect(result.components.crossChainRisk?.metrics).toBeDefined();
  });

  test('high bridge latency triggers warning', async () => {
    // Mock high bridge latency
    const highLatencyBridgeMetrics = {
      latency: 120000, // 120 seconds
      reliability: 0.98
    };

    jest.spyOn(RiskAssessmentAgent.prototype as any, 'calculateBridgeMetrics')
      .mockResolvedValueOnce(highLatencyBridgeMetrics);

    const result = await riskAgent.assessRisk(1, {
      tokenAddress: '0xtoken',
      amount: BigNumber.from('1000000000000000000'),
      targetChainId: 5000
    });

    expect(result.components.crossChainRisk?.warnings)
      .toContain(expect.stringContaining('High bridge latency'));
    expect(result.components.crossChainRisk?.score).toBeGreaterThan(50);
  });

  test('low bridge reliability triggers warning', async () => {
    // Mock low bridge reliability
    const lowReliabilityBridgeMetrics = {
      latency: 30000,
      reliability: 0.90 // 90%
    };

    jest.spyOn(RiskAssessmentAgent.prototype as any, 'calculateBridgeMetrics')
      .mockResolvedValueOnce(lowReliabilityBridgeMetrics);

    const result = await riskAgent.assessRisk(1, {
      tokenAddress: '0xtoken',
      amount: BigNumber.from('1000000000000000000'),
      targetChainId: 5000
    });

    expect(result.components.crossChainRisk?.warnings)
      .toContain(expect.stringContaining('Low bridge reliability'));
    expect(result.components.crossChainRisk?.score).toBeGreaterThan(40);
  });

  test('low liquidity ratio triggers warning', async () => {
    // Mock low liquidity
    (RiskAssessmentService.getInstance().getMarketCondition as jest.Mock)
      .mockResolvedValueOnce({
        totalLiquidity: BigNumber.from('1000000000000000000'), // 1 token
        utilizationRate: 0.8,
        volatility24h: 2,
        averageTransactionSize: BigNumber.from('1000000000000000000')
      });

    const result = await riskAgent.assessRisk(1, {
      tokenAddress: '0xtoken',
      amount: BigNumber.from('10000000000000000000'), // 10 tokens
      targetChainId: 5000
    });

    expect(result.components.crossChainRisk?.warnings)
      .toContain(expect.stringContaining('Insufficient cross-chain liquidity'));
    expect(result.components.crossChainRisk?.score).toBeGreaterThan(60);
  });

  test('calculates correct weighted risk score', async () => {
    // Mock specific risk scores
    const bridgeMetrics = {
      latency: 45000, // 45 seconds (75% of threshold)
      reliability: 0.96 // 96%
    };

    jest.spyOn(RiskAssessmentAgent.prototype as any, 'calculateBridgeMetrics')
      .mockResolvedValueOnce(bridgeMetrics);

    (RiskAssessmentService.getInstance().getMarketCondition as jest.Mock)
      .mockResolvedValue({
        totalLiquidity: BigNumber.from('5000000000000000000'), // 5 tokens
        utilizationRate: 0.6,
        volatility24h: 2,
        averageTransactionSize: BigNumber.from('1000000000000000000')
      });

    const result = await riskAgent.assessRisk(1, {
      tokenAddress: '0xtoken',
      amount: BigNumber.from('1000000000000000000'),
      targetChainId: 5000
    });

    // Expected scores:
    // - Latency: ~30 (75% of 40 max)
    // - Reliability: ~12 ((1 - 0.96) * 100 * 0.3)
    // - Liquidity: ~15 (ratio = 5, which is good)
    // Total: ~57
    expect(result.components.crossChainRisk?.score).toBeGreaterThanOrEqual(50);
    expect(result.components.crossChainRisk?.score).toBeLessThanOrEqual(65);
  });

  test('high risk triggers recommendation', async () => {
    // Mock high risk scenario
    const highRiskBridgeMetrics = {
      latency: 90000, // 90 seconds
      reliability: 0.92 // 92%
    };

    jest.spyOn(RiskAssessmentAgent.prototype as any, 'calculateBridgeMetrics')
      .mockResolvedValueOnce(highRiskBridgeMetrics);

    (RiskAssessmentService.getInstance().getMarketCondition as jest.Mock)
      .mockResolvedValue({
        totalLiquidity: BigNumber.from('2000000000000000000'), // 2 tokens
        utilizationRate: 0.8,
        volatility24h: 4,
        averageTransactionSize: BigNumber.from('1000000000000000000')
      });

    const result = await riskAgent.assessRisk(1, {
      tokenAddress: '0xtoken',
      amount: BigNumber.from('1000000000000000000'),
      targetChainId: 5000
    });

    expect(result.recommendations)
      .toContain(expect.stringContaining('High cross-chain risk detected'));
    expect(result.components.crossChainRisk?.score).toBeGreaterThan(70);
  });
}); 