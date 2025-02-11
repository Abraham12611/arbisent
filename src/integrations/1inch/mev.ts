import { providers, BigNumber } from 'ethers';
import { OneinchConfigManager } from './config';
import { LiquidityAggregator } from './liquidity';
import axios from 'axios';
import { toast } from 'sonner';

export interface MEVProtectionConfig {
  maxPriceImpact: number;
  maxGasMultiplier: number;
  minBlockDelay: number;
  maxBlockDelay: number;
}

export interface MEVRiskAssessment {
  riskScore: number; // 0-100, where 100 is highest risk
  estimatedLoss: BigNumber;
  recommendedDelay: number;
  protectionStrategies: string[];
  warnings: string[];
}

export interface ProtectedTransaction {
  originalTx: string;
  protectedTx: string;
  estimatedSavings: BigNumber;
  appliedStrategies: string[];
  bundleHash?: string;
}

const DEFAULT_PROTECTION_CONFIG: MEVProtectionConfig = {
  maxPriceImpact: 1.0, // 1%
  maxGasMultiplier: 1.5,
  minBlockDelay: 1,
  maxBlockDelay: 3
};

export class MEVProtectionService {
  private static instance: MEVProtectionService;
  private configManager: OneinchConfigManager;
  private liquidityAggregator: LiquidityAggregator;
  private protectionConfig: MEVProtectionConfig;
  private initialized: boolean = false;

  private constructor() {
    this.configManager = OneinchConfigManager.getInstance();
    this.liquidityAggregator = LiquidityAggregator.getInstance();
    this.protectionConfig = DEFAULT_PROTECTION_CONFIG;
  }

  public static getInstance(): MEVProtectionService {
    if (!MEVProtectionService.instance) {
      MEVProtectionService.instance = new MEVProtectionService();
    }
    return MEVProtectionService.instance;
  }

  public async initialize(config: Partial<MEVProtectionConfig> = {}): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.protectionConfig = {
      ...DEFAULT_PROTECTION_CONFIG,
      ...config
    };

    await this.liquidityAggregator.initialize();
    this.initialized = true;
  }

  public async assessMEVRisk(
    chainId: number,
    tokenIn: string,
    tokenOut: string,
    amount: BigNumber
  ): Promise<MEVRiskAssessment> {
    if (!this.initialized) {
      throw new Error('MEVProtectionService not initialized');
    }

    const liquidity = await this.liquidityAggregator.getAggregatedLiquidity(
      chainId,
      tokenIn,
      tokenOut,
      amount
    );

    const riskFactors = this.calculateRiskFactors(amount, liquidity);
    const riskScore = this.calculateRiskScore(riskFactors);
    const protectionStrategies = this.determineProtectionStrategies(riskScore);
    const warnings = this.generateWarnings(riskFactors);

    return {
      riskScore,
      estimatedLoss: this.estimatePotentialLoss(amount, liquidity),
      recommendedDelay: this.calculateRecommendedDelay(riskScore),
      protectionStrategies,
      warnings
    };
  }

  public async protectTransaction(
    chainId: number,
    rawTx: string,
    assessment: MEVRiskAssessment
  ): Promise<ProtectedTransaction> {
    if (!this.initialized) {
      throw new Error('MEVProtectionService not initialized');
    }

    const apiUrl = this.configManager.getFusionApiUrl(chainId);
    const config = this.configManager.getConfig();

    try {
      const response = await axios.post(
        `${apiUrl}/protect-transaction`,
        {
          tx: rawTx,
          strategies: assessment.protectionStrategies,
          blockDelay: assessment.recommendedDelay
        },
        {
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const { protectedTx, estimatedSavings, strategies, bundleHash } = response.data;

      return {
        originalTx: rawTx,
        protectedTx,
        estimatedSavings: BigNumber.from(estimatedSavings),
        appliedStrategies: strategies,
        bundleHash
      };
    } catch (error) {
      throw new Error(`Failed to protect transaction: ${error.message}`);
    }
  }

  private calculateRiskFactors(amount: BigNumber, liquidity: any): any {
    const amountInEther = Number(amount) / 1e18;
    const liquidityInEther = Number(liquidity.totalLiquidity) / 1e18;
    
    return {
      liquidityRatio: amountInEther / liquidityInEther,
      priceImpact: liquidity.priceImpact,
      gasPrice: liquidity.estimatedGas,
      poolCount: liquidity.pools.length
    };
  }

  private calculateRiskScore(factors: any): number {
    let score = 0;

    // Liquidity ratio impact (0-40 points)
    score += Math.min(factors.liquidityRatio * 100, 40);

    // Price impact (0-30 points)
    score += Math.min(factors.priceImpact * 20, 30);

    // Gas price impact (0-20 points)
    const gasMultiplier = factors.gasPrice.div(BigNumber.from('150000')).toNumber();
    score += Math.min(gasMultiplier * 10, 20);

    // Pool diversity impact (0-10 points)
    score += Math.max(0, 10 - factors.poolCount);

    return Math.min(score, 100);
  }

  private determineProtectionStrategies(riskScore: number): string[] {
    const strategies: string[] = [];

    if (riskScore > 30) {
      strategies.push('private-tx');
    }
    if (riskScore > 50) {
      strategies.push('time-delay');
    }
    if (riskScore > 70) {
      strategies.push('bundle-submission');
    }
    if (riskScore > 90) {
      strategies.push('flashbots');
    }

    return strategies;
  }

  private calculateRecommendedDelay(riskScore: number): number {
    const { minBlockDelay, maxBlockDelay } = this.protectionConfig;
    const normalizedScore = riskScore / 100;
    const delay = Math.floor(minBlockDelay + (maxBlockDelay - minBlockDelay) * normalizedScore);
    return Math.min(delay, maxBlockDelay);
  }

  private estimatePotentialLoss(amount: BigNumber, liquidity: any): BigNumber {
    const priceImpact = liquidity.priceImpact / 100; // Convert percentage to decimal
    return amount.mul(Math.floor(priceImpact * 1e6)).div(1e6);
  }

  private generateWarnings(factors: any): string[] {
    const warnings: string[] = [];

    if (factors.liquidityRatio > 0.1) {
      warnings.push('Large trade relative to pool liquidity');
    }
    if (factors.priceImpact > this.protectionConfig.maxPriceImpact) {
      warnings.push('High price impact detected');
    }
    if (factors.poolCount < 3) {
      warnings.push('Limited pool diversity');
    }
    if (factors.gasPrice.gt(BigNumber.from('300000'))) {
      warnings.push('High gas costs expected');
    }

    return warnings;
  }
} 
} 