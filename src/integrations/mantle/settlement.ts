import { providers, Contract, BigNumber, utils } from 'ethers';
import { MantleConfigManager } from './config';
import { toast } from 'sonner';
import { Observable } from 'rxjs';

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: BigNumber;
  data: string;
  nonce: number;
}

export interface SettlementStatus {
  isSettled: boolean;
  blockNumber?: number;
  timestamp?: number;
  confirmations: number;
  error?: string;
}

export interface FeeStructure {
  baseFee: BigNumber;
  priorityFee: BigNumber;
  totalFee: BigNumber;
  estimatedCost: BigNumber;
}

export interface SettlementEvent {
  type: 'submitted' | 'confirmed' | 'settled' | 'failed';
  transaction: Transaction;
  status: SettlementStatus;
  timestamp: number;
}

export class SettlementService {
  private static instance: SettlementService;
  private configManager: MantleConfigManager;
  private settlementContract: Contract | null = null;
  private eventSubscribers: Map<string, ((event: SettlementEvent) => void)[]> = new Map();

  private constructor() {
    this.configManager = MantleConfigManager.getInstance();
  }

  static getInstance(): SettlementService {
    if (!SettlementService.instance) {
      SettlementService.instance = new SettlementService();
    }
    return SettlementService.instance;
  }

  async initialize(): Promise<void> {
    try {
      console.log('Initializing settlement service...');
      const network = this.configManager.getCurrentNetwork();
      
      // Initialize settlement contract
      this.settlementContract = new Contract(
        network.contractAddresses.settlement,
        [
          'function submitTransaction(bytes memory txData) public returns (bytes32)',
          'function confirmSettlement(bytes32 txHash) public view returns (bool)',
          'function getSettlementFees() public view returns (uint256, uint256)',
          'event TransactionSubmitted(bytes32 indexed txHash, address indexed from, uint256 timestamp)',
          'event TransactionSettled(bytes32 indexed txHash, uint256 blockNumber, uint256 timestamp)',
          'event SettlementFailed(bytes32 indexed txHash, string reason)'
        ],
        this.configManager.getProvider()
      );

      // Set up event listeners
      this.setupEventListeners();

      console.log('Settlement service initialized successfully');
    } catch (error) {
      console.error('Error initializing settlement service:', error);
      throw error;
    }
  }

  async submitTransaction(tx: Transaction): Promise<string> {
    try {
      if (!this.settlementContract) {
        throw new Error('Settlement contract not initialized');
      }

      console.log('Submitting transaction for settlement:', tx);
      
      // Encode transaction data
      const encodedTx = utils.defaultAbiCoder.encode(
        ['address', 'address', 'uint256', 'bytes', 'uint256'],
        [tx.from, tx.to, tx.value, tx.data, tx.nonce]
      );
      
      // Submit transaction to settlement contract
      const receipt = await this.settlementContract.submitTransaction(encodedTx);
      await receipt.wait();
      
      // Get transaction hash from event logs
      const txHash = receipt.logs[0].topics[1];
      
      console.log('Transaction submitted successfully:', txHash);
      toast.success('Transaction submitted for settlement');
      
      return txHash;
    } catch (error) {
      console.error('Error submitting transaction:', error);
      toast.error('Failed to submit transaction');
      throw error;
    }
  }

  async confirmSettlement(txHash: string): Promise<SettlementStatus> {
    try {
      if (!this.settlementContract) {
        throw new Error('Settlement contract not initialized');
      }

      console.log('Checking settlement status for:', txHash);
      
      // Get transaction receipt
      const provider = this.configManager.getProvider();
      const receipt = await provider.getTransactionReceipt(txHash);
      
      if (!receipt) {
        return {
          isSettled: false,
          confirmations: 0
        };
      }

      // Check if transaction is settled
      const isSettled = await this.settlementContract.confirmSettlement(txHash);
      
      const status: SettlementStatus = {
        isSettled,
        blockNumber: receipt.blockNumber,
        timestamp: (await provider.getBlock(receipt.blockNumber)).timestamp,
        confirmations: receipt.confirmations
      };

      console.log('Settlement status:', status);
      return status;
    } catch (error) {
      console.error('Error confirming settlement:', error);
      return {
        isSettled: false,
        confirmations: 0,
        error: error.message
      };
    }
  }

  async getSettlementFees(): Promise<FeeStructure> {
    try {
      if (!this.settlementContract) {
        throw new Error('Settlement contract not initialized');
      }

      console.log('Getting settlement fees...');
      
      // Get base and priority fees from contract
      const [baseFee, priorityFee] = await this.settlementContract.getSettlementFees();
      
      // Calculate total fee and estimated cost
      const totalFee = baseFee.add(priorityFee);
      const estimatedCost = totalFee.mul(21000); // Estimate for basic transfer
      
      const fees: FeeStructure = {
        baseFee,
        priorityFee,
        totalFee,
        estimatedCost
      };

      console.log('Settlement fees:', fees);
      return fees;
    } catch (error) {
      console.error('Error getting settlement fees:', error);
      throw error;
    }
  }

  monitorSettlement(txHash: string): Observable<SettlementEvent> {
    return new Observable(subscriber => {
      if (!this.settlementContract) {
        subscriber.error(new Error('Settlement contract not initialized'));
        return;
      }

      console.log('Starting settlement monitoring for:', txHash);
      
      // Add subscriber to event map
      const eventHandler = (event: SettlementEvent) => {
        if (event.transaction.hash === txHash) {
          subscriber.next(event);
          if (event.type === 'settled' || event.type === 'failed') {
            subscriber.complete();
          }
        }
      };

      if (!this.eventSubscribers.has(txHash)) {
        this.eventSubscribers.set(txHash, []);
      }
      this.eventSubscribers.get(txHash)?.push(eventHandler);

      // Cleanup function
      return () => {
        const handlers = this.eventSubscribers.get(txHash) || [];
        this.eventSubscribers.set(
          txHash,
          handlers.filter(h => h !== eventHandler)
        );
      };
    });
  }

  private setupEventListeners(): void {
    if (!this.settlementContract) return;

    this.settlementContract.on('TransactionSubmitted', (txHash, from, timestamp) => {
      this.notifySubscribers(txHash, {
        type: 'submitted',
        transaction: { hash: txHash, from },
        status: { isSettled: false, confirmations: 0 },
        timestamp: timestamp.toNumber()
      });
    });

    this.settlementContract.on('TransactionSettled', (txHash, blockNumber, timestamp) => {
      this.notifySubscribers(txHash, {
        type: 'settled',
        transaction: { hash: txHash },
        status: { isSettled: true, blockNumber: blockNumber.toNumber(), confirmations: 1 },
        timestamp: timestamp.toNumber()
      });
    });

    this.settlementContract.on('SettlementFailed', (txHash, reason) => {
      this.notifySubscribers(txHash, {
        type: 'failed',
        transaction: { hash: txHash },
        status: { isSettled: false, confirmations: 0, error: reason },
        timestamp: Date.now()
      });
    });
  }

  private notifySubscribers(txHash: string, event: SettlementEvent): void {
    const handlers = this.eventSubscribers.get(txHash) || [];
    handlers.forEach(handler => handler(event));
  }
} 