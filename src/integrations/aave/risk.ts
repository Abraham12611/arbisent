import { Pool, EthereumTransactionTypeExtended, InterestRate } from '@aave/contract-helpers';
import { providers, BigNumber, constants } from 'ethers';
import { AaveConfigManager } from './config';
import { CollateralManager } from './collateral';
import { toast } from 'sonner';

export interface FlashLoanRisk {
  riskScore: number;  // 0-100, where 100 is highest risk
  maxLoanAmount: BigNumber;
  recommendedCollateral: BigNumber;
  estimatedGasCost: BigNumber;
  warnings: string[];
  isViable: boolean;
}

export interface MarketCondition {
  totalLiquidity: BigNumber;
  utilizationRate: number;
  volatility24h: number;
  averageTransactionSize: BigNumber;
}

export class RiskAssessmentService {
  private static instance: RiskAssessmentService;
  private configManager: AaveConfigManager;
  private collateralManager: CollateralManager;
  private pools: Map<number, Pool>;
  private marketConditions: Map<string, MarketCondition>;

  private constructor() {
    this.configManager = AaveConfigManager.getInstance();
    this.collateralManager = CollateralManager.getInstance();
    this.pools = new Map();
    this.marketConditions = new Map();
  }

  static getInstance(): RiskAssessmentService {
    if (!RiskAssessmentService.instance) {
      RiskAssessmentService.instance = new RiskAssessmentService();
    }
    return RiskAssessmentService.instance;
  }

  async initialize(): Promise<void> {
    try {
      console.log('Initializing risk assessment service...');
      
      // Initialize pools for each supported network
      const config = this.configManager.getConfig();
      for (const networkId of config.supportedNetworks) {
        const pool = this.configManager.getPool(networkId);
        this.pools.set(networkId, pool);
      }

      // Initialize collateral manager
      await this.collateralManager.initialize();

      console.log('Risk assessment service initialized successfully');
    } catch (error) {
      console.error('Error initializing risk assessment service:', error);
      throw error;
    }
  }

  async assessFlashLoanRisk(
    networkId: number,
    tokenAddress: string,
    amount: BigNumber,
    userAddress: string
  ): Promise<FlashLoanRisk> {
    try {
      const pool = this.getPool(networkId);
      const warnings: string[] = [];

      // Get market conditions
      const marketCondition = await this.getMarketCondition(networkId, tokenAddress);
      
      // Get user's collateral data
      const userCollateral = await this.collateralManager.getUserCollateral(networkId, userAddress);
      const totalCollateralUSD = userCollateral.reduce(
        (sum, col) => sum.add(col.amountUSD),
        BigNumber.from(0)
      );

      // Calculate risk factors
      const utilizationRisk = this.calculateUtilizationRisk(marketCondition.utilizationRate);
      const volatilityRisk = this.calculateVolatilityRisk(marketCondition.volatility24h);
      const sizingRisk = this.calculateSizingRisk(amount, marketCondition.averageTransactionSize);
      const collateralRisk = this.calculateCollateralRisk(amount, totalCollateralUSD);

      // Calculate overall risk score (weighted average)
      const riskScore = Math.round(
        utilizationRisk * 0.3 +
        volatilityRisk * 0.3 +
        sizingRisk * 0.2 +
        collateralRisk * 0.2
      );

      // Add warnings based on risk factors
      if (utilizationRisk > 70) {
        warnings.push('High pool utilization may lead to increased costs');
      }
      if (volatilityRisk > 70) {
        warnings.push('High market volatility detected');
      }
      if (sizingRisk > 70) {
        warnings.push('Loan size significantly above average');
      }
      if (collateralRisk > 70) {
        warnings.push('Consider increasing collateral');
      }

      // Calculate recommended collateral (150% of loan amount)
      const recommendedCollateral = amount.mul(150).div(100);

      // Estimate gas cost
      const gasPrice = await this.configManager.getProvider().getGasPrice();
      const estimatedGas = BigNumber.from(300000); // Base estimate for flash loan
      const estimatedGasCost = gasPrice.mul(estimatedGas);

      // Determine if flash loan is viable
      const isViable = riskScore < 80 && 
                      marketCondition.totalLiquidity.gt(amount) &&
                      marketCondition.utilizationRate < 0.95;

      // Get max loan amount (80% of total liquidity)
      const maxLoanAmount = marketCondition.totalLiquidity.mul(80).div(100);

      return {
        riskScore,
        maxLoanAmount,
        recommendedCollateral,
        estimatedGasCost,
        warnings,
        isViable
      };
    } catch (error) {
      console.error('Error assessing flash loan risk:', error);
      throw error;
    }
  }

