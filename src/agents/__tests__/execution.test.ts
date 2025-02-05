import { describe, expect, test, beforeAll } from '@jest/globals';
import { ChatOpenAI } from "@langchain/openai";
import { SolanaAgentKit } from "solana-agent-kit";
import ExecutionAgent from "../execution";

describe("ExecutionAgent", () => {
  let agent: ExecutionAgent;

  beforeAll(() => {
    const llm = new ChatOpenAI({
      modelName: "gpt-4",
      temperature: 0.7,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    const solanaKit = new SolanaAgentKit(
      process.env.SOLANA_PRIVATE_KEY!,
      process.env.RPC_URL!,
      process.env.OPENAI_API_KEY!
    );

    agent = new ExecutionAgent({ solanaKit, llm });
  });

  test("should validate trade parameters", async () => {
    const input = {
      strategy: {
        name: "Simple Arbitrage",
        description: "Buy low on DEX A, sell high on DEX B",
        entryConditions: ["Price difference > 0.5%"],
        exitConditions: ["After execution or timeout"]
      },
      parameters: {
        side: 'buy',
        asset: "So11111111111111111111111111111111111111112", // Wrapped SOL
        amount: 1,
        price: 100,
        slippage: 0.5,
        dex: "Orca"
      }
    };

    const result = await agent.process(input);
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('metrics');
  }, 60000);

  test("should handle invalid parameters", async () => {
    const input = {
      strategy: {},
      parameters: {
        side: 'buy',
        asset: "invalid_address",
        amount: -1,
        price: 0,
        slippage: 101,
        dex: "Unknown"
      }
    };

    const result = await agent.process(input);
    expect(result.status).toBe('failed');
    expect(result.error).toBeDefined();
  });
}); 