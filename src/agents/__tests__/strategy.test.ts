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

    expect(result).toHaveProperty("strategy");
    expect(result).toHaveProperty("riskAssessment");
    expect(result.strategy).toHaveProperty("entryConditions");
    expect(result.strategy).toHaveProperty("exitConditions");
    expect(result.riskAssessment).toHaveProperty("riskLevel");
    expect(result.riskAssessment).toHaveProperty("confidenceScore");
  }, 30000);
}); 