import { config } from 'dotenv';
import { ChatOpenAI } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "@langchain/openai";
import { ResearchAgent } from '../agents/research';

config();

async function main() {
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

  const agent = new ResearchAgent({
    vectorStore,
    firecrawlApiKey: process.env.FIRECRAWL_API_KEY!,
    llm
  });

  const result = await agent.process({
    urls: [
      'https://example.com/crypto-news',
      'https://example.com/market-analysis'
    ],
    marketData: {
      price: 100,
      volume: 1000000,
      timestamp: Date.now()
    }
  });

  console.log('Research Results:', result);
}

main().catch(console.error);