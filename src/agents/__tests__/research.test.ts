
import { describe, expect, test } from '@jest/globals';
import { ResearchAgent } from '../research';
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "@langchain/openai";
import { ChatOpenAI } from "@langchain/openai";

describe('ResearchAgent', () => {
  let agent: ResearchAgent;

  beforeEach(() => {
    const vectorStore = new MemoryVectorStore(
      new OpenAIEmbeddings({
        openAIApiKey: process.env.OPENAI_API_KEY,
      })
    );

    const llm = new ChatOpenAI({
      modelName: "gpt-4",
      temperature: 0.7,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    agent = new ResearchAgent({
      vectorStore,
      firecrawlApiKey: 'test-key',
      llm
    });
  });

  test('process returns research results', async () => {
    const result = await agent.process({
      urls: ['https://example.com'],
      marketData: { 
        asset: 'BTC/USD',
        price: 100, 
        volume: 1000,
        timestamp: Date.now()
      }
    });

    expect(result).toHaveProperty('strategies');
    expect(result).toHaveProperty('analysis');
  });
});
