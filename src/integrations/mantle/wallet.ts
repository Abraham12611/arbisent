import { providers, Wallet, BigNumber, utils } from 'ethers';
import { MantleConfigManager } from './config';
import { MantleConnectionManager } from './connection';
import { toast } from 'sonner';

export interface WalletConnection {
  address: string;
  chainId: number;
  isConnected: boolean;
  balance: BigNumber;
}

export interface SignedTransaction {
  hash: string;
  data: string;
  signature: string;
}

export class MantleWallet {
  private static instance: MantleWallet;
  private configManager: MantleConfigManager;
  private connectionManager: MantleConnectionManager;
  private wallet: Wallet | null = null;
  private provider: providers.JsonRpcProvider | null = null;

  private constructor() {
    this.configManager = MantleConfigManager.getInstance();
    this.connectionManager = MantleConnectionManager.getInstance();
  }

  static getInstance(): MantleWallet {
    if (!MantleWallet.instance) {
      MantleWallet.instance = new MantleWallet();
    }
    return MantleWallet.instance;
  }

  async connect(privateKey?: string): Promise<WalletConnection> {
    try {
      console.log('Connecting Mantle wallet...');
      
      // Get provider from connection manager
      this.provider = this.connectionManager.getProvider();
      
      if (privateKey) {
        // Create wallet from private key
        this.wallet = new Wallet(privateKey, this.provider);
      } else {
        // Request connection through browser wallet
        const ethereum = (window as any).ethereum;
        if (!ethereum) {
          throw new Error('No Ethereum wallet found');
        }

        await ethereum.request({ method: 'eth_requestAccounts' });
        const address = (await ethereum.request({ method: 'eth_accounts' }))[0];
        
        // Create wallet from provider signer
        this.wallet = new Wallet(address, this.provider);
      }

      const network = await this.provider.getNetwork();
      const balance = await this.provider.getBalance(this.wallet.address);

      const connection: WalletConnection = {
        address: this.wallet.address,
        chainId: network.chainId,
        isConnected: true,
        balance
      };

      console.log('Mantle wallet connected:', connection);
      toast.success('Mantle wallet connected successfully');
      
      return connection;
    } catch (error) {
      console.error('Error connecting Mantle wallet:', error);
      toast.error('Failed to connect Mantle wallet');
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      console.log('Disconnecting Mantle wallet...');
      this.wallet = null;
      this.provider = null;
      console.log('Mantle wallet disconnected');
      toast.success('Mantle wallet disconnected');
    } catch (error) {
      console.error('Error disconnecting Mantle wallet:', error);
      toast.error('Failed to disconnect Mantle wallet');
      throw error;
    }
  }

  async sign(transaction: {
    to: string;
    value: BigNumber;
    data?: string;
    nonce?: number;
    gasLimit?: BigNumber;
    gasPrice?: BigNumber;
  }): Promise<SignedTransaction> {
    try {
      if (!this.wallet || !this.provider) {
        throw new Error('Wallet not connected');
      }

      console.log('Signing transaction:', transaction);

      // Get nonce if not provided
      const nonce = transaction.nonce || await this.provider.getTransactionCount(this.wallet.address);
      
      // Get gas price if not provided
      const gasPrice = transaction.gasPrice || await this.provider.getGasPrice();
      
      // Estimate gas limit if not provided
      const gasLimit = transaction.gasLimit || await this.provider.estimateGas({
        from: this.wallet.address,
        to: transaction.to,
        value: transaction.value,
        data: transaction.data || '0x'
      });

      // Create transaction object
      const tx = {
        to: transaction.to,
        value: transaction.value,
        data: transaction.data || '0x',
        nonce,
        gasLimit,
        gasPrice,
        chainId: (await this.provider.getNetwork()).chainId
      };

      // Sign transaction
      const signedTx = await this.wallet.signTransaction(tx);
      const txHash = utils.keccak256(signedTx);

      const result: SignedTransaction = {
        hash: txHash,
        data: signedTx,
        signature: signedTx.slice(2) // Remove '0x' prefix
      };

      console.log('Transaction signed:', result);
      return result;
    } catch (error) {
      console.error('Error signing transaction:', error);
      toast.error('Failed to sign transaction');
      throw error;
    }
  }

  async getAccounts(): Promise<string[]> {
    try {
      if (!this.wallet) {
        throw new Error('Wallet not connected');
      }

      return [this.wallet.address];
    } catch (error) {
      console.error('Error getting accounts:', error);
      throw error;
    }
  }

  async getBalance(address?: string): Promise<BigNumber> {
    try {
      if (!this.provider) {
        throw new Error('Provider not initialized');
      }

      const targetAddress = address || this.wallet?.address;
      if (!targetAddress) {
        throw new Error('No address provided');
      }

      const balance = await this.provider.getBalance(targetAddress);
      return balance;
    } catch (error) {
      console.error('Error getting balance:', error);
      throw error;
    }
  }

  isConnected(): boolean {
    return !!this.wallet && !!this.provider;
  }

  getAddress(): string | null {
    return this.wallet?.address || null;
  }
} 