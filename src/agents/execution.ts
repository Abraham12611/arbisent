import { ChatOpenAI } from "@langchain/openai";
import { TradeParameters, TradeResult, ExecutionConfig } from "./execution/types";
import { TradeValidator } from "./execution/validator";
import { TradeExecutor } from "./execution/trader";
import { TradeLogger } from "./execution/logger";
import { toast } from "sonner";

class ExecutionAgent {
  private validator: TradeValidator;
  private executor: TradeExecutor;
  private logger: TradeLogger;

  constructor(config: ExecutionConfig) {
    this.validator = new TradeValidator();
    this.executor = new TradeExecutor(config.llm);
    this.logger = new TradeLogger();
    console.log('Initializing ExecutionAgent with Solana configuration');
  }

  async process(input: {
    strategy: any;
    parameters: TradeParameters;
  }): Promise<TradeResult> {
    try {
      console.log('Processing trade execution:', input);
      
      // Validate trade parameters
      await this.validator.validateTradeParameters(input.parameters);

      // Execute trade based on strategy
      const startTime = Date.now();
      const result = await this.executor.executeStrategy(input.strategy, input.parameters);
      const executionTime = Date.now() - startTime;

      // Log trade outcome
      await this.logger.logTradeOutcome({
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
}

export default ExecutionAgent;