import dotenv from "dotenv";
import { ChatOpenAI } from "langchain/chat_models";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import ResearchAgent from "../agents/research";

dotenv.config();

async function testResearchAgent() {
  // Initialize dependencies
  const llm = new ChatOpenAI({
    modelName: "gpt-4",
    temperature: 0.7,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  const vectorStore = new MemoryVectorStore(
    new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    })
  );

  const agent = new ResearchAgent({
    vectorStore,
    firecrawlApiKey: process.env.FIRECRAWL_API_KEY!,
    llm,
  });

  // Test input
  const input = {
    urls: [
      "https://blog.chain.link/defi-arbitrage-strategies/",
      "https://academy.binance.com/en/articles/what-is-arbitrage-trading"
    ],
    marketData: {
      asset: "SOL/USDC",
      price: 100,
      volume: 1000000,
      timestamp: Date.now(),
      exchanges: {
        "DEX_A": 99.5,
        "DEX_B": 100.2
      }
    }
  };

  try {
    console.log("Starting research process...");
    const result = await agent.process(input);
    console.log("Research completed!");
    console.log("Strategies found:", result.strategies.length);
    console.log("Analysis:", result.analysis);
  } catch (error) {
    console.error("Error during research:", error);
  }
}

testResearchAgent().catch(console.error); 