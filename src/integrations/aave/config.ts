import { Pool, InterestRate } from '@aave/contract-helpers';
import { providers } from 'ethers';

export interface AaveConfig {
  marketAddress: string;
  wethGatewayAddress: string;
  lendingPoolAddress: string;
  dataProviderAddress: string;
  supportedNetworks: number[];
  defaultInterestRateMode: InterestRate;
}

export const AAVE_DEFAULTS: AaveConfig = {
  marketAddress: '0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb', // Aave v3 market
  wethGatewayAddress: '0xD322A49006FC828F9B5B37Ab215F99B4E5caB19C',
  lendingPoolAddress: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
  dataProviderAddress: '0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654',
  supportedNetworks: [1, 137, 42161, 43114], // Ethereum, Polygon, Arbitrum, Avalanche
  defaultInterestRateMode: InterestRate.Variable
};

export class AaveConfigManager {
  private static instance: AaveConfigManager;
  private config: AaveConfig;
  private pools: Map<number, Pool>;
  private provider: providers.Provider | null;

  private constructor() {
    this.config = { ...AAVE_DEFAULTS };
    this.pools = new Map();
    this.provider = null;
  }

  static getInstance(): AaveConfigManager {
    if (!AaveConfigManager.instance) {
      AaveConfigManager.instance = new AaveConfigManager();
    }
    return AaveConfigManager.instance;
  }

  async initialize(
    provider: providers.Provider,
    config: Partial<AaveConfig> = {}
  ): Promise<void> {
    try {
      this.provider = provider;
      this.config = {
        ...AAVE_DEFAULTS,
        ...config
      };

      // Validate configuration
      this.validateConfig();

      // Initialize pools for each supported network
      for (const networkId of this.config.supportedNetworks) {
        const pool = new Pool(provider, {
          POOL: this.config.lendingPoolAddress,
          WETH_GATEWAY: this.config.wethGatewayAddress
        });
        this.pools.set(networkId, pool);
      }

      console.log('Aave configuration initialized successfully');
    } catch (error) {
      console.error('Error initializing Aave configuration:', error);
      throw error;
    }
  }

  getConfig(): AaveConfig {
    return { ...this.config };
  }

  getPool(networkId: number): Pool {
    const pool = this.pools.get(networkId);
    if (!pool) {
      throw new Error(`No Aave pool initialized for network ${networkId}`);
    }
    return pool;
  }

  getProvider(): providers.Provider {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }
    return this.provider;
  }

  private validateConfig(): void {
    if (!this.config.marketAddress || !this.isValidAddress(this.config.marketAddress)) {
      throw new Error('Invalid market address');
    }

    if (!this.config.wethGatewayAddress || !this.isValidAddress(this.config.wethGatewayAddress)) {
      throw new Error('Invalid WETH gateway address');
    }

    if (!this.config.lendingPoolAddress || !this.isValidAddress(this.config.lendingPoolAddress)) {
      throw new Error('Invalid lending pool address');
    }

    if (!this.config.dataProviderAddress || !this.isValidAddress(this.config.dataProviderAddress)) {
      throw new Error('Invalid data provider address');
    }

    if (!this.config.supportedNetworks || this.config.supportedNetworks.length === 0) {
      throw new Error('No supported networks specified');
    }
  }

  private isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }
} 