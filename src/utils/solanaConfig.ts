import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { SolanaAgentKit } from 'solana-agent-kit';

export class SolanaConfig {
  private static instance: SolanaConfig;
  private connection: Connection | null = null;
  private agentKit: SolanaAgentKit | null = null;

  private constructor() {}

  static getInstance(): SolanaConfig {
    if (!SolanaConfig.instance) {
      SolanaConfig.instance = new SolanaConfig();
    }
    return SolanaConfig.instance;
  }

  async initialize(endpoint: string, privateKey: string): Promise<void> {
    try {
      console.log('Initializing Solana configuration...');
      this.connection = new Connection(endpoint, 'confirmed');
      
      // Initialize SolanaAgentKit with the provided credentials
      this.agentKit = new SolanaAgentKit(
        privateKey,
        endpoint,
        process.env.OPENAI_API_KEY!
      );

      console.log('Solana configuration initialized successfully');
    } catch (error) {
      console.error('Error initializing Solana configuration:', error);
      throw error;
    }
  }

  getConnection(): Connection {
    if (!this.connection) {
      throw new Error('Solana connection not initialized');
    }
    return this.connection;
  }

  getAgentKit(): SolanaAgentKit {
    if (!this.agentKit) {
      throw new Error('SolanaAgentKit not initialized');
    }
    return this.agentKit;
  }

  async getBalance(publicKey: PublicKey): Promise<number> {
    if (!this.connection) {
      throw new Error('Solana connection not initialized');
    }
    return this.connection.getBalance(publicKey);
  }
}

export const solanaConfig = SolanaConfig.getInstance();