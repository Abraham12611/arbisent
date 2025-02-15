import { describe, expect, test, jest, beforeEach, afterEach } from '@jest/globals';
import { CrossMintConfigManager, CROSSMINT_DEFAULTS } from '../config';
import { providers } from 'ethers';

// Mock the JsonRpcProvider
jest.mock('ethers', () => ({
  providers: {
    JsonRpcProvider: jest.fn().mockImplementation(() => ({
      ready: Promise.resolve()
    }))
  }
}));

describe('CrossMintConfigManager', () => {
  let configManager: CrossMintConfigManager;

  beforeEach(() => {
    // Reset singleton instance
    (CrossMintConfigManager as any).instance = null;
    
    // Mock environment variable
    process.env.VITE_CROSSMINT_API_KEY = 'test-api-key';
    
    configManager = CrossMintConfigManager.getInstance();
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.VITE_CROSSMINT_API_KEY;
  });

  test('getInstance returns singleton instance', () => {
    const instance1 = CrossMintConfigManager.getInstance();
    const instance2 = CrossMintConfigManager.getInstance();
    expect(instance1).toBe(instance2);
  });

  test('initialize with default config', async () => {
    await configManager.initialize();
    const config = configManager.getConfig();
    
    expect(config.apiKey).toBe('test-api-key');
    expect(config.environment).toBe(CROSSMINT_DEFAULTS.environment);
    expect(config.supportedChains).toEqual(CROSSMINT_DEFAULTS.supportedChains);
    expect(config.defaultGasLimit).toBe(CROSSMINT_DEFAULTS.defaultGasLimit);
    expect(config.defaultSlippage).toBe(CROSSMINT_DEFAULTS.defaultSlippage);
  });

  test('initialize with custom config', async () => {
    const customConfig = {
      apiKey: 'custom-api-key',
      environment: 'production' as const,
      supportedChains: [1, 137],
      defaultGasLimit: 300000,
      defaultSlippage: 1.0
    };

    await configManager.initialize(customConfig);
    const config = configManager.getConfig();
    
    expect(config.apiKey).toBe(customConfig.apiKey);
    expect(config.environment).toBe(customConfig.environment);
    expect(config.supportedChains).toEqual(customConfig.supportedChains);
    expect(config.defaultGasLimit).toBe(customConfig.defaultGasLimit);
    expect(config.defaultSlippage).toBe(customConfig.defaultSlippage);
  });

  test('getProvider returns initialized provider', async () => {
    await configManager.initialize();
    const provider = configManager.getProvider();
    expect(provider).toBeDefined();
    expect(providers.JsonRpcProvider).toHaveBeenCalled();
  });

  test('isSupportedChain returns correct value', async () => {
    await configManager.initialize();
    
    expect(configManager.isSupportedChain(1)).toBe(true); // Ethereum
    expect(configManager.isSupportedChain(5000)).toBe(true); // Mantle
    expect(configManager.isSupportedChain(999999)).toBe(false); // Unknown chain
  });

  test('validates API key requirement', async () => {
    delete process.env.VITE_CROSSMINT_API_KEY;
    configManager = CrossMintConfigManager.getInstance();
    
    await expect(configManager.initialize({
      apiKey: ''
    })).rejects.toThrow('CrossMint API key is required');
  });

  test('validates supported chains requirement', async () => {
    await expect(configManager.initialize({
      supportedChains: []
    })).rejects.toThrow('At least one supported chain must be specified');
  });

  test('validates slippage range', async () => {
    await expect(configManager.initialize({
      defaultSlippage: -1
    })).rejects.toThrow('Default slippage must be between 0 and 100');

    await expect(configManager.initialize({
      defaultSlippage: 101
    })).rejects.toThrow('Default slippage must be between 0 and 100');
  });

  test('validates gas limit minimum', async () => {
    await expect(configManager.initialize({
      defaultGasLimit: 20000
    })).rejects.toThrow('Default gas limit must be at least 21000');
  });

  test('handles provider initialization failure', async () => {
    // Mock provider to throw
    (providers.JsonRpcProvider as jest.Mock).mockImplementationOnce(() => ({
      ready: Promise.reject(new Error('Provider initialization failed'))
    }));

    await expect(configManager.initialize())
      .rejects.toThrow('Provider initialization failed');
  });
}); 