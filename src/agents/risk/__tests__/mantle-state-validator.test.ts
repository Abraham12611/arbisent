import { describe, expect, test, jest, beforeEach } from '@jest/globals';
import { MantleStateValidator } from '../mantle-state-validator';
import { ZKProofService } from '../../../integrations/mantle/zkproof';
import { MantleConnectionManager } from '../../../integrations/mantle/connection';
import { providers, Contract, BigNumber } from 'ethers';

// Mock dependencies
jest.mock('../../../integrations/mantle/zkproof');
jest.mock('../../../integrations/mantle/connection');

describe('MantleStateValidator', () => {
  let stateValidator: MantleStateValidator;
  let mockProvider: jest.Mocked<providers.Provider>;
  let mockValidatorContract: jest.Mocked<Contract>;

  beforeEach(() => {
    // Reset singleton instances
    (MantleStateValidator as any).instance = null;
    (ZKProofService as any).instance = null;
    (MantleConnectionManager as any).instance = null;

    // Create mock provider
    mockProvider = {
      getBlockNumber: jest.fn().mockResolvedValue(1000),
      getBlock: jest.fn().mockImplementation((blockNumber) => Promise.resolve({
        number: blockNumber,
        timestamp: Date.now() / 1000 - (1000 - blockNumber) * 15,
        stateRoot: '0x1234567890abcdef',
        hash: '0xblockhash'
      }))
    } as unknown as jest.Mocked<providers.Provider>;

    // Create mock validator contract
    mockValidatorContract = {
      getValidatorCount: jest.fn().mockResolvedValue(BigNumber.from(5))
    } as unknown as jest.Mocked<Contract>;

    // Mock ZKProofService
    (ZKProofService.getInstance as jest.Mock).mockReturnValue({
      initialize: jest.fn().mockResolvedValue(undefined),
      validateState: jest.fn().mockResolvedValue({
        isValid: true,
        timestamp: Date.now(),
        validatorSignature: '0xsignature'
      }),
      getValidatorContract: jest.fn().mockResolvedValue(mockValidatorContract)
    });

    // Mock MantleConnectionManager
    (MantleConnectionManager.getInstance as jest.Mock).mockReturnValue({
      getProvider: jest.fn().mockReturnValue(mockProvider)
    });

    stateValidator = MantleStateValidator.getInstance();
  });

  test('getInstance returns singleton instance', () => {
    const instance1 = MantleStateValidator.getInstance();
    const instance2 = MantleStateValidator.getInstance();
    expect(instance1).toBe(instance2);
  });

  test('initialize sets up dependencies', async () => {
    await stateValidator.initialize();
    expect(ZKProofService.getInstance().initialize).toHaveBeenCalled();
  });

  test('validateNetworkState returns comprehensive validation result', async () => {
    await stateValidator.initialize();
    
    const result = await stateValidator.validateNetworkState(5000);
    
    expect(result.isValid).toBe(true);
    expect(result.networkMetrics).toBeDefined();
    expect(result.riskScore).toBeDefined();
    expect(result.warnings).toBeInstanceOf(Array);
    expect(result.timestamp).toBeDefined();
  });

  test('handles invalid state validation', async () => {
    // Mock invalid state
    (ZKProofService.getInstance().validateState as jest.Mock)
      .mockResolvedValueOnce({
        isValid: false,
        timestamp: Date.now(),
        error: 'Invalid state root'
      });

    const result = await stateValidator.validateNetworkState(5000);
    
    expect(result.isValid).toBe(false);
    expect(result.warnings).toContain('Invalid state root');
    expect(result.riskScore).toBeGreaterThan(50);
  });

  test('handles high validation lag', async () => {
    // Mock high validation lag scenario
    mockProvider.getBlockNumber.mockResolvedValueOnce(2000);
    const blocks = Array.from({ length: 100 }, (_, i) => ({
      number: 2000 - i,
      timestamp: Date.now() / 1000 - i * 15,
      stateRoot: '0x1234567890abcdef',
      hash: '0xblockhash'
    }));
    mockProvider.getBlock.mockImplementation((blockNumber) => 
      Promise.resolve(blocks.find(b => b.number === blockNumber))
    );

    const result = await stateValidator.validateNetworkState(5000);
    
    expect(result.networkMetrics.validationLag).toBeGreaterThan(10);
    expect(result.warnings).toContain(expect.stringContaining('High validation lag'));
    expect(result.riskScore).toBeGreaterThan(30);
  });

  test('handles low validator count', async () => {
    // Mock low validator count
    mockValidatorContract.getValidatorCount.mockResolvedValueOnce(
      BigNumber.from(2)
    );

    const result = await stateValidator.validateNetworkState(5000);
    
    expect(result.networkMetrics.validatorCount).toBeLessThan(3);
    expect(result.warnings).toContain(expect.stringContaining('Low validator count'));
    expect(result.riskScore).toBeGreaterThan(20);
  });

  test('handles high block time', async () => {
    // Mock high block time scenario
    const blocks = Array.from({ length: 100 }, (_, i) => ({
      number: 1000 - i,
      timestamp: Date.now() / 1000 - i * 20, // 20 seconds per block
      stateRoot: '0x1234567890abcdef',
      hash: '0xblockhash'
    }));
    mockProvider.getBlock.mockImplementation((blockNumber) => 
      Promise.resolve(blocks.find(b => b.number === blockNumber))
    );

    const result = await stateValidator.validateNetworkState(5000);
    
    expect(result.networkMetrics.averageBlockTime).toBeGreaterThan(15000);
    expect(result.warnings).toContain(expect.stringContaining('High average block time'));
    expect(result.riskScore).toBeGreaterThan(10);
  });

  test('getLastValidation returns cached result', async () => {
    await stateValidator.validateNetworkState(5000);
    const cached = await stateValidator.getLastValidation(5000);
    
    expect(cached).toBeDefined();
    expect(cached?.isValid).toBe(true);
  });

  test('handles provider errors gracefully', async () => {
    mockProvider.getBlockNumber.mockRejectedValueOnce(
      new Error('Provider error')
    );

    await expect(stateValidator.validateNetworkState(5000))
      .rejects.toThrow('Provider error');
  });
}); 