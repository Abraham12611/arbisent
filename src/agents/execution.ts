import { PublicKey } from "@solana/web3.js";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { solanaConfig } from "@/utils/solanaConfig";
import { toast } from "sonner";

interface TradeParameters {
  side: 'buy' | 'sell';
  asset: string;
  amount: number;
  price: number;
  slippage: number;
  dex: string;
}

interface TradeResult {
  status: 'success' | 'failed';
  signature?: string;
  error?: string;
  metrics: {
    executionTime: number;
    priceImpact: number;
    fees: number;
  };
}

interface TokenData {
  symbol: string;
  decimals: number;
}

class ExecutionAgent {
  private llm: ChatOpenAI;

  constructor(config: {
    llm: ChatOpenAI;
  }) {
    this.llm = config.llm;
    console.log('Initializing ExecutionAgent with Solana configuration');
  }

  async process(input: {
    strategy: any;
    parameters: TradeParameters;
  }): Promise<TradeResult> {
    try {
      console.log('Processing trade execution:', input);
      
      // Validate trade parameters
      await this.validateTradeParameters(input.parameters);

      // Execute trade based on strategy
      const startTime = Date.now();
      const result = await this.executeStrategy(input.strategy, input.parameters);
      const executionTime = Date.now() - startTime;

      // Log trade outcome
      await this.logTradeOutcome({
        ...result,
        metrics: {
          ...result.metrics,
          executionTime
        }
      });

      return result;
    } catch (error: any) {
      console.error('Trade execution failed:', error);
      toast.error(`Trade execution failed: ${error.message}`);
      return {
        status: 'failed',
        error: error?.message || 'Unknown error',
        metrics: {
          executionTime: 0,
          priceImpact: 0,
          fees: 0
        }
      };
    }
  }

  private async validateTradeParameters(params: TradeParameters): Promise<void> {
    console.log('Validating trade parameters:', params);
    
    try {
      // Validate asset exists
      const assetPubkey = new PublicKey(params.asset);
      const connection = solanaConfig.getConnection();
      const accountInfo = await connection.getAccountInfo(assetPubkey);
      
      if (!accountInfo) {
        throw new Error(`Invalid asset: ${params.asset}`);
      }

      // Validate price and amount
      if (params.price <= 0 || params.amount <= 0) {
        throw new Error('Invalid price or amount');
      }

      // Validate slippage
      if (params.slippage < 0 || params.slippage > 100) {
        throw new Error('Invalid slippage percentage');
      }

      console.log('Trade parameters validated successfully');
    } catch (error: any) {
      console.error('Parameter validation failed:', error);
      throw new Error(`Parameter validation failed: ${error.message}`);
    }
  }

  private async executeStrategy(
    strategy: any,
    params: TradeParameters
  ): Promise<TradeResult> {
    console.log('Executing strategy:', { strategy, params });
    
    const { side, asset, amount, price, slippage, dex } = params;

    try {
      // Get Solana configuration
      const agentKit = solanaConfig.getAgentKit();

      // Convert strategy to executable parameters using LLM
      const executionPrompt = PromptTemplate.fromTemplate(`
        Convert this trading strategy into specific execution parameters:
        Strategy: {strategy}
        Side: {side}
        Asset: {asset}
        Amount: {amount}
        Target Price: {price}
        Maximum Slippage: {slippage}%
        DEX: {dex}

        Provide execution parameters in this format:
        {format_instructions}
      `);

      const formatInstructions = `{
        "orderType": "limit" | "market",
        "urgency": "low" | "medium" | "high",
        "splitOrders": boolean,
        "maxPriceImpact": number
      }`;

      const formattedPrompt = await executionPrompt.format({
        strategy: JSON.stringify(strategy),
        side,
        asset,
        amount,
        price,
        slippage,
        dex,
        format_instructions: formatInstructions
      });

      const executionParams = JSON.parse(await this.llm.predict(formattedPrompt));
      console.log('Generated execution parameters:', executionParams);

      // Execute trade using Solana Agent Kit
      if (side === 'buy') {
        const signature = await agentKit.trade(
          new PublicKey(asset), // outputMint
          amount,
          new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"), // inputMint (USDC)
          slippage * 100 // convert percentage to basis points
        );

        console.log('Buy trade executed successfully:', signature);
        return {
          status: 'success',
          signature,
          metrics: {
            executionTime: 0,
            priceImpact: await this.calculatePriceImpact(signature),
            fees: await this.calculateFees(signature)
          }
        };
      } else {
        // Sell implementation
        const signature = await agentKit.trade(
          new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"), // outputMint (USDC)
          amount,
          new PublicKey(asset), // inputMint
          slippage * 100 // convert percentage to basis points
        );

        console.log('Sell trade executed successfully:', signature);
        return {
          status: 'success',
          signature,
          metrics: {
            executionTime: 0,
            priceImpact: await this.calculatePriceImpact(signature),
            fees: await this.calculateFees(signature)
          }
        };
      }
    } catch (error: any) {
      console.error('Strategy execution failed:', error);
      throw new Error(`Strategy execution failed: ${error.message}`);
    }
  }

  private async calculatePriceImpact(signature: string): Promise<number> {
    // Implement price impact calculation using transaction data
    return 0.1; // Placeholder
  }

  private async calculateFees(signature: string): Promise<number> {
    // Implement fee calculation using transaction data
    return 0.001; // Placeholder
  }

  private async logTradeOutcome(result: TradeResult): Promise<void> {
    console.log('Logging trade outcome:', result);
    // Implement trade logging
    // This could be expanded to store in Supabase or emit events
  }
}

export default ExecutionAgent;