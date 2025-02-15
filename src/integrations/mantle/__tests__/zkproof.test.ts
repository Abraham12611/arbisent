import { describe, expect, test, jest, beforeEach, afterEach } from '@jest/globals';
import { ZKProofService } from '../zkproof';
import { MantleConfigManager } from '../config';
import { Contract, BigNumber } from 'ethers';

// Mock the Contract class
jest.mock('ethers', () => ({
  ...jest.requireActual('ethers'),
  Contract: jest.fn().mockImplementation(() => ({
    generateProof: jest.fn().mockResolvedValue('0x1234'),
    verifyProof: jest.fn().mockResolvedValue(true),
    validateState: jest.fn().mockResolvedValue(true),
    batchProcessProofs: jest.fn().mockResolvedValue([true, true, false])
  })),
  BigNumber: {
    from: jest.fn(value => ({ value }))
  }
}));

describe('ZKProofService', () => {
  let zkProofService: ZKProofService;

  beforeEach(async () => {
    // Reset the singleton instances before each test
    (ZKProofService as any).instance = null;
    (MantleConfigManager as any).instance = null;
    
    zkProofService = ZKProofService.getInstance();
    await zkProofService.initialize();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('getInstance returns singleton instance', () => {
    const instance1 = ZKProofService.getInstance();
    const instance2 = ZKProofService.getInstance();
    expect(instance1).toBe(instance2);
  });

  test('generateProof creates valid proof', async () => {
    const transactionData = {
      from: '0x1234',
      to: '0x5678',
      value: BigNumber.from('1000000000000000000'),
      data: '0x',
      nonce: 1
    };

    const proof = await zkProofService.generateProof(transactionData);
    
    expect(proof).toBeDefined();
    expect(proof.protocol).toBe('groth16');
    expect(proof.curve).toBe('bn128');
    expect(Array.isArray(proof.pi_a)).toBe(true);
    expect(Array.isArray(proof.pi_b)).toBe(true);
    expect(Array.isArray(proof.pi_c)).toBe(true);
  });

  test('verifyProof validates proof correctly', async () => {
    const proof = {
      pi_a: ['1', '2'],
      pi_b: [['3', '4'], ['5', '6']],
      pi_c: ['7', '8'],
      protocol: 'groth16',
      curve: 'bn128'
    };

    const isValid = await zkProofService.verifyProof(proof);
    expect(isValid).toBe(true);
  });

  test('validateState returns correct validation result', async () => {
    const stateRoot = '0x1234567890abcdef';
    
    const result = await zkProofService.validateState(stateRoot);
    
    expect(result.isValid).toBe(true);
    expect(result.timestamp).toBeDefined();
    expect(result.validatorSignature).toBeDefined();
  });

  test('batchProcess handles multiple proofs correctly', async () => {
    const proofs = [
      {
        pi_a: ['1', '2'],
        pi_b: [['3', '4'], ['5', '6']],
        pi_c: ['7', '8'],
        protocol: 'groth16',
        curve: 'bn128'
      },
      {
        pi_a: ['9', '10'],
        pi_b: [['11', '12'], ['13', '14']],
        pi_c: ['15', '16'],
        protocol: 'groth16',
        curve: 'bn128'
      },
      {
        pi_a: ['17', '18'],
        pi_b: [['19', '20'], ['21', '22']],
        pi_c: ['23', '24'],
        protocol: 'groth16',
        curve: 'bn128'
      }
    ];

    const result = await zkProofService.batchProcess(proofs);
    
    expect(result.successful).toHaveLength(2);
    expect(result.failed).toHaveLength(1);
    expect(result.timestamp).toBeDefined();
  });

  test('handles uninitialized validator contract', async () => {
    (zkProofService as any).validatorContract = null;

    await expect(zkProofService.generateProof({
      from: '0x1234',
      to: '0x5678',
      value: BigNumber.from('1000000000000000000'),
      data: '0x',
      nonce: 1
    })).rejects.toThrow('Validator contract not initialized');
  });

  test('handles proof verification failure', async () => {
    const mockContract = new Contract('', [], null);
    (mockContract.verifyProof as jest.Mock).mockResolvedValueOnce(false);
    (zkProofService as any).validatorContract = mockContract;

    const proof = {
      pi_a: ['1', '2'],
      pi_b: [['3', '4'], ['5', '6']],
      pi_c: ['7', '8'],
      protocol: 'groth16',
      curve: 'bn128'
    };

    const isValid = await zkProofService.verifyProof(proof);
    expect(isValid).toBe(false);
  });
}); 