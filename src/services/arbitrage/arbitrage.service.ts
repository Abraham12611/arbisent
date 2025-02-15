import { v4 as uuidv4 } from 'uuid';
import { DexPriceService } from './dex-price.service';
import { AaveFlashLoanService } from './aave-flash-loan.service';
import { BrowserProvider, type Signer, providers } from 'ethers';

interface DEXPrice {
  dex: string;
  price: number;
  liquidity: number;
}

// Mainnet Aave V3 Pool Address
const AAVE_V3_POOL_ADDRESS = '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2';

export interface ArbitrageOpportunity {
  id: string;
  pair: string;
  buyFrom: {
    dex: string;
    price: number;
  };
  sellAt: {
    dex: string;
    price: number;
  };
  profitPercentage: number;
  minAmount: number;
  estimatedGas: number;
  successChance: number;
}

export class ArbitrageService {
  private readonly MIN_PROFIT_PERCENTAGE = 0.5; // 0.5% minimum profit
  private readonly GAS_ESTIMATE = 0.01; // Estimated gas in ETH
  private dexPriceService: DexPriceService;
  private flashLoanService: AaveFlashLoanService;
  private provider: providers.JsonRpcProvider;
  private signer: Signer;

  constructor(provider?: providers.JsonRpcProvider, signer?: Signer) {
    // Initialize with default provider if not provided
    this.provider = provider || new providers.JsonRpcProvider('https://eth-mainnet.g.alchemy.com/v2/your-api-key');
    this.signer = signer || this.provider.getSigner();
    
    this.dexPriceService = new DexPriceService();
    this.flashLoanService = new AaveFlashLoanService(
      this.provider,
      this.signer,
      AAVE_V3_POOL_ADDRESS
    );
  }

  async scanForOpportunities(pair: string): Promise<ArbitrageOpportunity[]> {
    try {
      const prices = await this.dexPriceService.getPrices(pair);
      return this.findArbitrageOpportunities(pair, prices);
    } catch (error) {
      console.error('Error scanning for opportunities:', error);
      throw error;
    }
  }

  private findArbitrageOpportunities(
    pair: string,
    prices: DEXPrice[]
  ): ArbitrageOpportunity[] {
    const opportunities: ArbitrageOpportunity[] = [];

    // Compare prices between DEXes
    for (let i = 0; i < prices.length; i++) {
      for (let j = i + 1; j < prices.length; j++) {
        const buyPrice = prices[i];
        const sellPrice = prices[j];
        
        // Calculate profit percentage
        const profitPercentage = ((sellPrice.price - buyPrice.price) / buyPrice.price) * 100;
        
        if (Math.abs(profitPercentage) > this.MIN_PROFIT_PERCENTAGE) {
          // If profit is negative, swap buy and sell
          const [buy, sell] = profitPercentage > 0 
            ? [buyPrice, sellPrice]
            : [sellPrice, buyPrice];
          
          const actualProfit = Math.abs(profitPercentage);
          
          // Calculate minimum amount needed for profitable trade
          const gasInUSD = this.GAS_ESTIMATE * buy.price;
          const minAmount = (gasInUSD / (actualProfit / 100)) * 1.5; // 1.5x buffer
          
          // Calculate success chance based on liquidity and price impact
          const successChance = this.calculateSuccessChance(buy, sell, minAmount);
          
          opportunities.push({
            id: uuidv4(),
            pair,
            buyFrom: {
              dex: buy.dex,
              price: buy.price,
            },
            sellAt: {
              dex: sell.dex,
              price: sell.price,
            },
            profitPercentage: actualProfit,
            minAmount,
            estimatedGas: gasInUSD,
            successChance,
          });
        }
      }
    }

    // Sort by profit percentage
    return opportunities.sort((a, b) => b.profitPercentage - a.profitPercentage);
  }

  private calculateSuccessChance(
    buy: DEXPrice,
    sell: DEXPrice,
    amount: number
  ): number {
    const liquidityRatio = Math.min(buy.liquidity, sell.liquidity) / amount;
    const priceImpact = amount / Math.min(buy.liquidity, sell.liquidity) * 100;
    
    let chance = 100;
    
    // Reduce chance based on liquidity
    if (liquidityRatio < 10) chance -= 30;
    else if (liquidityRatio < 50) chance -= 15;
    
    // Reduce chance based on price impact
    if (priceImpact > 1) chance -= 30;
    else if (priceImpact > 0.5) chance -= 15;
    
    return Math.min(Math.max(Math.round(chance), 0), 100);
  }

  async executeArbitrage(opportunity: ArbitrageOpportunity): Promise<string> {
    try {
      return await this.flashLoanService.executeFlashLoan(opportunity);
    } catch (error) {
      console.error('Error executing arbitrage:', error);
      throw error;
    }
  }

  async estimateGas(opportunity: ArbitrageOpportunity): Promise<bigint> {
    try {
      return await this.flashLoanService.estimateGas(opportunity);
    } catch (error) {
      console.error('Error estimating gas:', error);
      throw error;
    }
  }
} 