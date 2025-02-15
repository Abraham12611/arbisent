import { describe, expect, test, jest, beforeEach, afterEach } from '@jest/globals';
import { UnifiedWalletManager } from '../wallet';
import { CrossMintConfigManager } from '../config';
import { providers, Wallet, BigNumber } from 'ethers';

// Mock the window.ethereum object
const mockEthereum = {
  request: jest.fn(),
  isMetaMask: true
};

// Mock the ethers Wallet
jest.mock('ethers', () => ({
  Wallet: jest.fn().mockImplementation(() => ({
    address: '0x1234567890123456789012345678901234567890',
    provider: {
      getNetwork: jest.fn().mockResolvedValue({ name: 'testnet', chainId: 5000 }),
      getBalance: jest.fn().mockResolvedValue(BigNumber.from('1000000000000000000')),
      getTransactionCount: jest.fn().mockResolvedValue(1),
      getGasPrice: jest.fn().mockResolvedValue(BigNumber.from('20000000000')),
      estimateGas: jest.fn().mockResolvedValue(BigNumber.from('21000'))
    },
    signTransaction: jest.fn().mockResolvedValue('0xsignedtx'),
    getBalance: jest.fn().mockResolvedValue(BigNumber.from('1000000000000000000'))
  })),
  providers: {
    Provider: jest.fn(),
    JsonRpcProvider: jest.fn().mockImplementation(() => ({
      ready: Promise.resolve()
    }))
  },
  BigNumber: {
    from: jest.fn(value => ({ value }))
  }
}));

describe('UnifiedWalletManager', () => {
  let walletManager: UnifiedWalletManager;

  beforeEach(() => {
    // Reset singleton instances
    (UnifiedWalletManager as any).instance = null;
    (CrossMintConfigManager as any).instance = null;
    
    // Mock window.ethereum
    (window as any).ethereum = mockEthereum;
    
    // Mock CrossMintConfigManager methods
    (CrossMintConfigManager as any).prototype.isSupportedChain = jest.fn().mockReturnValue(true);
    (CrossMintConfigManager as any).prototype.getProvider = jest.fn().mockReturnValue({
      getNetwork: jest.fn().mockResolvedValue({ name: 'testnet', chainId: 5000 }),
      getBalance: jest.fn().mockResolvedValue(BigNumber.from('1000000000000000000'))
    });
    
    walletManager = UnifiedWalletManager.getInstance();
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete (window as any).ethereum;
  });

  test('getInstance returns singleton instance', () => {
    const instance1 = UnifiedWalletManager.getInstance();
    const instance2 = UnifiedWalletManager.getInstance();
    expect(instance1).toBe(instance2);
  });

  test('connect with private key creates wallet', async () => {
    const config = {
      chainId: 5000,
      privateKey: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
    };

    const state = await walletManager.connect(config);
    
    expect(state.address).toBe('0x1234567890123456789012345678901234567890');
    expect(state.chainId).toBe(5000);
    expect(state.isConnected).toBe(true);
    expect(state.network).toBe('testnet');
  });

  test('connect with browser wallet requests accounts', async () => {
    mockEthereum.request
      .mockResolvedValueOnce([]) // eth_requestAccounts
      .mockResolvedValueOnce(['0x1234567890123456789012345678901234567890']); // eth_accounts
    
    const state = await walletManager.connect({ chainId: 5000 });
    
    expect(mockEthereum.request).toHaveBeenCalledWith({ method: 'eth_requestAccounts' });
    expect(state.address).toBe('0x1234567890123456789012345678901234567890');
  });

  test('disconnect removes wallet', async () => {
    await walletManager.connect({ chainId: 5000 });
    await walletManager.disconnect(5000);
    
    expect(walletManager.isConnected(5000)).toBe(false);
    expect(walletManager.getActiveChain()).toBeNull();
  });

  test('switchChain changes active chain', async () => {
    await walletManager.connect({ chainId: 5000 });
    await walletManager.connect({ chainId: 1 });
    
    const state = await walletManager.switchChain(1);
    
    expect(state.chainId).toBe(1);
    expect(walletManager.getActiveChain()).toBe(1);
  });

  test('signTransaction with complete parameters', async () => {
    await walletManager.connect({ chainId: 5000 });
    
    const tx = {
      to: '0x9876543210987654321098765432109876543210',
      value: BigNumber.from('1000000000000000000'),
      data: '0x',
      nonce: 1,
      gasLimit: BigNumber.from('21000'),
      gasPrice: BigNumber.from('20000000000')
    };

    const signed = await walletManager.signTransaction(tx);
    
    expect(signed.chainId).toBe(5000);
    expect(signed.data).toBe('0xsignedtx');
  });

  test('getConnectedChains returns all chains', async () => {
    await walletManager.connect({ chainId: 5000 });
    await walletManager.connect({ chainId: 1 });
    
    const chains = walletManager.getConnectedChains();
    expect(chains).toContain(5000);
    expect(chains).toContain(1);
  });

  test('getBalance returns wallet balance', async () => {
    await walletManager.connect({ chainId: 5000 });
    
    const balance = await walletManager.getBalance();
    expect(balance.value).toBe('1000000000000000000');
  });

  test('handles unsupported chain', async () => {
    (CrossMintConfigManager as any).prototype.isSupportedChain = jest.fn().mockReturnValue(false);
    
    await expect(walletManager.connect({ chainId: 999999 }))
      .rejects.toThrow('Chain ID 999999 is not supported');
  });

  test('handles missing browser wallet', async () => {
    delete (window as any).ethereum;
    
    await expect(walletManager.connect({ chainId: 5000 }))
      .rejects.toThrow('No browser wallet found');
  });

  test('handles transaction signing without connection', async () => {
    await expect(walletManager.signTransaction({
      to: '0x9876543210987654321098765432109876543210',
      value: BigNumber.from('1000000000000000000')
    })).rejects.toThrow('No active chain selected');
  });
}); 