import { describe, expect, test, beforeAll, jest } from '@jest/globals';
import { ChatOpenAI } from "@langchain/openai";
import { PublicKey } from "@solana/web3.js";
import ExecutionAgent from "../execution";
import { TradeParameters, TradeResult, TokenData } from "../execution/types";

// Mock Solana configuration
jest.mock('@/utils/solanaConfig', () => ({
  solanaConfig: {
    getConnection: jest.fn().mockReturnValue({
      getAccountInfo: jest.fn().mockResolvedValue({ data: new Uint8Array() })
    }),
    getAgentKit: jest.fn().mockReturnValue({
      trade: jest.fn().mockResolvedValue('mock_signature')
    })
  }
}));

describe("ExecutionAgent", () => {
  let agent: ExecutionAgent;

  beforeAll(() => {
    const llm = new ChatOpenAI({
      modelName: "gpt-4",
      temperature: 0.7,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    agent = new ExecutionAgent({ llm });
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
        asset: "So11111111111111111111111111111111111111112",
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
    jest.spyOn(console, 'error').mockImplementation(() => {}); // Suppress error logs
    
    // Mock a network error
    const mockError = new Error('Network error');
    jest.spyOn(agent['executor'], 'executeStrategy').mockRejectedValueOnce(mockError);

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