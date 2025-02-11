import { providers } from 'ethers';

export interface OneinchConfig {
  apiKey: string;
  fusionApiUrl: string;
  supportedNetworks: number[];
  defaultSlippage: number;
  defaultGasLimit: number;
  defaultTTL: number; // Time-to-live for orders in seconds
}

export const ONEINCH_DEFAULTS: OneinchConfig = {
  apiKey: process.env.VITE_ONEINCH_API_KEY || '',
  fusionApiUrl: 'https://fusion.1inch.io',
  supportedNetworks: [
    1,      // Ethereum
    137,    // Polygon
    42161,  // Arbitrum
    10,     // Optimism
    56,     // BSC
    43114   // Avalanche
  ],
  defaultSlippage: 1, // 1%
  defaultGasLimit: 500000,
  defaultTTL: 600 // 10 minutes
};

export class OneinchConfigManager {
  private static instance: OneinchConfigManager;
  private config: OneinchConfig;
  private provider: providers.Provider | null = null;

  private constructor() {
    this.config = { ...ONEINCH_DEFAULTS };
  }

  static getInstance(): OneinchConfigManager {
    if (!OneinchConfigManager.instance) {
      OneinchConfigManager.instance = new OneinchConfigManager();
    }
    return OneinchConfigManager.instance;
  }

  async initialize(
    provider: providers.Provider,
    config: Partial<OneinchConfig> = {}
  ): Promise<void> {
    try {
      console.log('Initializing 1inch Fusion configuration...');
      
      this.provider = provider;
      this.config = {
        ...ONEINCH_DEFAULTS,
        ...config
      };

      // Validate configuration
      this.validateConfig();

      // Verify provider connection
      const network = await this.provider.getNetwork();
      if (!this.isSupportedNetwork(network.chainId)) {
        throw new Error(`Network ${network.chainId} is not supported by 1inch Fusion`);
      }

      console.log('1inch Fusion configuration initialized successfully');
    } catch (error) {
      console.error('Error initializing 1inch Fusion configuration:', error);
      throw error;
    }
  }

  getConfig(): OneinchConfig {
    return { ...this.config };
  }

  getProvider(): providers.Provider {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }
    return this.provider;
  }

  isSupportedNetwork(chainId: number): boolean {
    return this.config.supportedNetworks.includes(chainId);
  }

  getFusionApiUrl(chainId: number): string {
    if (!this.isSupportedNetwork(chainId)) {
      throw new Error(`Network ${chainId} is not supported by 1inch Fusion`);
    }
    return `${this.config.fusionApiUrl}/v1.0/${chainId}`;
  }

  private validateConfig(): void {
    if (!this.config.apiKey) {
      throw new Error('1inch API key is required');
    }

    if (!this.config.supportedNetworks.length) {
      throw new Error('At least one supported network must be specified');
    }

    if (this.config.defaultSlippage <= 0 || this.config.defaultSlippage > 50) {
      throw new Error('Default slippage must be between 0 and 50');
    }

    if (this.config.defaultGasLimit < 21000) {
      throw new Error('Default gas limit must be at least 21000');
    }

    if (this.config.defaultTTL < 60 || this.config.defaultTTL > 3600) {
      throw new Error('Default TTL must be between 60 and 3600 seconds');
    }
  }
} 