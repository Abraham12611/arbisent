import { describe, expect, test, jest, beforeEach, afterEach } from '@jest/globals';
import { SettlementService } from '../settlement';
import { MantleConfigManager } from '../config';
import { Contract, BigNumber } from 'ethers';
import { Observable } from 'rxjs';

// Mock the Contract class
jest.mock('ethers', () => ({
  Contract: jest.fn().mockImplementation(() => ({
    submitTransaction: jest.fn().mockResolvedValue({
      wait: jest.fn().mockResolvedValue({}),
      logs: [{ topics: ['0x0', '0xhash'] }]
    }),
    confirmSettlement: jest.fn().mockResolvedValue(true),
    getSettlementFees: jest.fn().mockResolvedValue([
      BigNumber.from('1000000000'),
      BigNumber.from('500000000')
    ]),
    on: jest.fn()
  })),
  BigNumber: {
    from: (value: string) => ({
      add: jest.fn().mockReturnValue({ value: 'total' }),
      mul: jest.fn().mockReturnValue({ value: 'estimated' })
    })
  }
}));

describe('SettlementService', () => {
  let service: SettlementService;
  let mockProvider: any;

  beforeEach(() => {
    // Reset singleton instances
    (SettlementService as any).instance = null;
    (MantleConfigManager as any).instance = null;

    // Mock provider methods
    mockProvider = {
      getTransactionReceipt: jest.fn().mockResolvedValue({
        blockNumber: 1234,
        confirmations: 1
      }),
      getBlock: jest.fn().mockResolvedValue({
        timestamp: Date.now()
      })
    };

    // Mock config manager
    (MantleConfigManager as any).prototype.getCurrentNetwork = jest.fn().mockReturnValue({
      contractAddresses: {
        settlement: '0x1234567890123456789012345678901234567890'
      }
    });
    (MantleConfigManager as any).prototype.getProvider = jest.fn().mockReturnValue(mockProvider);

    service = SettlementService.getInstance();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('getInstance returns singleton instance', () => {
    const instance1 = SettlementService.getInstance();
    const instance2 = SettlementService.getInstance();
    expect(instance1).toBe(instance2);
  });

  test('initialize creates settlement contract', async () => {
    await service.initialize();
    expect(Contract).toHaveBeenCalled();
  });

  test('submitTransaction encodes and submits transaction', async () => {
    await service.initialize();

    const tx = {
      hash: '0xhash',
      from: '0x1234',
      to: '0x5678',
      value: BigNumber.from('1000000000000000000'),
      data: '0x',
      nonce: 1
    };

    const txHash = await service.submitTransaction(tx);
    expect(txHash).toBe('0xhash');
  });

  test('confirmSettlement returns settlement status', async () => {
    await service.initialize();

    const status = await service.confirmSettlement('0xhash');
    expect(status.isSettled).toBe(true);
    expect(status.blockNumber).toBe(1234);
    expect(status.confirmations).toBe(1);
  });

  test('getSettlementFees returns fee structure', async () => {
    await service.initialize();

    const fees = await service.getSettlementFees();
    expect(fees.baseFee).toBeDefined();
    expect(fees.priorityFee).toBeDefined();
    expect(fees.totalFee).toBeDefined();
    expect(fees.estimatedCost).toBeDefined();
  });

  test('monitorSettlement returns observable', async () => {
    await service.initialize();

    const observable = service.monitorSettlement('0xhash');
    expect(observable).toBeInstanceOf(Observable);
  });

  test('handles uninitialized contract errors', async () => {
    await expect(service.submitTransaction({
      hash: '0xhash',
      from: '0x1234',
      to: '0x5678',
      value: BigNumber.from('1000000000000000000'),
      data: '0x',
      nonce: 1
    })).rejects.toThrow('Settlement contract not initialized');
  });

  test('handles transaction submission failure', async () => {
    await service.initialize();

    // Mock contract method to throw
    (Contract as jest.Mock).mockImplementationOnce(() => ({
      submitTransaction: jest.fn().mockRejectedValue(new Error('Transaction failed'))
    }));

    await expect(service.submitTransaction({
      hash: '0xhash',
      from: '0x1234',
      to: '0x5678',
      value: BigNumber.from('1000000000000000000'),
      data: '0x',
      nonce: 1
    })).rejects.toThrow('Transaction failed');
  });

  test('handles missing transaction receipt', async () => {
    await service.initialize();

    // Mock provider to return null receipt
    mockProvider.getTransactionReceipt.mockResolvedValueOnce(null);

    const status = await service.confirmSettlement('0xhash');
    expect(status.isSettled).toBe(false);
    expect(status.confirmations).toBe(0);
  });
}); 