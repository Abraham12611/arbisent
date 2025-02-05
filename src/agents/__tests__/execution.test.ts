import { describe, expect, test, beforeAll, jest } from '@jest/globals';
import { ChatOpenAI } from "@langchain/openai";
import { SolanaAgentKit } from "solana-agent-kit";
import ExecutionAgent from "../execution";

// Mock SolanaAgentKit
jest.mock('solana-agent-kit', () => {
  return {
    SolanaAgentKit: jest.fn().mockImplementation(() => ({
      getTokenInfo: jest.fn().mockResolvedValue({ symbol: 'SOL', decimals: 9 }),
      swapTokens: jest.fn().mockResolvedValue('mock_signature'),
    }))
  };
});

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

  test("should validate and execute trade parameters", async () => {
    const input = {
      strategy: {
        name: "Simple Arbitrage",
        description: "Buy low on DEX A, sell high on DEX B",
        entryConditions: ["Price difference > 0.5%"],
        exitConditions: ["After execution or timeout"]
      },
      parameters: {
        side: 'buy' as const,
        asset: "So11111111111111111111111111111111111111112", // Wrapped SOL
        amount: 1,
        price: 100,
        slippage: 0.5,
        dex: "Orca"
      }
    };

    const result = await agent.process(input);
    
    expect(result).toMatchObject({
      status: expect.any(String),
      metrics: {
        executionTime: expect.any(Number),
        priceImpact: expect.any(Number),
        fees: expect.any(Number)
      }
    });
  }, 60000);

  test("should handle invalid parameters", async () => {
    const input = {
      strategy: {},
      parameters: {
        side: 'buy' as const,
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
  }, 30000);

  test("should handle network errors gracefully", async () => {
    // Mock a network error
    jest.spyOn(SolanaAgentKit.prototype, 'swapTokens')
      .mockRejectedValueOnce(new Error('Network error'));

    const input = {
      strategy: {
        name: "Test Strategy"
      },
      parameters: {
        side: 'buy' as const,
        asset: "So11111111111111111111111111111111111111112",
        amount: 1,
        price: 100,
        slippage: 0.5,
        dex: "Orca"
      }
    };

    const result = await agent.process(input);
    expect(result.status).toBe('failed');
    expect(result.error).toContain('Network error');
  }, 30000);
}); 