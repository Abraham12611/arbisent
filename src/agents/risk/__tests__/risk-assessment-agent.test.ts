import { describe, expect, test, jest, beforeEach } from '@jest/globals';
import { RiskAssessmentAgent } from '../risk-assessment-agent';
import { RiskAssessmentService } from '../../../integrations/aave/risk';
import { MantleStateValidator } from '../mantle-state-validator';
import { BigNumber } from 'ethers';

// Mock dependencies
jest.mock('../../../integrations/aave/risk');
jest.mock('../mantle-state-validator');

describe('RiskAssessmentAgent', () => {
  let riskAgent: RiskAssessmentAgent;

  beforeEach(() => {
    // Reset singleton instances
    (RiskAssessmentAgent as any).instance = null;
    (RiskAssessmentService as any).instance = null;
    (MantleStateValidator as any).instance = null;

    // Mock RiskAssessmentService
    (RiskAssessmentService.getInstance as jest.Mock).mockReturnValue({
      initialize: jest.fn().mockResolvedValue(undefined),
      assessFlashLoanRisk: jest.fn().mockResolvedValue({
        riskScore: 30,
        maxLoanAmount: BigNumber.from('1000000000000000000'),
        recommendedCollateral: BigNumber.from('1500000000000000000'),
        estimatedGasCost: BigNumber.from('100000'),
        warnings: ['Consider increasing collateral'],
        isViable: true
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

  test('getInstance returns singleton instance', () => {
    const instance1 = RiskAssessmentAgent.getInstance();
    const instance2 = RiskAssessmentAgent.getInstance();
    expect(instance1).toBe(instance2);
  });

  test('initialize sets up dependencies', async () => {
    await riskAgent.initialize();
    
    expect(RiskAssessmentService.getInstance().initialize).toHaveBeenCalled();
    expect(MantleStateValidator.getInstance().initialize).toHaveBeenCalled();
  });

  test('assessRisk returns comprehensive risk assessment with flash loan only', async () => {
    await riskAgent.initialize();
    
    const result = await riskAgent.assessRisk(5000, {
      tokenAddress: '0xtoken',
      amount: BigNumber.from('1000000000000000000'),
      userAddress: '0xuser'
    });
    
    expect(result.overallRiskScore).toBeDefined();
    expect(result.components.flashLoanRisk).toBeDefined();
    expect(result.components.networkStateRisk).toBeUndefined();
    expect(result.recommendations).toContain(expect.stringContaining('Consider adjusting flash loan parameters'));
  });

  test('assessRisk returns comprehensive risk assessment with network state', async () => {
    await riskAgent.initialize();
    
    const result = await riskAgent.assessRisk(5000, {
      includeNetworkState: true
    });
    
    expect(result.overallRiskScore).toBeDefined();
    expect(result.components.flashLoanRisk).toBeUndefined();
    expect(result.components.networkStateRisk).toBeDefined();
    expect(result.components.networkStateRisk?.metrics).toBeDefined();
  });

  test('assessRisk handles unhealthy network state', async () => {
    // Mock unhealthy network state
    (MantleStateValidator.getInstance().validateNetworkState as jest.Mock)
      .mockResolvedValueOnce({
        isValid: true,
        networkMetrics: {
          blockHeight: 1000,
          lastValidatedBlock: 900,
          validationLag: 100,
          stateRoot: '0x1234567890abcdef',
          isHealthy: false,
          validatorCount: 2,
          averageBlockTime: 20000
        },
        riskScore: 75,
        warnings: ['High validation lag', 'Low validator count'],
        timestamp: Date.now()
      });

    const result = await riskAgent.assessRisk(5000, {
      includeNetworkState: true
    });
    
    expect(result.overallRiskScore).toBeGreaterThan(50);
    expect(result.components.networkStateRisk?.score).toBe(75);
    expect(result.recommendations).toContain(expect.stringContaining('Network state indicates potential risks'));
  });

  test('assessRisk handles high flash loan risk', async () => {
    // Mock high flash loan risk
    (RiskAssessmentService.getInstance().assessFlashLoanRisk as jest.Mock)
      .mockResolvedValueOnce({
        riskScore: 80,
        maxLoanAmount: BigNumber.from('1000000000000000000'),
        recommendedCollateral: BigNumber.from('2000000000000000000'),
        estimatedGasCost: BigNumber.from('200000'),
        warnings: ['High market volatility', 'Insufficient collateral'],
        isViable: false
      });

    const result = await riskAgent.assessRisk(5000, {
      tokenAddress: '0xtoken',
      amount: BigNumber.from('1000000000000000000'),
      userAddress: '0xuser'
    });
    
    expect(result.overallRiskScore).toBeGreaterThan(70);
    expect(result.components.flashLoanRisk?.score).toBe(80);
    expect(result.recommendations).toContain(expect.stringContaining('High market volatility'));
  });

  test('assessRisk calculates correct weighted risk score', async () => {
    // Mock specific risk scores
    (RiskAssessmentService.getInstance().assessFlashLoanRisk as jest.Mock)
      .mockResolvedValueOnce({
        riskScore: 40,
        warnings: [],
        isViable: true
      });

    (MantleStateValidator.getInstance().validateNetworkState as jest.Mock)
      .mockResolvedValueOnce({
        isValid: true,
        networkMetrics: { isHealthy: true },
        riskScore: 60,
        warnings: [],
        timestamp: Date.now()
      });

    const result = await riskAgent.assessRisk(5000, {
      tokenAddress: '0xtoken',
      amount: BigNumber.from('1000000000000000000'),
      userAddress: '0xuser',
      includeNetworkState: true
    });
    
    // Expected: (40 * 0.4 + 60 * 0.6) = 52
    expect(result.overallRiskScore).toBe(52);
  });

  test('getLastAssessment returns cached result', async () => {
    await riskAgent.assessRisk(5000, {
      tokenAddress: '0xtoken',
      userAddress: '0xuser',
      includeNetworkState: true
    });

    const cached = await riskAgent.getLastAssessment(5000, '0xtoken', '0xuser');
    
    expect(cached).toBeDefined();
    expect(cached?.timestamp).toBeDefined();
    expect(cached?.components.networkStateRisk).toBeDefined();
  });

  test('handles service errors gracefully', async () => {
    (RiskAssessmentService.getInstance().assessFlashLoanRisk as jest.Mock)
      .mockRejectedValueOnce(new Error('Service error'));

    await expect(riskAgent.assessRisk(5000, {
      tokenAddress: '0xtoken',
      amount: BigNumber.from('1000000000000000000'),
      userAddress: '0xuser'
    })).rejects.toThrow('Service error');
  });
}); 