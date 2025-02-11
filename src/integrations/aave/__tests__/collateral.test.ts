import { describe, expect, test, jest, beforeEach } from '@jest/globals';
import { CollateralManager } from '../collateral';
import { AaveConfigManager } from '../config';
import { Pool } from '@aave/contract-helpers';
import { providers, BigNumber, constants } from 'ethers';

// Mock the Pool class
jest.mock('@aave/contract-helpers', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    getReservesData: jest.fn().mockResolvedValue([{
      underlyingAsset: '0x1234',
      symbol: 'TEST',
      decimals: 18,
      baseLTVasCollateral: 8000, // 80%
      reserveLiquidationThreshold: 8500, // 85%
      reserveLiquidationBonus: 500, // 5%
      supplyAPY: '50000000000000000', // 5%
      isActive: true
    }]),
    getUserAccountData: jest.fn().mockResolvedValue({
      totalCollateralETH: BigNumber.from('2000000000000000000'),
      totalDebtETH: BigNumber.from('1000000000000000000'),
      availableBorrowsETH: BigNumber.from('500000000000000000'),
      currentLiquidationThreshold: 8500,
      ltv: 8000,
      healthFactor: BigNumber.from('1500000000000000000')
    }),
    getUserReservesData: jest.fn().mockResolvedValue([{
      underlyingAsset: '0x1234',
      scaledATokenBalance: '1000000000000000000',
      usageAsCollateralEnabledOnUser: true,
      reserve: {
        symbol: 'TEST',
        decimals: 18,
        baseLTVasCollateral: 8000,
        reserveLiquidationThreshold: 8500,
        reserveLiquidationBonus: 500,
        supplyAPY: '50000000000000000',
        isActive: true,
        priceInMarketReferenceCurrency: BigNumber.from('2000000000000000000')
      }
    }]),
    getReserveData: jest.fn().mockResolvedValue({
      priceInEth: BigNumber.from('2000000000000000000')
    }),
    setUsageAsCollateral: jest.fn().mockResolvedValue([{
      tx: jest.fn().mockResolvedValue({
        to: '0x1234',
        data: '0x5678'
      })
    }])
  }))
}));

describe('CollateralManager', () => {
  let collateralManager: CollateralManager;
  let mockProvider: jest.Mocked<providers.Provider>;

  beforeEach(() => {
    // Reset singleton instances
    (CollateralManager as any).instance = null;
    (AaveConfigManager as any).instance = null;

    // Create mock provider
    mockProvider = {
      getNetwork: jest.fn().mockResolvedValue({ chainId: 1 }),
      getSigner: jest.fn().mockReturnValue({
        sendTransaction: jest.fn().mockResolvedValue({
          hash: '0xtxhash',
          wait: jest.fn().mockResolvedValue({})
        })
      })
    } as unknown as jest.Mocked<providers.Provider>;

    // Mock AaveConfigManager
    (AaveConfigManager as any).prototype.getConfig = jest.fn().mockReturnValue({
      supportedNetworks: [1, 137]
    });
    (AaveConfigManager as any).prototype.getPool = jest.fn().mockReturnValue(new Pool(mockProvider, {}));
    (AaveConfigManager as any).prototype.getProvider = jest.fn().mockReturnValue(mockProvider);

    collateralManager = CollateralManager.getInstance();
  });

  test('getInstance returns singleton instance', () => {
    const instance1 = CollateralManager.getInstance();
    const instance2 = CollateralManager.getInstance();
    expect(instance1).toBe(instance2);
  });

  test('initialize creates pools for supported networks', async () => {
    await collateralManager.initialize();
    expect(AaveConfigManager.prototype.getPool).toHaveBeenCalledTimes(2);
  });

  test('getCollateralAssets returns formatted assets', async () => {
    await collateralManager.initialize();
    const assets = await collateralManager.getCollateralAssets(1);
    
    expect(assets).toHaveLength(1);
    expect(assets[0]).toEqual({
      tokenAddress: '0x1234',
      symbol: 'TEST',
      decimals: 18,
      ltv: 8000,
      liquidationThreshold: 8500,
      liquidationPenalty: 500,
      supplyAPY: '50000000000000000',
      isActive: true
    });
  });

  test('getUserCollateral returns user collateral data', async () => {
    await collateralManager.initialize();
    const collateral = await collateralManager.getUserCollateral(1, '0xuser');
    
    expect(collateral).toHaveLength(1);
    expect(collateral[0].asset.tokenAddress).toBe('0x1234');
    expect(collateral[0].isCollateral).toBe(true);
    expect(collateral[0].healthFactor).toBeDefined();
  });

  test('enableCollateral submits transaction', async () => {
    await collateralManager.initialize();
    const tx = await collateralManager.enableCollateral(1, '0xuser', '0x1234');
    
    expect(tx.hash).toBe('0xtxhash');
  });

  test('disableCollateral checks health factor', async () => {
    await collateralManager.initialize();
    
    // Mock low health factor
    const pool = new Pool(mockProvider, {});
    (pool.getUserAccountData as jest.Mock).mockResolvedValueOnce({
      healthFactor: BigNumber.from('900000000000000000') // 0.9
    });
    (AaveConfigManager.prototype.getPool as jest.Mock).mockReturnValueOnce(pool);

    await expect(collateralManager.disableCollateral(1, '0xuser', '0x1234'))
      .rejects.toThrow('Cannot disable collateral: health factor too low');
  });

  test('getMaxBorrowAmount calculates correct amount', async () => {
    await collateralManager.initialize();
    const amount = await collateralManager.getMaxBorrowAmount(1, '0xuser', '0x1234');
    
    // 0.5 ETH * 1e18 / 2 ETH = 0.25e18
    expect(amount).toEqual(BigNumber.from('250000000000000000'));
  });

  test('handles uninitialized pool error', async () => {
    await expect(collateralManager.getCollateralAssets(999))
      .rejects.toThrow('No pool initialized for network 999');
  });
}); 