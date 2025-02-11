import { providers, BigNumber } from 'ethers';
import { RiskAssessmentService } from '../../integrations/aave/risk';
import { MantleStateValidator } from './mantle-state-validator';
import { toast } from 'sonner';

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
  };
  recommendations: string[];
  timestamp: number;
}

export class RiskAssessmentAgent {
  private static instance: RiskAssessmentAgent;
  private riskService: RiskAssessmentService;
  private mantleStateValidator: MantleStateValidator;
  private lastAssessment: Map<string, RiskAssessmentResult>;

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

      // Calculate overall risk score (weighted average of component scores)
      const scores: number[] = [];
      const weights: number[] = [];

      if (components.flashLoanRisk) {
        scores.push(components.flashLoanRisk.score);
        weights.push(0.4); // 40% weight for flash loan risk
      }

      if (components.networkStateRisk) {
        scores.push(components.networkStateRisk.score);
        weights.push(0.6); // 60% weight for network state risk
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
      const cacheKey = `${chainId}-${params.tokenAddress || ''}-${params.userAddress || ''}`;
      this.lastAssessment.set(cacheKey, result);

      return result;
    } catch (error) {
      console.error('Error assessing risk:', error);
      toast.error('Failed to assess risk');
      throw error;
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