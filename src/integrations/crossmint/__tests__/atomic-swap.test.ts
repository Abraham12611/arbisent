import { describe, expect, test, jest, beforeEach, afterEach } from '@jest/globals';
import { AtomicSwapService } from '../atomic-swap';
import { CrossMintConfigManager } from '../config';
import { UnifiedWalletManager } from '../wallet';
import { Contract, BigNumber } from 'ethers';
import { Observable } from 'rxjs';

// Mock the Contract class
jest.mock('ethers', () => ({
  Contract: jest.fn().mockImplementation(() => ({
    getSwapQuote: jest.fn().mockResolvedValue({
      price: BigNumber.from('1000000000000000000'),
      impact: BigNumber.from('50'), // 0.5%
      gas: BigNumber.from('150000'),
      router: '0xrouter',
      deadline: BigNumber.from(Math.floor(Date.now() / 1000) + 3600),
      path: ['0xtoken1', '0xtoken2']
    }),
    executeSwap: jest.fn().mockResolvedValue({
      wait: jest.fn().mockResolvedValue({
        logs: [{ topics: ['0x0', '0xswapid'] }]
      })
    }),
    on: jest.fn()
  })),
  BigNumber: {
    from: jest.fn(value => ({ value, mul: jest.fn(), div: jest.fn() }))
  }
}));

describe('AtomicSwapService', () => {
  let swapService: AtomicSwapService;

  beforeEach(() => {
    // Reset singleton instances
    (AtomicSwapService as any).instance = null;
    (CrossMintConfigManager as any).instance = null;
    (UnifiedWalletManager as any).instance = null;

    // Mock CrossMintConfigManager
    (CrossMintConfigManager as any).prototype.getConfig = jest.fn().mockReturnValue({
      supportedChains: [1, 137, 5000]
    });
    (CrossMintConfigManager as any).prototype.getProvider = jest.fn();

    // Mock UnifiedWalletManager
    (UnifiedWalletManager as any).prototype.isConnected = jest.fn().mockReturnValue(true);
    (UnifiedWalletManager as any).prototype.switchChain = jest.fn();

    swapService = AtomicSwapService.getInstance();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('getInstance returns singleton instance', () => {
    const instance1 = AtomicSwapService.getInstance();
    const instance2 = AtomicSwapService.getInstance();
    expect(instance1).toBe(instance2);
  });

  test('initialize creates contracts for supported chains', async () => {
    await swapService.initialize();
    expect(Contract).toHaveBeenCalledTimes(3); // One for each supported chain
  });

  test('getQuote returns swap quote', async () => {
    await swapService.initialize();

    const sourceAsset = {
      chainId: 1,
      tokenAddress: '0xtoken1',
      amount: BigNumber.from('1000000000000000000'),
      decimals: 18
    };

    const targetAsset = {
      chainId: 5000,
      tokenAddress: '0xtoken2',
      amount: BigNumber.from('0'),
      decimals: 18
    };

    const quote = await swapService.getQuote(sourceAsset, targetAsset);
    
    expect(quote.sourceAsset).toBe(sourceAsset);
    expect(quote.targetAsset).toBe(targetAsset);
    expect(quote.executionPrice).toBeDefined();
    expect(quote.priceImpact).toBe(0.5);
    expect(quote.path).toEqual(['0xtoken1', '0xtoken2']);
  });

  test('executeSwap initiates swap', async () => {
    await swapService.initialize();

    const quote = {
      sourceAsset: {
        chainId: 1,
        tokenAddress: '0xtoken1',
        amount: BigNumber.from('1000000000000000000'),
        decimals: 18
      },
      targetAsset: {
        chainId: 5000,
        tokenAddress: '0xtoken2',
        amount: BigNumber.from('0'),
        decimals: 18
      },
      executionPrice: BigNumber.from('1000000000000000000'),
      priceImpact: 0.5,
      estimatedGas: BigNumber.from('150000'),
      routerAddress: '0xrouter',
      deadline: Math.floor(Date.now() / 1000) + 3600,
      path: ['0xtoken1', '0xtoken2']
    };

    const swapId = await swapService.executeSwap(quote, BigNumber.from('950000000000000000')); // 5% slippage
    expect(swapId).toBe('0xswapid');
  });

  test('monitorSwap returns observable', async () => {
    await swapService.initialize();
    const observable = swapService.monitorSwap('0xswapid');
    expect(observable).toBeInstanceOf(Observable);
  });

  test('handles unsupported chain', async () => {
    await swapService.initialize();

    const sourceAsset = {
      chainId: 999999,
      tokenAddress: '0xtoken1',
      amount: BigNumber.from('1000000000000000000'),
      decimals: 18
    };

    const targetAsset = {
      chainId: 5000,
      tokenAddress: '0xtoken2',
      amount: BigNumber.from('0'),
      decimals: 18
    };

    await expect(swapService.getQuote(sourceAsset, targetAsset))
      .rejects.toThrow('No swap contract for chain 999999');
  });

  test('handles wallet not connected', async () => {
    await swapService.initialize();
    (UnifiedWalletManager as any).prototype.isConnected = jest.fn().mockReturnValue(false);

    const quote = {
      sourceAsset: {
        chainId: 1,
        tokenAddress: '0xtoken1',
        amount: BigNumber.from('1000000000000000000'),
        decimals: 18
      },
      targetAsset: {
        chainId: 5000,
        tokenAddress: '0xtoken2',
        amount: BigNumber.from('0'),
        decimals: 18
      },
      executionPrice: BigNumber.from('1000000000000000000'),
      priceImpact: 0.5,
      estimatedGas: BigNumber.from('150000'),
      routerAddress: '0xrouter',
      deadline: Math.floor(Date.now() / 1000) + 3600,
      path: ['0xtoken1', '0xtoken2']
    };

    await expect(swapService.executeSwap(quote, BigNumber.from('950000000000000000')))
      .rejects.toThrow('Wallet not connected for chain 1');
  });

  test('handles swap execution failure', async () => {
    await swapService.initialize();

    // Mock contract to throw
    (Contract as jest.Mock).mockImplementationOnce(() => ({
      executeSwap: jest.fn().mockRejectedValue(new Error('Insufficient liquidity'))
    }));

    const quote = {
      sourceAsset: {
        chainId: 1,
        tokenAddress: '0xtoken1',
        amount: BigNumber.from('1000000000000000000'),
        decimals: 18
      },
      targetAsset: {
        chainId: 5000,
        tokenAddress: '0xtoken2',
        amount: BigNumber.from('0'),
        decimals: 18
      },
      executionPrice: BigNumber.from('1000000000000000000'),
      priceImpact: 0.5,
      estimatedGas: BigNumber.from('150000'),
      routerAddress: '0xrouter',
      deadline: Math.floor(Date.now() / 1000) + 3600,
      path: ['0xtoken1', '0xtoken2']
    };

    await expect(swapService.executeSwap(quote, BigNumber.from('950000000000000000')))
      .rejects.toThrow('Insufficient liquidity');
  });
}); 