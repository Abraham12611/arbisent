import { providers } from 'ethers';

export interface MantleConfig {
  rpcUrl: string;
  chainId: number;
  contractAddresses: {
    bridge: string;
    validator: string;
    settlement: string;
  };
  apiKey?: string;
}

export const MANTLE_NETWORKS = {
  MAINNET: {
    chainId: 5000,
    rpcUrl: process.env.VITE_MANTLE_MAINNET_RPC_URL || 'https://rpc.mantle.xyz',
    contractAddresses: {
      bridge: '0x0000000000000000000000000000000000000000', // Replace with actual address
      validator: '0x0000000000000000000000000000000000000000', // Replace with actual address
      settlement: '0x0000000000000000000000000000000000000000', // Replace with actual address
    }
  },
  TESTNET: {
    chainId: 5001,
    rpcUrl: process.env.VITE_MANTLE_TESTNET_RPC_URL || 'https://rpc.testnet.mantle.xyz',
    contractAddresses: {
      bridge: '0x0000000000000000000000000000000000000000', // Replace with actual address
      validator: '0x0000000000000000000000000000000000000000', // Replace with actual address
      settlement: '0x0000000000000000000000000000000000000000', // Replace with actual address
    }
  }
} as const;

export class MantleConfigManager {
  private static instance: MantleConfigManager;
  private provider: providers.JsonRpcProvider | null = null;
  private currentNetwork: keyof typeof MANTLE_NETWORKS = 'TESTNET';

  private constructor() {}

  static getInstance(): MantleConfigManager {
    if (!MantleConfigManager.instance) {
      MantleConfigManager.instance = new MantleConfigManager();
    }
    return MantleConfigManager.instance;
  }

  async initialize(network: keyof typeof MANTLE_NETWORKS = 'TESTNET'): Promise<void> {
    try {
      console.log('Initializing Mantle configuration...');
      this.currentNetwork = network;
      const networkConfig = MANTLE_NETWORKS[network];
      
      this.provider = new providers.JsonRpcProvider(networkConfig.rpcUrl);
      await this.provider.ready;

      const connectedChainId = (await this.provider.getNetwork()).chainId;
      if (connectedChainId !== networkConfig.chainId) {
        throw new Error(`Connected to wrong chain. Expected ${networkConfig.chainId}, got ${connectedChainId}`);
      }

      console.log('Mantle configuration initialized successfully');
    } catch (error) {
      console.error('Error initializing Mantle configuration:', error);
      throw error;
    }
  }

  getProvider(): providers.JsonRpcProvider {
    if (!this.provider) {
      throw new Error('Mantle provider not initialized');
    }
    return this.provider;
  }

  getCurrentNetwork(): typeof MANTLE_NETWORKS[keyof typeof MANTLE_NETWORKS] {
    return MANTLE_NETWORKS[this.currentNetwork];
  }

  async switchNetwork(network: keyof typeof MANTLE_NETWORKS): Promise<void> {
    await this.initialize(network);
  }
} 