import { providers, BigNumber } from 'ethers';
import { RiskAssessmentService } from '../../integrations/aave/risk';
import { MantleStateValidator } from './mantle-state-validator';
import { toast } from 'sonner';

export interface CrossChainRisk {
  sourceChainId: number;
  targetChainId: number;
  score: number;
  warnings: string[];
  metrics: {
    bridgeLatency: number;  // milliseconds
    bridgeReliability: number;  // 0-1
    gasCosts: {
      source: BigNumber;
      target: BigNumber;
    };
    liquidityRatio: number;  // 0-1
  };
}

export interface RiskAssessmentResult {
  overallRiskScore: number;
  components: {
    flashLoanRisk?: {
      score: number;
      warnings: string[];
    };
    collateralRisk?: {
      score: number;
      warnings: string[];
    };
    networkStateRisk?: {
      score: number;
      warnings: string[];
      metrics?: any;
    };
    crossChainRisk?: CrossChainRisk;
  };
  recommendations: string[];
  timestamp: number;
}

export class RiskAssessmentAgent {
  private static instance: RiskAssessmentAgent;
  private riskService: RiskAssessmentService;
  private mantleStateValidator: MantleStateValidator;
  private lastAssessment: Map<string, RiskAssessmentResult>;
  private bridgeLatencyThreshold = 60000; // 60 seconds
  private minBridgeReliability = 0.95; // 95%
  private minLiquidityRatio = 0.2; // 20%

  private constructor() {
    this.riskService = RiskAssessmentService.getInstance();
    this.mantleStateValidator = MantleStateValidator.getInstance();
    this.lastAssessment = new Map();
  }

  public static getInstance(): RiskAssessmentAgent {
    if (!RiskAssessmentAgent.instance) {
      RiskAssessmentAgent.instance = new RiskAssessmentAgent();
    }
    return RiskAssessmentAgent.instance;
  }

  public async initialize(): Promise<void> {
    try {
      console.log('Initializing risk assessment agent...');
      await Promise.all([
        this.riskService.initialize(),
        this.mantleStateValidator.initialize()
      ]);
      console.log('Risk assessment agent initialized successfully');
    } catch (error) {
      console.error('Error initializing risk assessment agent:', error);
      throw error;
    }
  }

  public async assessRisk(
    chainId: number,
    params: {
      tokenAddress?: string;
      amount?: BigNumber;
      userAddress?: string;
      includeNetworkState?: boolean;
      targetChainId?: number;  // New parameter for cross-chain assessment
    }
  ): Promise<RiskAssessmentResult> {
    try {
      const components: RiskAssessmentResult['components'] = {};
      const recommendations: string[] = [];

      // Assess flash loan risk if parameters are provided
      if (params.tokenAddress && params.amount && params.userAddress) {
        const flashLoanRisk = await this.riskService.assessFlashLoanRisk(
          chainId,
          params.tokenAddress,
          params.amount,
          params.userAddress
        );

        components.flashLoanRisk = {
          score: flashLoanRisk.riskScore,
          warnings: flashLoanRisk.warnings
        };

        if (flashLoanRisk.warnings.length > 0) {
          recommendations.push(
            `Consider adjusting flash loan parameters: ${flashLoanRisk.warnings.join(', ')}`
          );
        }
      }

      // Assess network state risk if requested
      if (params.includeNetworkState) {
        const networkState = await this.mantleStateValidator.validateNetworkState(chainId);
        
        components.networkStateRisk = {
          score: networkState.riskScore,
          warnings: networkState.warnings,
          metrics: networkState.networkMetrics
        };

        if (!networkState.networkMetrics.isHealthy) {
          recommendations.push(
            'Network state indicates potential risks. Consider delaying high-value transactions.'
          );
        }

        if (networkState.warnings.length > 0) {
          recommendations.push(
            `Network state warnings: ${networkState.warnings.join(', ')}`
          );
        }
      }

      // Assess cross-chain risk if target chain is specified
      if (params.targetChainId) {
        const crossChainRisk = await this.assessCrossChainRisk(
          chainId,
          params.targetChainId,
          params.tokenAddress,
          params.amount
        );
        
        components.crossChainRisk = crossChainRisk;

        if (crossChainRisk.score > 70) {
          recommendations.push(
            'High cross-chain risk detected. Consider alternative routes or timing.'
          );
        }

        if (crossChainRisk.warnings.length > 0) {
          recommendations.push(
            `Cross-chain warnings: ${crossChainRisk.warnings.join(', ')}`
          );
        }
      }

      // Calculate overall risk score (weighted average of component scores)
      const scores: number[] = [];
      const weights: number[] = [];

      if (components.flashLoanRisk) {
        scores.push(components.flashLoanRisk.score);
        weights.push(0.3); // 30% weight for flash loan risk
      }

      if (components.networkStateRisk) {
        scores.push(components.networkStateRisk.score);
        weights.push(0.4); // 40% weight for network state risk
      }

      if (components.crossChainRisk) {
        scores.push(components.crossChainRisk.score);
        weights.push(0.3); // 30% weight for cross-chain risk
      }

      const overallRiskScore = Math.round(
        scores.reduce((sum, score, i) => sum + score * weights[i], 0) /
        weights.reduce((sum, weight) => sum + weight, 0)
      );

      const result: RiskAssessmentResult = {
        overallRiskScore,
        components,
        recommendations,
        timestamp: Date.now()
      };

      // Cache the assessment result
      const cacheKey = `${chainId}-${params.tokenAddress || ''}-${params.userAddress || ''}-${params.targetChainId || ''}`;
      this.lastAssessment.set(cacheKey, result);

      return result;
    } catch (error) {
      console.error('Error assessing risk:', error);
      toast.error('Failed to assess risk');
      throw error;
    }
  }

