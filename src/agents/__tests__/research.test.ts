import dotenv from "dotenv";
import { describe, expect, test, beforeAll, afterAll } from '@jest/globals';
import { ChatOpenAI } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "@langchain/openai";
import ResearchAgent from "../research";
import type { AgentInput } from "../../types/agent";

describe("ResearchAgent", () => {
  let agent: ResearchAgent;
  let vectorStore: MemoryVectorStore;
  
  beforeAll(() => {
    // Initialize dependencies
    const llm = new ChatOpenAI({
      modelName: "gpt-4",
      temperature: 0.7,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    vectorStore = new MemoryVectorStore(
      new OpenAIEmbeddings({
        openAIApiKey: process.env.OPENAI_API_KEY,
      })
    );

    agent = new ResearchAgent({
      vectorStore,
      firecrawlApiKey: process.env.FIRECRAWL_API_KEY!,
      llm,
    });
  });

  afterAll(async () => {
    // Just wait for pending operations
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  test("should crawl and analyze trading strategies", async () => {
    const input: AgentInput = {
      urls: [
        "https://hmarkets.com/blog/5-best-trading-strategies-for-every-trader/",
        "https://www.litefinance.org/blog/for-beginners/arbitrage-trading/"
      ],
      marketData: {
        price: 100,
        volume: 1000,
        timestamp: Date.now()
      }
    };

    const output = await agent.process(input);

    expect(output).toHaveProperty("strategies");
    expect(output).toHaveProperty("analysis");
    expect(Array.isArray(output.strategies)).toBe(true);
  }, 60000);

  test("should handle empty or invalid URLs", async () => {
    const input: AgentInput = {
      urls: [],
      marketData: {
        price: 100,
        volume: 1000,
        timestamp: Date.now()
      }
    };

    const output = await agent.process(input);

    expect(output.strategies).toHaveLength(0);
    expect(output.analysis).toBeDefined();
  }, 30000);
}); 