import { providers, Contract, BigNumber, utils } from 'ethers';
import { CrossMintConfigManager } from './config';
import { UnifiedWalletManager } from './wallet';
import { toast } from 'sonner';
import { Observable } from 'rxjs';

export interface SwapAsset {
  chainId: number;
  tokenAddress: string;
  amount: BigNumber;
  decimals: number;
}

export interface SwapQuote {
  sourceAsset: SwapAsset;
  targetAsset: SwapAsset;
  executionPrice: BigNumber;
  priceImpact: number;
  estimatedGas: BigNumber;
  routerAddress: string;
  deadline: number;
  path: string[];
}

export interface SwapResult {
  sourceTxHash: string;
  targetTxHash: string;
  sourceAsset: SwapAsset;
  targetAsset: SwapAsset;
  executionPrice: BigNumber;
  timestamp: number;
}

export interface SwapEvent {
  type: 'initiated' | 'source_confirmed' | 'target_confirmed' | 'completed' | 'failed';
  result?: SwapResult;
  error?: string;
  timestamp: number;
}

export class AtomicSwapService {
  private static instance: AtomicSwapService;
  private configManager: CrossMintConfigManager;
  private walletManager: UnifiedWalletManager;
  private swapContracts: Map<number, Contract> = new Map();
  private eventSubscribers: Map<string, ((event: SwapEvent) => void)[]> = new Map();

  private constructor() {
    this.configManager = CrossMintConfigManager.getInstance();
    this.walletManager = UnifiedWalletManager.getInstance();
  }

  static getInstance(): AtomicSwapService {
    if (!AtomicSwapService.instance) {
      AtomicSwapService.instance = new AtomicSwapService();
    }
    return AtomicSwapService.instance;
  }

  async initialize(): Promise<void> {
    try {
      console.log('Initializing atomic swap service...');
      
      // Initialize contracts for each supported chain
      const supportedChains = this.configManager.getConfig().supportedChains;
      
      for (const chainId of supportedChains) {
        const contract = new Contract(
          this.getSwapContractAddress(chainId),
          [
            'function getSwapQuote(address sourceToken, address targetToken, uint256 amount) view returns (tuple(uint256 price, uint256 impact, uint256 gas, address router, uint256 deadline, address[] path))',
            'function executeSwap(address sourceToken, address targetToken, uint256 amount, uint256 minReturn, uint256 deadline) payable returns (bytes32)',
            'function getSwapStatus(bytes32 swapId) view returns (uint8)',
            'event SwapInitiated(bytes32 indexed swapId, address indexed sourceToken, address indexed targetToken, uint256 amount)',
            'event SwapCompleted(bytes32 indexed swapId, uint256 returnAmount)',
            'event SwapFailed(bytes32 indexed swapId, string reason)'
          ],
          this.configManager.getProvider()
        );

        this.swapContracts.set(chainId, contract);
      }

      console.log('Atomic swap service initialized successfully');
    } catch (error) {
      console.error('Error initializing atomic swap service:', error);
      throw error;
    }
  }

  async getQuote(sourceAsset: SwapAsset, targetAsset: SwapAsset): Promise<SwapQuote> {
    try {
      if (!this.swapContracts.has(sourceAsset.chainId)) {
        throw new Error(`No swap contract for chain ${sourceAsset.chainId}`);
      }

      const contract = this.swapContracts.get(sourceAsset.chainId)!;
      
      const quote = await contract.getSwapQuote(
        sourceAsset.tokenAddress,
        targetAsset.tokenAddress,
        sourceAsset.amount
      );

      return {
        sourceAsset,
        targetAsset,
        executionPrice: quote.price,
        priceImpact: quote.impact.toNumber() / 10000, // Convert from basis points
        estimatedGas: quote.gas,
        routerAddress: quote.router,
        deadline: quote.deadline.toNumber(),
        path: quote.path
      };
    } catch (error) {
      console.error('Error getting swap quote:', error);
      throw error;
    }
  }