  private async assessCrossChainRisk(
    sourceChainId: number,
    targetChainId: number,
    tokenAddress?: string,
    amount?: BigNumber
  ): Promise<CrossChainRisk> {
    const warnings: string[] = [];
    
    // Get network states for both chains
    const [sourceState, targetState] = await Promise.all([
      this.mantleStateValidator.validateNetworkState(sourceChainId),
      this.mantleStateValidator.validateNetworkState(targetChainId)
    ]);

    // Get gas prices for both chains
    const [sourceGasPrice, targetGasPrice] = await Promise.all([
      this.riskService.getPool(sourceChainId).provider.getGasPrice(),
      this.riskService.getPool(targetChainId).provider.getGasPrice()
    ]);

    // Calculate bridge metrics
    const bridgeMetrics = await this.calculateBridgeMetrics(sourceChainId, targetChainId);

    // Calculate liquidity ratio if token address is provided
    let liquidityRatio = 1;
    if (tokenAddress && amount) {
      liquidityRatio = await this.calculateCrossChainLiquidityRatio(
        sourceChainId,
        targetChainId,
        tokenAddress,
        amount
      );
    }

    // Add warnings based on metrics
    if (bridgeMetrics.latency > this.bridgeLatencyThreshold) {
      warnings.push(`High bridge latency: ${Math.round(bridgeMetrics.latency / 1000)}s`);
    }

    if (bridgeMetrics.reliability < this.minBridgeReliability) {
      warnings.push(`Low bridge reliability: ${Math.round(bridgeMetrics.reliability * 100)}%`);
    }

    if (liquidityRatio < this.minLiquidityRatio) {
      warnings.push(`Insufficient cross-chain liquidity: ${Math.round(liquidityRatio * 100)}%`);
    }

    // Calculate risk score components
    const latencyScore = Math.min((bridgeMetrics.latency / this.bridgeLatencyThreshold) * 40, 40);
    const reliabilityScore = Math.min((1 - bridgeMetrics.reliability) * 100 * 0.3, 30);
    const liquidityScore = Math.min((1 - liquidityRatio) * 100 * 0.3, 30);

    const riskScore = Math.min(
      Math.round(latencyScore + reliabilityScore + liquidityScore),
      100
    );

    return {
      sourceChainId,
      targetChainId,
      score: riskScore,
      warnings,
      metrics: {
        bridgeLatency: bridgeMetrics.latency,
        bridgeReliability: bridgeMetrics.reliability,
        gasCosts: {
          source: sourceGasPrice,
          target: targetGasPrice
        },
        liquidityRatio
      }
    };
  }

  private async calculateBridgeMetrics(
    sourceChainId: number,
    targetChainId: number
  ): Promise<{ latency: number; reliability: number }> {
    // TODO: Implement actual bridge metrics calculation using historical data
    // For now, return placeholder values
    return {
      latency: 30000, // 30 seconds
      reliability: 0.98 // 98%
    };
  }

  private async calculateCrossChainLiquidityRatio(
    sourceChainId: number,
    targetChainId: number,
    tokenAddress: string,
    amount: BigNumber
  ): Promise<number> {
    try {
      // Get liquidity data from both chains
      const [sourceLiquidity, targetLiquidity] = await Promise.all([
        this.riskService.getMarketCondition(sourceChainId, tokenAddress),
        this.riskService.getMarketCondition(targetChainId, tokenAddress)
      ]);

      // Calculate the ratio of available liquidity to required amount
      const sourceRatio = sourceLiquidity.totalLiquidity.div(amount).toNumber();
      const targetRatio = targetLiquidity.totalLiquidity.div(amount).toNumber();

      // Return the lower of the two ratios
      return Math.min(sourceRatio, targetRatio);
    } catch (error) {
      console.error('Error calculating cross-chain liquidity ratio:', error);
      return 1; // Default to 1 (100%) in case of error
    }
  }

  public async getLastAssessment(
    chainId: number,
    tokenAddress?: string,
    userAddress?: string
  ): Promise<RiskAssessmentResult | undefined> {
    const cacheKey = `${chainId}-${tokenAddress || ''}-${userAddress || ''}`;
    return this.lastAssessment.get(cacheKey);
  }
} 