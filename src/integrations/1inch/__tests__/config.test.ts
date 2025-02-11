import { describe, expect, test, jest, beforeEach } from '@jest/globals';
import { OneinchConfigManager, ONEINCH_DEFAULTS } from '../config';
import { providers } from 'ethers';

describe('OneinchConfigManager', () => {
  let configManager: OneinchConfigManager;
  let mockProvider: jest.Mocked<providers.Provider>;

  beforeEach(() => {
    // Reset singleton instance
    (OneinchConfigManager as any).instance = null;
    
    // Mock environment variable
    process.env.VITE_ONEINCH_API_KEY = 'test-api-key';
    
    // Create mock provider
    mockProvider = {
      getNetwork: jest.fn().mockResolvedValue({ chainId: 1 })
    } as unknown as jest.Mocked<providers.Provider>;
    
    configManager = OneinchConfigManager.getInstance();
  });

  test('getInstance returns singleton instance', () => {
    const instance1 = OneinchConfigManager.getInstance();
    const instance2 = OneinchConfigManager.getInstance();
    expect(instance1).toBe(instance2);
  });

  test('initialize with default config', async () => {
    await configManager.initialize(mockProvider);
    const config = configManager.getConfig();
    
    expect(config.apiKey).toBe('test-api-key');
    expect(config.fusionApiUrl).toBe(ONEINCH_DEFAULTS.fusionApiUrl);
    expect(config.supportedNetworks).toEqual(ONEINCH_DEFAULTS.supportedNetworks);
    expect(config.defaultSlippage).toBe(ONEINCH_DEFAULTS.defaultSlippage);
    expect(config.defaultGasLimit).toBe(ONEINCH_DEFAULTS.defaultGasLimit);
    expect(config.defaultTTL).toBe(ONEINCH_DEFAULTS.defaultTTL);
  });

  test('initialize with custom config', async () => {
    const customConfig = {
      apiKey: 'custom-api-key',
      supportedNetworks: [1, 137],
      defaultSlippage: 0.5,
      defaultGasLimit: 300000,
      defaultTTL: 300
    };

    await configManager.initialize(mockProvider, customConfig);
    const config = configManager.getConfig();
    
    expect(config.apiKey).toBe(customConfig.apiKey);
    expect(config.supportedNetworks).toEqual(customConfig.supportedNetworks);
    expect(config.defaultSlippage).toBe(customConfig.defaultSlippage);
    expect(config.defaultGasLimit).toBe(customConfig.defaultGasLimit);
    expect(config.defaultTTL).toBe(customConfig.defaultTTL);
  });

  test('getProvider returns initialized provider', async () => {
    await configManager.initialize(mockProvider);
    expect(configManager.getProvider()).toBe(mockProvider);
  });

  test('isSupportedNetwork returns correct value', async () => {
    await configManager.initialize(mockProvider);
    
    expect(configManager.isSupportedNetwork(1)).toBe(true);     // Ethereum
    expect(configManager.isSupportedNetwork(137)).toBe(true);   // Polygon
    expect(configManager.isSupportedNetwork(999999)).toBe(false); // Unknown chain
  });

  test('getFusionApiUrl returns correct URL', async () => {
    await configManager.initialize(mockProvider);
    
    const url = configManager.getFusionApiUrl(1);
    expect(url).toBe('https://fusion.1inch.io/v1.0/1');
  });

  test('validates API key requirement', async () => {
    delete process.env.VITE_ONEINCH_API_KEY;
    configManager = OneinchConfigManager.getInstance();
    
    await expect(configManager.initialize(mockProvider, {
      apiKey: ''
    })).rejects.toThrow('1inch API key is required');
  });

  test('validates supported networks requirement', async () => {
    await expect(configManager.initialize(mockProvider, {
      supportedNetworks: []
    })).rejects.toThrow('At least one supported network must be specified');
  });

  test('validates slippage range', async () => {
    await expect(configManager.initialize(mockProvider, {
      defaultSlippage: -1
    })).rejects.toThrow('Default slippage must be between 0 and 50');

    await expect(configManager.initialize(mockProvider, {
      defaultSlippage: 51
    })).rejects.toThrow('Default slippage must be between 0 and 50');
  });

  test('validates gas limit minimum', async () => {
    await expect(configManager.initialize(mockProvider, {
      defaultGasLimit: 20000
    })).rejects.toThrow('Default gas limit must be at least 21000');
  });

  test('validates TTL range', async () => {
    await expect(configManager.initialize(mockProvider, {
      defaultTTL: 30
    })).rejects.toThrow('Default TTL must be between 60 and 3600 seconds');

    await expect(configManager.initialize(mockProvider, {
      defaultTTL: 4000
    })).rejects.toThrow('Default TTL must be between 60 and 3600 seconds');
  });

  test('handles unsupported network', async () => {
    mockProvider.getNetwork.mockResolvedValueOnce({ chainId: 999999 });
    
    await expect(configManager.initialize(mockProvider))
      .rejects.toThrow('Network 999999 is not supported by 1inch Fusion');
  });

  test('handles provider not initialized error', () => {
    expect(() => configManager.getProvider())
      .toThrow('Provider not initialized');
  });

  test('handles getFusionApiUrl with unsupported network', async () => {
    await configManager.initialize(mockProvider);
    
    expect(() => configManager.getFusionApiUrl(999999))
      .toThrow('Network 999999 is not supported by 1inch Fusion');
  });
}); 