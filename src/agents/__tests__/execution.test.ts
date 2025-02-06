import { describe, expect, test, jest } from '@jest/globals';
import ExecutionAgent from '../execution';
import { ChatOpenAI } from "@langchain/openai";

describe('ExecutionAgent', () => {
  let agent: ExecutionAgent;
  
  beforeEach(() => {
    const mockLLM = new ChatOpenAI({
      modelName: "gpt-4",
      temperature: 0,
      openAIApiKey: "test-key"
    });
    agent = new ExecutionAgent({ llm: mockLLM });
  });

  test('processes valid strategy', async () => {
    const mockStrategy = {
      type: "arbitrage",
      parameters: {
        asset: "SOL",
        amount: 1.0,
        targetSpread: 0.02
      }
    };

    const result = await agent.process({
      strategy: mockStrategy,
      parameters: {
        side: 'buy',
        asset: 'So11111111111111111111111111111111111111112',
        amount: 1,
        price: 100,
        slippage: 0.01,
        dex: 'Orca'
      }
    });

    expect(result).toBeDefined();
    expect(result.status).toBeDefined();
  });
});