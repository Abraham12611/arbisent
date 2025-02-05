import { SolanaAgentKit } from "solana-agent-kit";
import { PublicKey } from "@solana/web3.js";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";

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

interface ExtendedSolanaAgentKit extends SolanaAgentKit {
  getTokenDataByAddress: (address: string) => Promise<TokenData>;
}

class ExecutionAgent {
  private solanaKit: ExtendedSolanaAgentKit;
  private llm: ChatOpenAI;

  constructor(config: {
    solanaKit: SolanaAgentKit;
    llm: ChatOpenAI;
  }) {
    this.solanaKit = config.solanaKit as ExtendedSolanaAgentKit;
    this.llm = config.llm;
  }

  async process(input: {
    strategy: any;
    parameters: TradeParameters;
  }): Promise<TradeResult> {
    try {
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
    } catch (error: any) { // Type assertion for error
      console.error('Trade execution failed:', error);
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
    // Validate asset exists
    const assetPubkey = new PublicKey(params.asset);
    const tokenData = await this.solanaKit.getTokenDataByAddress(params.asset);
    if (!tokenData) {
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
  }

  private async executeStrategy(
    strategy: any,
    params: TradeParameters
  ): Promise<TradeResult> {
    const { side, asset, amount, price, slippage, dex } = params;

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

    // Execute trade using Solana Agent Kit
    try {
      if (side === 'buy') {
        const signature = await this.solanaKit.trade(
          new PublicKey(asset), // outputMint
          amount,
          new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"), // inputMint (USDC)
          slippage * 100 // convert percentage to basis points
        );

        return {
          status: 'success',
          signature,
          metrics: {
            executionTime: 0, // Will be set by process method
            priceImpact: await this.calculatePriceImpact(signature),
            fees: await this.calculateFees(signature)
          }
        };
      } else {
        // Sell implementation
        const signature = await this.solanaKit.trade(
          new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"), // outputMint (USDC)
          amount,
          new PublicKey(asset), // inputMint
          slippage * 100 // convert percentage to basis points
        );

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
    } catch (error: any) { // Type assertion for error
      throw new Error(`Trade execution failed: ${error?.message || 'Unknown error'}`);
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
    // Implement trade logging
    console.log('Trade executed:', {
      status: result.status,
      signature: result.signature,
      metrics: result.metrics
    });
  }
}

export default ExecutionAgent; 