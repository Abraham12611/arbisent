import { providers } from 'ethers';

export interface CrossMintConfig {
  apiKey: string;
  environment: 'staging' | 'production';
  supportedChains: number[];
  defaultGasLimit?: number;
  defaultSlippage?: number;
}

export const CROSSMINT_DEFAULTS = {
  environment: 'staging' as const,
  supportedChains: [
    1, // Ethereum
    137, // Polygon
    5000, // Mantle
    56, // BSC
    43114, // Avalanche
    42161, // Arbitrum
  ],
  defaultGasLimit: 250000,
  defaultSlippage: 0.5, // 0.5%
};

export class CrossMintConfigManager {
  private static instance: CrossMintConfigManager;
  private config: CrossMintConfig;
  private provider: providers.JsonRpcProvider | null = null;

  private constructor() {
    // Initialize with default config
    this.config = {
      apiKey: process.env.VITE_CROSSMINT_API_KEY || '',
      environment: CROSSMINT_DEFAULTS.environment,
      supportedChains: CROSSMINT_DEFAULTS.supportedChains,
      defaultGasLimit: CROSSMINT_DEFAULTS.defaultGasLimit,
      defaultSlippage: CROSSMINT_DEFAULTS.defaultSlippage,
    };
  }

  static getInstance(): CrossMintConfigManager {
    if (!CrossMintConfigManager.instance) {
      CrossMintConfigManager.instance = new CrossMintConfigManager();
    }
    return CrossMintConfigManager.instance;
  }

  async initialize(config: Partial<CrossMintConfig> = {}): Promise<void> {
    try {
      console.log('Initializing CrossMint configuration...');
      
      // Merge provided config with defaults
      this.config = {
        ...this.config,
        ...config,
      };

      // Validate configuration
      this.validateConfig();

      // Initialize provider based on environment
      const rpcUrl = this.config.environment === 'production'
        ? 'https://crossmint.production.rpc.com'
        : 'https://crossmint.staging.rpc.com';
      
      this.provider = new providers.JsonRpcProvider(rpcUrl);
      await this.provider.ready;

      console.log('CrossMint configuration initialized successfully');
    } catch (error) {
      console.error('Error initializing CrossMint configuration:', error);
      throw error;
    }
  }

  getConfig(): CrossMintConfig {
    return { ...this.config };
  }

  getProvider(): providers.JsonRpcProvider {
    if (!this.provider) {
      throw new Error('CrossMint provider not initialized');
    }
    return this.provider;
  }

  isSupportedChain(chainId: number): boolean {
    return this.config.supportedChains.includes(chainId);
  }

  private validateConfig(): void {
    if (!this.config.apiKey) {
      throw new Error('CrossMint API key is required');
    }

    if (!this.config.supportedChains.length) {
      throw new Error('At least one supported chain must be specified');
    }

    if (this.config.defaultSlippage && (this.config.defaultSlippage < 0 || this.config.defaultSlippage > 100)) {
      throw new Error('Default slippage must be between 0 and 100');
    }

    if (this.config.defaultGasLimit && this.config.defaultGasLimit < 21000) {
      throw new Error('Default gas limit must be at least 21000');
    }
  }
} 