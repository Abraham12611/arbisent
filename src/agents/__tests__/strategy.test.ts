import { describe, expect, test, beforeAll } from '@jest/globals';
import { ChatOpenAI } from "@langchain/openai";
import { Document } from "@langchain/core/documents";
import StrategyAgent from "../strategy";

describe("StrategyAgent", () => {
  let agent: StrategyAgent;

  beforeAll(() => {
    const llm = new ChatOpenAI({
      modelName: "gpt-4",
      temperature: 0.7,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    agent = new StrategyAgent(llm);
  });

  test("should generate strategy and risk assessment", async () => {
    const input = {
      marketData: {
        asset: "SOL/USDC",
        price: 100,
        volume: 1000000,
        exchanges: {
          "DEX_A": 99.5,
          "DEX_B": 100.2
        }
      },
      research: [
        new Document({
          pageContent: "Cross-exchange arbitrage typically requires 0.5-1% price difference to be profitable after fees.",
          metadata: { source: "trading-strategy" }
        })
      ],
      sentiment: {
        overall: "positive",
        confidence: 0.8,
        volume: "high"
      }
    };

    const result = await agent.process(input);

    // Test strategy structure
    expect(result.strategy).toMatchObject({
      name: expect.any(String),
      description: expect.any(String),
      entryConditions: expect.arrayContaining([expect.any(String)]),
      exitConditions: expect.arrayContaining([expect.any(String)]),
      positionSize: expect.any(String),
      expectedReturn: expect.any(String),
      timeframe: expect.any(String)
    });

    // Test risk assessment structure
    expect(result.riskAssessment).toMatchObject({
      riskLevel: expect.stringMatching(/^(low|medium|high)$/),
      confidenceScore: expect.any(Number),
      potentialRisks: expect.arrayContaining([expect.any(String)]),
      mitigationStrategies: expect.arrayContaining([expect.any(String)])
    });

    // Validate confidence score range
    expect(result.riskAssessment.confidenceScore).toBeGreaterThanOrEqual(0);
    expect(result.riskAssessment.confidenceScore).toBeLessThanOrEqual(100);
  }, 60000); // Increased timeout to 60 seconds

  test("should handle minimal market data", async () => {
    const input = {
      marketData: {
        asset: "BTC/USDT",
        price: 50000
      },
      research: [],
      sentiment: {
        overall: "neutral",
        confidence: 0.5
      }
    };

    const result = await agent.process(input);
    expect(result).toHaveProperty('strategy');
    expect(result).toHaveProperty('riskAssessment');
  }, 60000);

  test("should consider market sentiment in risk assessment", async () => {
    const input = {
      marketData: {
        asset: "ETH/USDC",
        price: 2000
      },
      research: [],
      sentiment: {
        overall: "negative",
        confidence: 0.9,
        volume: "low"
      }
    };

    const result = await agent.process(input);
    expect(result.riskAssessment.riskLevel).toBe('high');
    expect(result.riskAssessment.confidenceScore).toBeGreaterThan(70);
  }, 60000);
}); 