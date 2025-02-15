import { providers, Wallet, BigNumber } from 'ethers';
import { CrossMintConfigManager } from './config';
import { toast } from 'sonner';

export interface UnifiedWalletConfig {
  chainId: number;
  provider?: providers.Provider;
  privateKey?: string;
}

export interface WalletState {
  address: string;
  chainId: number;
  isConnected: boolean;
  balance: BigNumber;
  network: string;
}

export interface TransactionRequest {
  to: string;
  value: BigNumber;
  data?: string;
  gasLimit?: BigNumber;
  gasPrice?: BigNumber;
  nonce?: number;
}

export interface SignedTransaction {
  hash: string;
  data: string;
  signature: string;
  chainId: number;
}

export class UnifiedWalletManager {
  private static instance: UnifiedWalletManager;
  private configManager: CrossMintConfigManager;
  private wallets: Map<number, Wallet> = new Map();
  private activeChainId: number | null = null;

  private constructor() {
    this.configManager = CrossMintConfigManager.getInstance();
  }

  static getInstance(): UnifiedWalletManager {
    if (!UnifiedWalletManager.instance) {
      UnifiedWalletManager.instance = new UnifiedWalletManager();
    }
    return UnifiedWalletManager.instance;
  }

  async connect(config: UnifiedWalletConfig): Promise<WalletState> {
    try {
      console.log('Connecting unified wallet for chain:', config.chainId);

      if (!this.configManager.isSupportedChain(config.chainId)) {
        throw new Error(`Chain ID ${config.chainId} is not supported`);
      }

      // Get provider (use provided or default)
      const provider = config.provider || this.configManager.getProvider();

      // Create or get wallet
      let wallet: Wallet;
      if (config.privateKey) {
        wallet = new Wallet(config.privateKey, provider);
      } else {
        // Use browser wallet
        const ethereum = (window as any).ethereum;
        if (!ethereum) {
          throw new Error('No browser wallet found');
        }

        await ethereum.request({ method: 'eth_requestAccounts' });
        const accounts = await ethereum.request({ method: 'eth_accounts' });
        wallet = new Wallet(accounts[0], provider);
      }

      // Store wallet
      this.wallets.set(config.chainId, wallet);
      this.activeChainId = config.chainId;

      // Get network details
      const network = await provider.getNetwork();
      const balance = await provider.getBalance(wallet.address);

      const state: WalletState = {
        address: wallet.address,
        chainId: config.chainId,
        isConnected: true,
        balance,
        network: network.name
      };

      console.log('Unified wallet connected:', state);
      toast.success('Wallet connected successfully');

      return state;
    } catch (error) {
      console.error('Error connecting unified wallet:', error);
      toast.error('Failed to connect wallet');
      throw error;
    }
  }

  async disconnect(chainId?: number): Promise<void> {
    try {
      if (chainId) {
        // Disconnect specific chain
        this.wallets.delete(chainId);
        if (this.activeChainId === chainId) {
          this.activeChainId = null;
        }
        console.log(`Disconnected wallet for chain ${chainId}`);
      } else {
        // Disconnect all
        this.wallets.clear();
        this.activeChainId = null;
        console.log('Disconnected all wallets');
      }

      toast.success('Wallet(s) disconnected successfully');
    } catch (error) {
      console.error('Error disconnecting wallet(s):', error);
      toast.error('Failed to disconnect wallet(s)');
      throw error;
    }
  }

  async switchChain(chainId: number): Promise<WalletState> {
    try {
      if (!this.configManager.isSupportedChain(chainId)) {
        throw new Error(`Chain ID ${chainId} is not supported`);
      }

      const wallet = this.wallets.get(chainId);
      if (!wallet) {
        throw new Error(`No wallet connected for chain ${chainId}`);
      }

      this.activeChainId = chainId;
      const provider = wallet.provider as providers.Provider;
      const network = await provider.getNetwork();
      const balance = await provider.getBalance(wallet.address);

      const state: WalletState = {
        address: wallet.address,
        chainId,
        isConnected: true,
        balance,
        network: network.name
      };

      console.log('Switched to chain:', state);
      toast.success(`Switched to ${network.name}`);

      return state;
    } catch (error) {
      console.error('Error switching chain:', error);
      toast.error('Failed to switch chain');
      throw error;
    }
  }

  async signTransaction(tx: TransactionRequest): Promise<SignedTransaction> {
    try {
      if (!this.activeChainId) {
        throw new Error('No active chain selected');
      }

      const wallet = this.wallets.get(this.activeChainId);
      if (!wallet) {
        throw new Error('No wallet connected');
      }

      const provider = wallet.provider as providers.Provider;

      // Get nonce if not provided
      const nonce = tx.nonce || await provider.getTransactionCount(wallet.address);

      // Get gas price if not provided
      const gasPrice = tx.gasPrice || await provider.getGasPrice();

      // Estimate gas limit if not provided
      const gasLimit = tx.gasLimit || await provider.estimateGas({
        from: wallet.address,
        to: tx.to,
        value: tx.value,
        data: tx.data || '0x'
      });

      // Create transaction object
      const transaction = {
        to: tx.to,
        value: tx.value,
        data: tx.data || '0x',
        nonce,
        gasLimit,
        gasPrice,
        chainId: this.activeChainId
      };

      // Sign transaction
      const signedTx = await wallet.signTransaction(transaction);

      const result: SignedTransaction = {
        hash: wallet.address,
        data: signedTx,
        signature: signedTx.slice(2),
        chainId: this.activeChainId
      };

      console.log('Transaction signed:', result);
      return result;
    } catch (error) {
      console.error('Error signing transaction:', error);
      toast.error('Failed to sign transaction');
      throw error;
    }
  }

  getConnectedChains(): number[] {
    return Array.from(this.wallets.keys());
  }

  getActiveChain(): number | null {
    return this.activeChainId;
  }

  async getBalance(chainId?: number): Promise<BigNumber> {
    try {
      const targetChainId = chainId || this.activeChainId;
      if (!targetChainId) {
        throw new Error('No chain specified or active');
      }

      const wallet = this.wallets.get(targetChainId);
      if (!wallet) {
        throw new Error(`No wallet connected for chain ${targetChainId}`);
      }

      const balance = await wallet.getBalance();
      return balance;
    } catch (error) {
      console.error('Error getting balance:', error);
      throw error;
    }
  }

  isConnected(chainId?: number): boolean {
    if (chainId) {
      return this.wallets.has(chainId);
    }
    return this.wallets.size > 0;
  }
} 