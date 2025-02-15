import { describe, expect, test, jest, beforeEach, afterEach } from '@jest/globals';
import { MantleWallet } from '../wallet';
import { MantleConfigManager } from '../config';
import { MantleConnectionManager } from '../connection';
import { providers, Wallet, BigNumber } from 'ethers';

// Mock the window.ethereum object
const mockEthereum = {
  request: jest.fn(),
  isMetaMask: true
};

// Mock the ethers Wallet
jest.mock('ethers', () => ({
  ...jest.requireActual('ethers'),
  Wallet: jest.fn().mockImplementation(() => ({
    address: '0x1234567890123456789012345678901234567890',
    signTransaction: jest.fn().mockResolvedValue('0xsignedtx')
  })),
  providers: {
    JsonRpcProvider: jest.fn().mockImplementation(() => ({
      getNetwork: jest.fn().mockResolvedValue({ chainId: 5001 }),
      getBalance: jest.fn().mockResolvedValue(BigNumber.from('1000000000000000000')),
      getTransactionCount: jest.fn().mockResolvedValue(1),
      getGasPrice: jest.fn().mockResolvedValue(BigNumber.from('20000000000')),
      estimateGas: jest.fn().mockResolvedValue(BigNumber.from('21000'))
    }))
  },
  BigNumber: {
    from: jest.fn(value => ({ value }))
  },
  utils: {
    keccak256: jest.fn().mockReturnValue('0xhash')
  }
}));

describe('MantleWallet', () => {
  let wallet: MantleWallet;

  beforeEach(() => {
    // Reset the singleton instances before each test
    (MantleWallet as any).instance = null;
    (MantleConfigManager as any).instance = null;
    (MantleConnectionManager as any).instance = null;
    
    // Mock window.ethereum
    (window as any).ethereum = mockEthereum;
    
    wallet = MantleWallet.getInstance();
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete (window as any).ethereum;
  });

  test('getInstance returns singleton instance', () => {
    const instance1 = MantleWallet.getInstance();
    const instance2 = MantleWallet.getInstance();
    expect(instance1).toBe(instance2);
  });

  test('connect with private key creates wallet', async () => {
    const privateKey = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    const connection = await wallet.connect(privateKey);
    
    expect(connection.address).toBe('0x1234567890123456789012345678901234567890');
    expect(connection.chainId).toBe(5001);
    expect(connection.isConnected).toBe(true);
    expect(connection.balance.value).toBe('1000000000000000000');
  });

  test('connect with browser wallet requests accounts', async () => {
    mockEthereum.request
      .mockResolvedValueOnce([]) // eth_requestAccounts
      .mockResolvedValueOnce(['0x1234567890123456789012345678901234567890']); // eth_accounts
    
    const connection = await wallet.connect();
    
    expect(mockEthereum.request).toHaveBeenCalledWith({ method: 'eth_requestAccounts' });
    expect(connection.address).toBe('0x1234567890123456789012345678901234567890');
  });

  test('disconnect clears wallet state', async () => {
    await wallet.connect('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
    await wallet.disconnect();
    
    expect(wallet.isConnected()).toBe(false);
    expect(wallet.getAddress()).toBeNull();
  });

  test('sign transaction with complete parameters', async () => {
    await wallet.connect('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
    
    const transaction = {
      to: '0x9876543210987654321098765432109876543210',
      value: BigNumber.from('1000000000000000000'),
      data: '0x',
      nonce: 1,
      gasLimit: BigNumber.from('21000'),
      gasPrice: BigNumber.from('20000000000')
    };

    const signed = await wallet.sign(transaction);
    
    expect(signed.hash).toBe('0xhash');
    expect(signed.data).toBe('0xsignedtx');
    expect(signed.signature).toBe('signedtx');
  });

  test('sign transaction with minimal parameters', async () => {
    await wallet.connect('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
    
    const transaction = {
      to: '0x9876543210987654321098765432109876543210',
      value: BigNumber.from('1000000000000000000')
    };

    const signed = await wallet.sign(transaction);
    
    expect(signed.hash).toBe('0xhash');
    expect(signed.data).toBe('0xsignedtx');
  });

  test('getAccounts returns connected wallet address', async () => {
    await wallet.connect('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
    
    const accounts = await wallet.getAccounts();
    expect(accounts).toHaveLength(1);
    expect(accounts[0]).toBe('0x1234567890123456789012345678901234567890');
  });

  test('getBalance returns wallet balance', async () => {
    await wallet.connect('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
    
    const balance = await wallet.getBalance();
    expect(balance.value).toBe('1000000000000000000');
  });

  test('handles missing ethereum provider', async () => {
    delete (window as any).ethereum;
    
    await expect(wallet.connect())
      .rejects
      .toThrow('No Ethereum wallet found');
  });

  test('handles transaction signing without connection', async () => {
    await expect(wallet.sign({
      to: '0x9876543210987654321098765432109876543210',
      value: BigNumber.from('1000000000000000000')
    })).rejects.toThrow('Wallet not connected');
  });
}); 