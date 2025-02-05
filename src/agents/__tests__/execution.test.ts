import { describe, expect, test, beforeAll, jest } from '@jest/globals';
import { ChatOpenAI } from "@langchain/openai";
import { SolanaAgentKit } from "solana-agent-kit";
import { PublicKey } from "@solana/web3.js";
import ExecutionAgent from "../execution";

// Define types for mocked functions
interface TokenInfo {
  symbol: string;
  decimals: number;
}

interface SwapParams {
  fromMint: PublicKey;
  toMint: PublicKey;
  amount: number;
  slippage: number;
  priorityFee?: number;
}

// Mock SolanaAgentKit with proper types
jest.mock('solana-agent-kit', () => {
  return {
    SolanaAgentKit: jest.fn().mockImplementation(() => ({
      getTokenInfo: jest.fn().mockResolvedValue<TokenInfo>({ 
        symbol: 'SOL', 
        decimals: 9 
      }),
      swapTokens: jest.fn().mockImplementation(async (params: SwapParams): Promise<string> => {
        return 'mock_signature';
      }),
    }))
  };
});

describe("ExecutionAgent", () => {
  let agent: ExecutionAgent;
  let mockSolanaKit: jest.Mocked<SolanaAgentKit>;

  beforeAll(() => {
    const llm = new ChatOpenAI({
      modelName: "gpt-4",
      temperature: 0.7,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    mockSolanaKit = new SolanaAgentKit(
      process.env.SOLANA_PRIVATE_KEY!,
      process.env.RPC_URL!,
      process.env.OPENAI_API_KEY!
    ) as jest.Mocked<SolanaAgentKit>;

    agent = new ExecutionAgent({ solanaKit: mockSolanaKit, llm });
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
    // Mock a network error with proper typing
    const mockSwapTokens = jest.spyOn(mockSolanaKit, 'swapTokens');
    mockSwapTokens.mockRejectedValueOnce(new Error('Network error'));

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