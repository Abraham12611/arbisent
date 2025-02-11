import { describe, expect, test, jest, beforeEach } from '@jest/globals';
import { AaveConfigManager, AAVE_DEFAULTS } from '../config';
import { Pool, InterestRate } from '@aave/contract-helpers';
import { providers } from 'ethers';

// Mock the Pool class
jest.mock('@aave/contract-helpers', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    // Add mock methods as needed
  })),
  InterestRate: {
    Variable: 2,
    Stable: 1,
    None: 0
  }
}));

describe('AaveConfigManager', () => {
  let configManager: AaveConfigManager;
  let mockProvider: jest.Mocked<providers.Provider>;

  beforeEach(() => {
    // Reset singleton instance
    (AaveConfigManager as any).instance = null;

    // Create mock provider
    mockProvider = {
      getNetwork: jest.fn().mockResolvedValue({ chainId: 1 }),
      getSigner: jest.fn(),
      // Add other required provider methods
    } as unknown as jest.Mocked<providers.Provider>;

    configManager = AaveConfigManager.getInstance();
  });

  test('getInstance returns singleton instance', () => {
    const instance1 = AaveConfigManager.getInstance();
    const instance2 = AaveConfigManager.getInstance();
    expect(instance1).toBe(instance2);
  });

  test('initialize with default config', async () => {
    await configManager.initialize(mockProvider);
    const config = configManager.getConfig();
    expect(config).toEqual(AAVE_DEFAULTS);
    expect(Pool).toHaveBeenCalledTimes(AAVE_DEFAULTS.supportedNetworks.length);
  });

  test('initialize with custom config', async () => {
    const customConfig = {
      marketAddress: '0x1234567890123456789012345678901234567890',
      supportedNetworks: [1, 137]
    };

    await configManager.initialize(mockProvider, customConfig);
    const config = configManager.getConfig();
    expect(config.marketAddress).toBe(customConfig.marketAddress);
    expect(config.supportedNetworks).toEqual(customConfig.supportedNetworks);
    expect(Pool).toHaveBeenCalledTimes(customConfig.supportedNetworks.length);
  });

  test('getPool returns pool for supported network', async () => {
    await configManager.initialize(mockProvider);
    expect(() => configManager.getPool(1)).not.toThrow();
  });

  test('getPool throws error for unsupported network', async () => {
    await configManager.initialize(mockProvider);
    expect(() => configManager.getPool(999)).toThrow('No Aave pool initialized for network 999');
  });

  test('getProvider returns initialized provider', async () => {
    await configManager.initialize(mockProvider);
    expect(configManager.getProvider()).toBe(mockProvider);
  });

  test('getProvider throws error when not initialized', () => {
    expect(() => configManager.getProvider()).toThrow('Provider not initialized');
  });

  test('validates market address', async () => {
    const invalidConfig = {
      marketAddress: 'invalid-address'
    };

    await expect(configManager.initialize(mockProvider, invalidConfig))
      .rejects.toThrow('Invalid market address');
  });

  test('validates WETH gateway address', async () => {
    const invalidConfig = {
      wethGatewayAddress: 'invalid-address'
    };

    await expect(configManager.initialize(mockProvider, invalidConfig))
      .rejects.toThrow('Invalid WETH gateway address');
  });

  test('validates lending pool address', async () => {
    const invalidConfig = {
      lendingPoolAddress: 'invalid-address'
    };

    await expect(configManager.initialize(mockProvider, invalidConfig))
      .rejects.toThrow('Invalid lending pool address');
  });

  test('validates data provider address', async () => {
    const invalidConfig = {
      dataProviderAddress: 'invalid-address'
    };

    await expect(configManager.initialize(mockProvider, invalidConfig))
      .rejects.toThrow('Invalid data provider address');
  });

  test('validates supported networks', async () => {
    const invalidConfig = {
      supportedNetworks: []
    };

    await expect(configManager.initialize(mockProvider, invalidConfig))
      .rejects.toThrow('No supported networks specified');
  });
}); 