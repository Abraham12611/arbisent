import { providers, BigNumber } from 'ethers';
import { ZKProofService, ValidationResult } from '../../integrations/mantle/zkproof';
import { MantleConnectionManager } from '../../integrations/mantle/connection';
import { toast } from 'sonner';

export interface NetworkStateMetrics {
  blockHeight: number;
  lastValidatedBlock: number;
  validationLag: number;
  stateRoot: string;
  isHealthy: boolean;
  validatorCount: number;
  averageBlockTime: number;
}

export interface StateValidationResult {
  isValid: boolean;
  networkMetrics: NetworkStateMetrics;
  riskScore: number;
  warnings: string[];
  timestamp: number;
}

export class MantleStateValidator {
  private static instance: MantleStateValidator;
  private zkProofService: ZKProofService;
  private connectionManager: MantleConnectionManager;
  private lastValidation: Map<number, StateValidationResult>;
  private validationThresholds: {
    maxValidationLag: number;
    minValidatorCount: number;
    maxBlockTime: number;
  };

  private constructor() {
    this.zkProofService = ZKProofService.getInstance();
    this.connectionManager = MantleConnectionManager.getInstance();
    this.lastValidation = new Map();
    
    // Default thresholds
    this.validationThresholds = {
      maxValidationLag: 10, // blocks
      minValidatorCount: 3,
      maxBlockTime: 15000 // 15 seconds
    };
  }

  public static getInstance(): MantleStateValidator {
    if (!MantleStateValidator.instance) {
      MantleStateValidator.instance = new MantleStateValidator();
    }
    return MantleStateValidator.instance;
  }

  public async initialize(): Promise<void> {
    try {
      console.log('Initializing Mantle state validator...');
      await this.zkProofService.initialize();
      console.log('Mantle state validator initialized successfully');
    } catch (error) {
      console.error('Error initializing Mantle state validator:', error);
      throw error;
    }
  }

  public async validateNetworkState(chainId: number): Promise<StateValidationResult> {
    try {
      const provider = this.connectionManager.getProvider();
      const currentBlock = await provider.getBlockNumber();
      
      // Get current state root
      const block = await provider.getBlock(currentBlock);
      const stateRoot = block.stateRoot;

      // Validate state using ZKProofService
      const validationResult = await this.zkProofService.validateState(stateRoot);

      // Get network metrics
      const metrics = await this.getNetworkMetrics(chainId, currentBlock);

      // Calculate risk score based on metrics
      const { riskScore, warnings } = this.calculateRiskScore(metrics, validationResult);

      const result: StateValidationResult = {
        isValid: validationResult.isValid,
        networkMetrics: metrics,
        riskScore,
        warnings,
        timestamp: Date.now()
      };

      // Cache validation result
      this.lastValidation.set(chainId, result);

      return result;
    } catch (error) {
      console.error('Error validating network state:', error);
      toast.error('Failed to validate Mantle network state');
      throw error;
    }
  }

  public async getLastValidation(chainId: number): Promise<StateValidationResult | undefined> {
    return this.lastValidation.get(chainId);
  }

  private async getNetworkMetrics(chainId: number, currentBlock: number): Promise<NetworkStateMetrics> {
    const provider = this.connectionManager.getProvider();
    
    // Get last 100 blocks to calculate average block time
    const blocks = await Promise.all(
      Array.from({ length: 100 }, (_, i) => 
        provider.getBlock(currentBlock - i)
      )
    );

    const blockTimes = blocks
      .slice(0, -1)
      .map((block, i) => block.timestamp - blocks[i + 1].timestamp);
    
    const averageBlockTime = blockTimes.reduce((a, b) => a + b, 0) / blockTimes.length * 1000;

    // Get validator count from contract
    const validatorContract = await this.zkProofService.getValidatorContract();
    const validatorCount = await validatorContract.getValidatorCount();

    // Find last validated block
    const lastValidatedBlock = await this.findLastValidatedBlock(currentBlock);

    return {
      blockHeight: currentBlock,
      lastValidatedBlock,
      validationLag: currentBlock - lastValidatedBlock,
      stateRoot: blocks[0].stateRoot,
      isHealthy: true, // Will be updated based on thresholds
      validatorCount: validatorCount.toNumber(),
      averageBlockTime
    };
  }

  private async findLastValidatedBlock(currentBlock: number): Promise<number> {
    const provider = this.connectionManager.getProvider();
    let lastValidated = currentBlock;

    // Binary search for last validated block
    let left = Math.max(0, currentBlock - 1000); // Look back max 1000 blocks
    let right = currentBlock;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const block = await provider.getBlock(mid);
      const isValid = (await this.zkProofService.validateState(block.stateRoot)).isValid;

      if (isValid) {
        lastValidated = mid;
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }

    return lastValidated;
  }

  private calculateRiskScore(
    metrics: NetworkStateMetrics,
    validation: ValidationResult
  ): { riskScore: number; warnings: string[] } {
    const warnings: string[] = [];
    let riskScore = 0;

    // Validation lag impact (0-30 points)
    const lagScore = (metrics.validationLag / this.validationThresholds.maxValidationLag) * 30;
    riskScore += Math.min(lagScore, 30);
    if (metrics.validationLag > this.validationThresholds.maxValidationLag) {
      warnings.push(`High validation lag: ${metrics.validationLag} blocks`);
    }

    // Validator count impact (0-30 points)
    const validatorScore = 
      ((this.validationThresholds.minValidatorCount - metrics.validatorCount) / 
       this.validationThresholds.minValidatorCount) * 30;
    riskScore += Math.max(0, Math.min(validatorScore, 30));
    if (metrics.validatorCount < this.validationThresholds.minValidatorCount) {
      warnings.push(`Low validator count: ${metrics.validatorCount}`);
    }

    // Block time impact (0-20 points)
    const blockTimeScore = 
      ((metrics.averageBlockTime - this.validationThresholds.maxBlockTime) / 
       this.validationThresholds.maxBlockTime) * 20;
    riskScore += Math.max(0, Math.min(blockTimeScore, 20));
    if (metrics.averageBlockTime > this.validationThresholds.maxBlockTime) {
      warnings.push(`High average block time: ${Math.round(metrics.averageBlockTime / 1000)}s`);
    }

    // State validation impact (0-20 points)
    if (!validation.isValid) {
      riskScore += 20;
      warnings.push('Invalid state root');
    }

    // Update network health status
    metrics.isHealthy = riskScore < 50;

    return {
      riskScore: Math.min(Math.round(riskScore), 100),
      warnings
    };
  }
} 