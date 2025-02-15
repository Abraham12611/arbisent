import { providers, BigNumber } from 'ethers';
import { OneinchConfigManager } from './config';
import axios from 'axios';
import { toast } from 'sonner';

export interface LiquiditySource {
  protocol: string;
  address: string;
  chainId: number;
  tokens: string[];
  liquidity: BigNumber;
  volume24h: BigNumber;
}

export interface LiquidityPool {
  address: string;
  token0: string;
  token1: string;
  reserve0: BigNumber;
  reserve1: BigNumber;
  fee: number;
  protocol: string;
}

export interface PriceQuote {
  sourceToken: string;
  targetToken: string;
  sourceAmount: BigNumber;
  targetAmount: BigNumber;
  priceImpact: number;
  path: string[];
  protocols: string[];
  estimatedGas: BigNumber;
}

export interface AggregatedLiquidity {
  pools: LiquidityPool[];
  totalLiquidity: BigNumber;
  bestPrice: BigNumber;
  priceImpact: number;
  estimatedGas: BigNumber;
}

export class LiquidityAggregator {
  private static instance: LiquidityAggregator;
  private configManager: OneinchConfigManager;
  private liquiditySources: Map<number, LiquiditySource[]>;
  private poolCache: Map<string, LiquidityPool>;

  private constructor() {
    this.configManager = OneinchConfigManager.getInstance();
    this.liquiditySources = new Map();
    this.poolCache = new Map();
  }

  static getInstance(): LiquidityAggregator {
    if (!LiquidityAggregator.instance) {
      LiquidityAggregator.instance = new LiquidityAggregator();
    }
    return LiquidityAggregator.instance;
  }

  async initialize(): Promise<void> {
    try {
      console.log('Initializing liquidity aggregator...');
      
      // Initialize liquidity sources for each supported network
      const config = this.configManager.getConfig();
      for (const chainId of config.supportedNetworks) {
        await this.updateLiquiditySources(chainId);
      }

      // Set up periodic updates
      setInterval(() => {
        this.updateAllLiquiditySources();
      }, 5 * 60 * 1000); // Update every 5 minutes

      console.log('Liquidity aggregator initialized successfully');
    } catch (error) {
      console.error('Error initializing liquidity aggregator:', error);
      throw error;
    }
  }

  async getQuote(
    chainId: number,
    sourceToken: string,
    targetToken: string,
    amount: BigNumber
  ): Promise<PriceQuote> {
    try {
      const apiUrl = this.configManager.getFusionApiUrl(chainId);
      const apiKey = this.configManager.getConfig().apiKey;

      // Get quote from 1inch API
      const response = await axios.get(`${apiUrl}/quote`, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
        params: {
          fromTokenAddress: sourceToken,
          toTokenAddress: targetToken,
          amount: amount.toString(),
          protocols: 'all'
        }
      });

      return {
        sourceToken,
        targetToken,
        sourceAmount: BigNumber.from(response.data.fromTokenAmount),
        targetAmount: BigNumber.from(response.data.toTokenAmount),
        priceImpact: response.data.estimatedPriceImpact,
        path: response.data.protocols.flat(),
        protocols: [...new Set(response.data.protocols.flat().map((p: any) => p.name))],
        estimatedGas: BigNumber.from(response.data.estimatedGas)
      };
    } catch (error) {
      console.error('Error getting quote:', error);
      toast.error('Failed to get price quote');
      throw error;
    }
  }

  async getAggregatedLiquidity(
    chainId: number,
    sourceToken: string,
    targetToken: string
  ): Promise<AggregatedLiquidity> {
    try {
      const sources = await this.getLiquiditySources(chainId);
      const relevantPools = await this.findRelevantPools(chainId, sourceToken, targetToken);
      
      // Calculate total liquidity and best price
      const totalLiquidity = relevantPools.reduce(
        (sum, pool) => sum.add(pool.reserve0).add(pool.reserve1),
        BigNumber.from(0)
      );

      // Get a sample quote for price impact calculation
      const sampleAmount = BigNumber.from('1000000000000000000'); // 1 token
      const quote = await this.getQuote(chainId, sourceToken, targetToken, sampleAmount);

      return {
        pools: relevantPools,
        totalLiquidity,
        bestPrice: quote.targetAmount.mul(BigNumber.from('1000000000000000000')).div(sampleAmount),
        priceImpact: quote.priceImpact,
        estimatedGas: quote.estimatedGas
      };
    } catch (error) {
      console.error('Error getting aggregated liquidity:', error);
      throw error;
    }
  }

  private async updateLiquiditySources(chainId: number): Promise<void> {
    try {
      const apiUrl = this.configManager.getFusionApiUrl(chainId);
      const apiKey = this.configManager.getConfig().apiKey;

      // Get liquidity sources from 1inch API
      const response = await axios.get(`${apiUrl}/liquidity-sources`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });

      this.liquiditySources.set(chainId, response.data.protocols.map((protocol: any) => ({
        protocol: protocol.name,
        address: protocol.address,
        chainId,
        tokens: protocol.tokens,
        liquidity: BigNumber.from(protocol.liquidity),
        volume24h: BigNumber.from(protocol.volume24h)
      })));
    } catch (error) {
      console.error(`Error updating liquidity sources for chain ${chainId}:`, error);
    }
  }

  private async updateAllLiquiditySources(): Promise<void> {
    const config = this.configManager.getConfig();
    for (const chainId of config.supportedNetworks) {
      await this.updateLiquiditySources(chainId);
    }
  }

  private async getLiquiditySources(chainId: number): Promise<LiquiditySource[]> {
    const sources = this.liquiditySources.get(chainId);
    if (!sources) {
      await this.updateLiquiditySources(chainId);
      return this.liquiditySources.get(chainId) || [];
    }
    return sources;
  }

  private async findRelevantPools(
    chainId: number,
    sourceToken: string,
    targetToken: string
  ): Promise<LiquidityPool[]> {
    try {
      const apiUrl = this.configManager.getFusionApiUrl(chainId);
      const apiKey = this.configManager.getConfig().apiKey;

      // Get pools from 1inch API
      const response = await axios.get(`${apiUrl}/pools`, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
        params: {
          token0: sourceToken,
          token1: targetToken
        }
      });

      return response.data.pools.map((pool: any) => ({
        address: pool.address,
        token0: pool.token0,
        token1: pool.token1,
        reserve0: BigNumber.from(pool.reserve0),
        reserve1: BigNumber.from(pool.reserve1),
        fee: pool.fee,
        protocol: pool.protocol
      }));
    } catch (error) {
      console.error('Error finding relevant pools:', error);
      return [];
    }
  }
} 