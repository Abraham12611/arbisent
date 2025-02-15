import { providers, Contract } from 'ethers';
import { MantleConfigManager, MANTLE_NETWORKS } from './config';
import { toast } from 'sonner';

export type NetworkInfo = {
  chainId: number;
  name: string;
  rpcUrl: string;
};

export type EventHandler = (event: any) => void;

export class MantleConnectionManager {
  private static instance: MantleConnectionManager;
  private configManager: MantleConfigManager;
  private eventHandlers: Map<string, EventHandler[]> = new Map();
  private reconnectAttempts: number = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 3;

  private constructor() {
    this.configManager = MantleConfigManager.getInstance();
  }

  static getInstance(): MantleConnectionManager {
    if (!MantleConnectionManager.instance) {
      MantleConnectionManager.instance = new MantleConnectionManager();
    }
    return MantleConnectionManager.instance;
  }

  async connect(): Promise<boolean> {
    try {
      const provider = this.configManager.getProvider();
      await provider.ready;

      // Set up provider event listeners
      provider.on('network', (newNetwork, oldNetwork) => {
        this.handleNetworkChange(newNetwork, oldNetwork);
      });

      provider.on('error', this.handleError.bind(this));

      console.log('Connected to Mantle Network successfully');
      return true;
    } catch (error) {
      console.error('Error connecting to Mantle Network:', error);
      this.handleConnectionError(error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    try {
      const provider = this.configManager.getProvider();
      provider.removeAllListeners();
      
      // Clean up event handlers
      this.eventHandlers.clear();
      
      console.log('Disconnected from Mantle Network');
    } catch (error) {
      console.error('Error disconnecting from Mantle Network:', error);
      throw error;
    }
  }

  async switchNetwork(network: keyof typeof MANTLE_NETWORKS): Promise<void> {
    try {
      await this.disconnect();
      await this.configManager.switchNetwork(network);
      await this.connect();
      
      toast.success(`Switched to Mantle ${network}`);
    } catch (error) {
      console.error('Error switching Mantle network:', error);
      toast.error('Failed to switch Mantle network');
      throw error;
    }
  }

  getProvider(): providers.JsonRpcProvider {
    return this.configManager.getProvider();
  }

  getNetwork(): NetworkInfo {
    const network = this.configManager.getCurrentNetwork();
    return {
      chainId: network.chainId,
      name: network === MANTLE_NETWORKS.MAINNET ? 'Mantle Mainnet' : 'Mantle Testnet',
      rpcUrl: network.rpcUrl
    };
  }

  subscribeToEvents(eventName: string, handler: EventHandler): void {
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, []);
    }
    this.eventHandlers.get(eventName)?.push(handler);
  }

  unsubscribeFromEvents(eventName: string, handler: EventHandler): void {
    const handlers = this.eventHandlers.get(eventName);
    if (handlers) {
      this.eventHandlers.set(
        eventName,
        handlers.filter(h => h !== handler)
      );
    }
  }

  private async handleNetworkChange(newNetwork: any, oldNetwork: any): Promise<void> {
    console.log('Network changed:', { old: oldNetwork, new: newNetwork });
    
    // Notify all network change subscribers
    const handlers = this.eventHandlers.get('networkChange') || [];
    handlers.forEach(handler => handler({ oldNetwork, newNetwork }));
  }

  private async handleConnectionError(error: any): Promise<void> {
    console.error('Connection error:', error);

    if (this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS})...`);
      
      // Exponential backoff
      const backoffTime = Math.pow(2, this.reconnectAttempts) * 1000;
      await new Promise(resolve => setTimeout(resolve, backoffTime));
      
      await this.connect();
    } else {
      console.error('Max reconnection attempts reached');
      toast.error('Failed to connect to Mantle Network');
      
      // Notify error subscribers
      const handlers = this.eventHandlers.get('error') || [];
      handlers.forEach(handler => handler(error));
    }
  }

  private handleError(error: Error): void {
    console.error('Provider error:', error);
    
    // Notify error subscribers
    const handlers = this.eventHandlers.get('error') || [];
    handlers.forEach(handler => handler(error));
  }
} 