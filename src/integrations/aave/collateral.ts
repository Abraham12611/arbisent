import { Pool, EthereumTransactionTypeExtended, InterestRate } from '@aave/contract-helpers';
import { providers, BigNumber, constants } from 'ethers';
import { AaveConfigManager } from './config';
import { toast } from 'sonner';

export interface CollateralAsset {
  tokenAddress: string;
  symbol: string;
  decimals: number;
  ltv: number;
  liquidationThreshold: number;
  liquidationPenalty: number;
  supplyAPY: number;
  isActive: boolean;
}

export interface UserCollateral {
  asset: CollateralAsset;
  amount: BigNumber;
  amountUSD: BigNumber;
  healthFactor: BigNumber;
  isCollateral: boolean;
}

export class CollateralManager {
  private static instance: CollateralManager;
  private configManager: AaveConfigManager;
  private pools: Map<number, Pool>;

  private constructor() {
    this.configManager = AaveConfigManager.getInstance();
    this.pools = new Map();
  }

  static getInstance(): CollateralManager {
    if (!CollateralManager.instance) {
      CollateralManager.instance = new CollateralManager();
    }
    return CollateralManager.instance;
  }

  async initialize(): Promise<void> {
    try {
      console.log('Initializing collateral manager...');
      
      // Get pools for each supported network
      const config = this.configManager.getConfig();
      for (const networkId of config.supportedNetworks) {
        const pool = this.configManager.getPool(networkId);
        this.pools.set(networkId, pool);
      }

      console.log('Collateral manager initialized successfully');
    } catch (error) {
      console.error('Error initializing collateral manager:', error);
      throw error;
    }
  }

  async getCollateralAssets(networkId: number): Promise<CollateralAsset[]> {
    try {
      const pool = this.getPool(networkId);
      const provider = this.configManager.getProvider();
      
      // Get reserve data from pool
      const reserves = await pool.getReservesData();
      
      return reserves.map(reserve => ({
        tokenAddress: reserve.underlyingAsset,
        symbol: reserve.symbol,
        decimals: reserve.decimals,
        ltv: reserve.baseLTVasCollateral,
        liquidationThreshold: reserve.reserveLiquidationThreshold,
        liquidationPenalty: reserve.reserveLiquidationBonus,
        supplyAPY: reserve.supplyAPY,
        isActive: reserve.isActive
      }));
    } catch (error) {
      console.error('Error getting collateral assets:', error);
      throw error;
    }
  }

  async getUserCollateral(networkId: number, userAddress: string): Promise<UserCollateral[]> {
    try {
      const pool = this.getPool(networkId);
      
      // Get user account data
      const accountData = await pool.getUserAccountData({
        user: userAddress
      });
      
      // Get user deposits
      const userReserves = await pool.getUserReservesData({
        user: userAddress
      });

      return userReserves.map(reserve => ({
        asset: {
          tokenAddress: reserve.underlyingAsset,
          symbol: reserve.reserve.symbol,
          decimals: reserve.reserve.decimals,
          ltv: reserve.reserve.baseLTVasCollateral,
          liquidationThreshold: reserve.reserve.reserveLiquidationThreshold,
          liquidationPenalty: reserve.reserve.reserveLiquidationBonus,
          supplyAPY: reserve.reserve.supplyAPY,
          isActive: reserve.reserve.isActive
        },
        amount: BigNumber.from(reserve.scaledATokenBalance),
        amountUSD: this.calculateUSDValue(
          reserve.scaledATokenBalance,
          reserve.reserve.priceInMarketReferenceCurrency,
          reserve.reserve.decimals
        ),
        healthFactor: accountData.healthFactor,
        isCollateral: reserve.usageAsCollateralEnabledOnUser
      }));
    } catch (error) {
      console.error('Error getting user collateral:', error);
      throw error;
    }
  }

  async enableCollateral(
    networkId: number,
    userAddress: string,
    tokenAddress: string
  ): Promise<providers.TransactionResponse> {
    try {
      const pool = this.getPool(networkId);
      
      // Prepare enable collateral transaction
      const txs: EthereumTransactionTypeExtended[] = await pool.setUsageAsCollateral({
        user: userAddress,
        reserve: tokenAddress,
        usageAsCollateral: true
      });

      // Submit transaction
      const provider = this.configManager.getProvider();
      const extendedTxData = await txs[0].tx();
      const signer = provider.getSigner(userAddress);
      const tx = await signer.sendTransaction(extendedTxData);

      console.log('Collateral enabled successfully');
      toast.success('Asset enabled as collateral');
      
      return tx;
    } catch (error) {
      console.error('Error enabling collateral:', error);
      toast.error('Failed to enable collateral');
      throw error;
    }
  }

  async disableCollateral(
    networkId: number,
    userAddress: string,
    tokenAddress: string
  ): Promise<providers.TransactionResponse> {
    try {
      const pool = this.getPool(networkId);
      
      // Check if disabling is safe
      const accountData = await pool.getUserAccountData({
        user: userAddress
      });

      if (accountData.healthFactor.lt(constants.WeiPerEther)) {
        throw new Error('Cannot disable collateral: health factor too low');
      }

      // Prepare disable collateral transaction
      const txs: EthereumTransactionTypeExtended[] = await pool.setUsageAsCollateral({
        user: userAddress,
        reserve: tokenAddress,
        usageAsCollateral: false
      });

      // Submit transaction
      const provider = this.configManager.getProvider();
      const extendedTxData = await txs[0].tx();
      const signer = provider.getSigner(userAddress);
      const tx = await signer.sendTransaction(extendedTxData);

      console.log('Collateral disabled successfully');
      toast.success('Asset disabled as collateral');
      
      return tx;
    } catch (error) {
      console.error('Error disabling collateral:', error);
      toast.error('Failed to disable collateral');
      throw error;
    }
  }

  async getMaxBorrowAmount(
    networkId: number,
    userAddress: string,
    tokenAddress: string
  ): Promise<BigNumber> {
    try {
      const pool = this.getPool(networkId);
      
      // Get user account data and reserve data
      const [accountData, reserveData] = await Promise.all([
        pool.getUserAccountData({
          user: userAddress
        }),
        pool.getReserveData({
          reserve: tokenAddress
        })
      ]);

      // Calculate max borrow amount based on collateral and health factor
      const availableBorrowsETH = accountData.availableBorrowsETH;
      const priceInETH = reserveData.priceInEth;
      
      return availableBorrowsETH.mul(constants.WeiPerEther).div(priceInETH);
    } catch (error) {
      console.error('Error calculating max borrow amount:', error);
      throw error;
    }
  }

  private getPool(networkId: number): Pool {
    const pool = this.pools.get(networkId);
    if (!pool) {
      throw new Error(`No pool initialized for network ${networkId}`);
    }
    return pool;
  }

  private calculateUSDValue(
    amount: BigNumber,
    priceInMarketReferenceCurrency: BigNumber,
    decimals: number
  ): BigNumber {
    return amount
      .mul(priceInMarketReferenceCurrency)
      .div(BigNumber.from(10).pow(decimals));
  }
} 