  async executeSwap(quote: SwapQuote, minReturn: BigNumber): Promise<string> {
    try {
      if (!this.swapContracts.has(quote.sourceAsset.chainId)) {
        throw new Error(`No swap contract for chain ${quote.sourceAsset.chainId}`);
      }

      // Ensure wallet is connected and on correct chain
      if (!this.walletManager.isConnected(quote.sourceAsset.chainId)) {
        throw new Error(`Wallet not connected for chain ${quote.sourceAsset.chainId}`);
      }

      await this.walletManager.switchChain(quote.sourceAsset.chainId);

      const contract = this.swapContracts.get(quote.sourceAsset.chainId)!;
      
      // Execute the swap
      const tx = await contract.executeSwap(
        quote.sourceAsset.tokenAddress,
        quote.targetAsset.tokenAddress,
        quote.sourceAsset.amount,
        minReturn,
        quote.deadline,
        { gasLimit: quote.estimatedGas.mul(120).div(100) } // Add 20% buffer
      );

      const receipt = await tx.wait();
      const swapId = receipt.logs[0].topics[1];

      console.log('Swap initiated:', swapId);
      toast.success('Cross-chain swap initiated');

      return swapId;
    } catch (error) {
      console.error('Error executing swap:', error);
      toast.error('Failed to execute swap');
      throw error;
    }
  }

  monitorSwap(swapId: string): Observable<SwapEvent> {
    return new Observable(subscriber => {
      if (!this.swapContracts.size) {
        subscriber.error(new Error('Swap service not initialized'));
        return;
      }

      console.log('Starting swap monitoring for:', swapId);
      
      // Add subscriber to event map
      const eventHandler = (event: SwapEvent) => {
        subscriber.next(event);
        if (event.type === 'completed' || event.type === 'failed') {
          subscriber.complete();
        }
      };

      if (!this.eventSubscribers.has(swapId)) {
        this.eventSubscribers.set(swapId, []);
      }
      this.eventSubscribers.get(swapId)?.push(eventHandler);

      // Set up contract event listeners
      this.setupSwapEventListeners(swapId);

      // Cleanup function
      return () => {
        const handlers = this.eventSubscribers.get(swapId) || [];
        this.eventSubscribers.set(
          swapId,
          handlers.filter(h => h !== eventHandler)
        );
      };
    });
  }

  private getSwapContractAddress(chainId: number): string {
    // Return appropriate swap contract address for each chain
    const addresses: { [key: number]: string } = {
      1: '0x...', // Ethereum
      137: '0x...', // Polygon
      5000: '0x...', // Mantle
      56: '0x...', // BSC
      43114: '0x...', // Avalanche
      42161: '0x...' // Arbitrum
    };

    const address = addresses[chainId];
    if (!address) {
      throw new Error(`No swap contract address for chain ${chainId}`);
    }

    return address;
  }

  private setupSwapEventListeners(swapId: string): void {
    // Listen for events on all chains
    this.swapContracts.forEach((contract, chainId) => {
      contract.on('SwapInitiated', (eventSwapId, sourceToken, targetToken, amount) => {
        if (eventSwapId === swapId) {
          this.notifySubscribers(swapId, {
            type: 'initiated',
            timestamp: Date.now()
          });
        }
      });

      contract.on('SwapCompleted', (eventSwapId, returnAmount) => {
        if (eventSwapId === swapId) {
          this.notifySubscribers(swapId, {
            type: 'completed',
            result: {
              sourceTxHash: swapId,
              targetTxHash: swapId,
              sourceAsset: {} as SwapAsset, // Fill with actual data
              targetAsset: {} as SwapAsset, // Fill with actual data
              executionPrice: returnAmount,
              timestamp: Date.now()
            },
            timestamp: Date.now()
          });
        }
      });

      contract.on('SwapFailed', (eventSwapId, reason) => {
        if (eventSwapId === swapId) {
          this.notifySubscribers(swapId, {
            type: 'failed',
            error: reason,
            timestamp: Date.now()
          });
        }
      });
    });
  }

  private notifySubscribers(swapId: string, event: SwapEvent): void {
    const handlers = this.eventSubscribers.get(swapId) || [];
    handlers.forEach(handler => handler(event));
  }
} 