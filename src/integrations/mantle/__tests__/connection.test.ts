import { describe, expect, test, jest, beforeEach, afterEach } from '@jest/globals';
import { MantleConnectionManager } from '../connection';
import { MantleConfigManager, MANTLE_NETWORKS } from '../config';
import { providers } from 'ethers';

// Mock the provider
jest.mock('ethers', () => ({
  providers: {
    JsonRpcProvider: jest.fn().mockImplementation(() => ({
      ready: Promise.resolve(),
      getNetwork: () => Promise.resolve({ chainId: MANTLE_NETWORKS.TESTNET.chainId }),
      on: jest.fn(),
      removeAllListeners: jest.fn(),
    }))
  }
}));

describe('MantleConnectionManager', () => {
  let connectionManager: MantleConnectionManager;

  beforeEach(() => {
    // Reset the singleton instance before each test
    (MantleConnectionManager as any).instance = null;
    (MantleConfigManager as any).instance = null;
    
    connectionManager = MantleConnectionManager.getInstance();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('getInstance returns singleton instance', () => {
    const instance1 = MantleConnectionManager.getInstance();
    const instance2 = MantleConnectionManager.getInstance();
    expect(instance1).toBe(instance2);
  });

  test('connect initializes provider and sets up event listeners', async () => {
    const result = await connectionManager.connect();
    expect(result).toBe(true);
    
    const provider = connectionManager.getProvider();
    expect(provider.on).toHaveBeenCalledWith('network', expect.any(Function));
    expect(provider.on).toHaveBeenCalledWith('error', expect.any(Function));
  });

  test('disconnect removes event listeners', async () => {
    await connectionManager.connect();
    await connectionManager.disconnect();
    
    const provider = connectionManager.getProvider();
    expect(provider.removeAllListeners).toHaveBeenCalled();
  });

  test('switchNetwork changes network and reconnects', async () => {
    const switchSpy = jest.spyOn(connectionManager, 'connect');
    await connectionManager.switchNetwork('MAINNET');
    
    expect(switchSpy).toHaveBeenCalled();
    expect(connectionManager.getNetwork().chainId).toBe(MANTLE_NETWORKS.MAINNET.chainId);
  });

  test('getNetwork returns correct network info', () => {
    const networkInfo = connectionManager.getNetwork();
    expect(networkInfo).toEqual({
      chainId: MANTLE_NETWORKS.TESTNET.chainId,
      name: 'Mantle Testnet',
      rpcUrl: MANTLE_NETWORKS.TESTNET.rpcUrl
    });
  });

  test('event subscription system works correctly', () => {
    const mockHandler = jest.fn();
    const eventName = 'test';

    connectionManager.subscribeToEvents(eventName, mockHandler);
    
    // Simulate an event
    const eventHandlers = (connectionManager as any).eventHandlers.get(eventName);
    eventHandlers[0]({ type: 'test' });

    expect(mockHandler).toHaveBeenCalledWith({ type: 'test' });

    // Test unsubscribe
    connectionManager.unsubscribeFromEvents(eventName, mockHandler);
    const handlersAfterUnsubscribe = (connectionManager as any).eventHandlers.get(eventName);
    expect(handlersAfterUnsubscribe).toHaveLength(0);
  });

  test('handles connection errors with retry mechanism', async () => {
    // Mock a failing provider
    (providers.JsonRpcProvider as jest.Mock).mockImplementationOnce(() => ({
      ready: Promise.reject(new Error('Connection failed')),
      on: jest.fn(),
    }));

    const errorHandler = jest.fn();
    connectionManager.subscribeToEvents('error', errorHandler);

    const result = await connectionManager.connect();
    expect(result).toBe(false);
    
    // Should have attempted to reconnect
    expect((connectionManager as any).reconnectAttempts).toBeGreaterThan(0);
  });
}); 