  private async getMarketCondition(
    networkId: number,
    tokenAddress: string
  ): Promise<MarketCondition> {
    try {
      const pool = this.getPool(networkId);
      const reserveData = await pool.getReserveData(tokenAddress);

      // Calculate utilization rate
      const totalLiquidity = BigNumber.from(reserveData.availableLiquidity);
      const totalBorrowed = BigNumber.from(reserveData.totalStableDebt).add(reserveData.totalVariableDebt);
      const utilizationRate = totalBorrowed.mul(100).div(totalLiquidity.add(totalBorrowed)).toNumber() / 100;

      // Get market condition from cache or calculate
      const cacheKey = `${networkId}-${tokenAddress}`;
      if (!this.marketConditions.has(cacheKey)) {
        this.marketConditions.set(cacheKey, {
          totalLiquidity,
          utilizationRate,
          volatility24h: await this.calculateVolatility(networkId, tokenAddress),
          averageTransactionSize: await this.calculateAverageTransactionSize(networkId, tokenAddress)
        });
      }

      return this.marketConditions.get(cacheKey)!;
    } catch (error) {
      console.error('Error getting market condition:', error);
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

  private calculateUtilizationRisk(utilizationRate: number): number {
    // Higher utilization = higher risk
    // 0-50% -> low risk, 50-80% -> medium risk, 80-100% -> high risk
    if (utilizationRate < 0.5) return utilizationRate * 100;
    if (utilizationRate < 0.8) return 50 + (utilizationRate - 0.5) * 200;
    return 80 + (utilizationRate - 0.8) * 100;
  }

  private calculateVolatilityRisk(volatility24h: number): number {
    // Higher volatility = higher risk
    // <2% -> low risk, 2-5% -> medium risk, >5% -> high risk
    if (volatility24h < 2) return volatility24h * 25;
    if (volatility24h < 5) return 50 + (volatility24h - 2) * 10;
    return 80 + (volatility24h - 5) * 4;
  }

  private calculateSizingRisk(amount: BigNumber, avgSize: BigNumber): number {
    // Higher relative size = higher risk
    const ratio = amount.mul(100).div(avgSize).toNumber() / 100;
    if (ratio < 2) return ratio * 25;
    if (ratio < 5) return 50 + (ratio - 2) * 10;
    return 80 + (ratio - 5) * 4;
  }

  private calculateCollateralRisk(loanAmount: BigNumber, collateralUSD: BigNumber): number {
    // Lower collateral ratio = higher risk
    const ratio = collateralUSD.mul(100).div(loanAmount).toNumber() / 100;
    if (ratio > 2) return 20;
    if (ratio > 1.5) return 40;
    if (ratio > 1) return 60;
    return 80 + (1 - ratio) * 20;
  }

  private async calculateVolatility(networkId: number, tokenAddress: string): Promise<number> {
    // TODO: Implement price volatility calculation using historical data
    return 3; // Placeholder: 3% volatility
  }

  private async calculateAverageTransactionSize(networkId: number, tokenAddress: string): Promise<BigNumber> {
    // TODO: Implement average transaction size calculation using historical data
    return BigNumber.from('1000000000000000000'); // Placeholder: 1 token
  }
} 