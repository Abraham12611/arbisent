import { describe, expect, test, beforeAll } from '@jest/globals';
import { ChatOpenAI } from "@langchain/openai";
import { Document } from "@langchain/core/documents";
import { BigNumber } from "ethers";
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

  test("should generate cross-chain strategy", async () => {
    const input = {
      marketData: {
        sourceAsset: "ETH",
        targetAsset: "USDC",
        sourcePrice: 3000,
        targetPrice: 1,
        bridgeProtocols: {
          "LayerZero": { fee: "0.001 ETH", time: "10m" },
          "Across": { fee: "0.0015 ETH", time: "15m" }
        }
      },
      research: [
        new Document({
          pageContent: "LayerZero bridge has shown 99.9% reliability over the past month.",
          metadata: { source: "bridge-analysis" }
        })
      ],
      sentiment: {
        overall: "positive",
        confidence: 0.85
      },
      sourceChainId: 1, // Ethereum
      targetChainId: 5001 // Mantle
    };

    const result = await agent.process(input);

    // Test cross-chain strategy structure
    expect(result.strategy.crossChainDetails).toBeDefined();
    expect(result.strategy.crossChainDetails).toMatchObject({
      sourceChain: {
        chainId: 1,
        name: 'Ethereum Mainnet'
      },
      targetChain: {
        chainId: 5001,
        name: 'Mantle'
      },
      route: {
        steps: expect.arrayContaining([
          expect.objectContaining({
            type: expect.stringMatching(/^(swap|bridge|flashLoan)$/),
            chainId: expect.any(Number),
            protocol: expect.any(String),
            fromToken: expect.any(String),
            toToken: expect.any(String),
            estimatedGas: expect.any(BigNumber)
          })
        ]),
        totalGasEstimate: expect.any(BigNumber),
        estimatedDuration: expect.any(Number)
      }
    });

    // Test cross-chain risk assessment
    expect(result.riskAssessment.crossChainRisks).toBeDefined();
    expect(result.riskAssessment.crossChainRisks).toMatchObject({
      bridgeRisk: expect.any(String),
      settlementRisk: expect.any(String),
      gasPriceRisk: expect.any(String)
    });

    // Test gas optimization recommendations
    expect(result.gasOptimization).toBeDefined();
    expect(result.gasOptimization).toMatchObject({
      recommendedTiming: expect.any(String),
      estimatedSavings: expect.any(String),
      alternativeRoutes: expect.arrayContaining([
        expect.objectContaining({
          description: expect.any(String),
          estimatedGas: expect.any(String),
          tradeoffs: expect.arrayContaining([expect.any(String)])
        })
      ])
    });
  });

  test("should handle invalid chain configurations", async () => {
    const input = {
      marketData: {
        sourceAsset: "ETH",
        targetAsset: "USDC"
      },
      research: [],
      sentiment: {
        overall: "neutral",
        confidence: 0.5
      },
      sourceChainId: 999999, // Invalid chain
      targetChainId: 5001
    };

    await expect(agent.process(input)).rejects.toThrow('Invalid chain configuration');
  });

  test("should optimize gas usage for cross-chain transactions", async () => {
    const input = {
      marketData: {
        sourceAsset: "ETH",
        targetAsset: "USDC",
        gasPrices: {
          ethereum: "50 gwei",
          mantle: "0.1 gwei"
        },
        peakHours: {
          ethereum: ["14:00-18:00 UTC"],
          mantle: ["12:00-16:00 UTC"]
        }
      },
      research: [],
      sentiment: {
        overall: "positive",
        confidence: 0.7
      },
      sourceChainId: 1,
      targetChainId: 5001
    };

    const result = await agent.process(input);

    expect(result.gasOptimization).toBeDefined();
    expect(result.gasOptimization?.recommendedTiming).toMatch(/UTC/);
    expect(result.gasOptimization?.estimatedSavings).toBeDefined();
    expect(result.gasOptimization?.alternativeRoutes.length).toBeGreaterThan(0);
  });
}); 