import dotenv from "dotenv";
import { ChatOpenAI } from "@langchain/openai";
import { VectorStore } from "@langchain/core/vectorstores";
import axios from "axios";
import { AgentInput, AgentOutput } from "../types/agent";

class ResearchAgent {
  private vectorStore: VectorStore;
  private firecrawlApiKey: string;
  private llm: ChatOpenAI;

  constructor(config: {
    vectorStore: VectorStore;
    firecrawlApiKey: string;
    llm: ChatOpenAI;
  }) {
    this.vectorStore = config.vectorStore;
    this.firecrawlApiKey = config.firecrawlApiKey;
    this.llm = config.llm;
  }

  async process(input: AgentInput): Promise<AgentOutput> {
    // Crawl and extract strategies
    const strategies = await this.crawlTradingStrategies(input.urls);
    
    // Convert strategies to proper document format
    const documents = strategies.map(strategy => ({
      pageContent: JSON.stringify(strategy),
      metadata: { source: 'trading-strategy' }
    }));
    
    // Store in vector database for RAG
    if (documents.length > 0) {
      await this.vectorStore.addDocuments(documents);
    }

    // Analyze with RAG-enhanced LLM
    const analysis = await this.analyzeWithRAG(input.marketData);

    return {
      strategies,
      analysis
    };
  }

  private async crawlTradingStrategies(urls: string[]) {
    const strategies = [];
    
    for (const url of urls) {
      try {
        const response = await axios.post('https://api.firecrawl.dev/v0/scrape', {
          url,
          pageOptions: {
            onlyMainContent: true
          },
          extractorOptions: {
            mode: "llm-extraction",
            extractionPrompt: "Extract trading strategies, market analysis, and key indicators. If there is no clear information, write 'no info'.",
            extractionSchema: {
              type: "object",
              properties: {
                trading_strategy: { type: "string" },
                market_analysis: { type: "string" },
                key_indicators: { type: "string" }
              },
              required: ["trading_strategy", "market_analysis", "key_indicators"]
            }
          }
        }, {
          headers: {
            'Authorization': `Bearer ${this.firecrawlApiKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.data.success) {
          strategies.push(response.data.data);
        }
      } catch (error) {
        console.error(`Error crawling ${url}:`, error);
      }
    }
    
    return strategies;
  }

  private async analyzeWithRAG(marketData: any) {
    const relevantContext = await this.vectorStore.similaritySearch(
      JSON.stringify(marketData),
      5
    );

    const analysis = await this.llm.predict(`
      Analyze the following market data using the provided trading strategy context:
      
      Market Data:
      ${JSON.stringify(marketData)}
      
      Relevant Trading Strategies:
      ${relevantContext.map(doc => doc.pageContent).join('\n\n')}
      
      Provide:
      1. Most applicable strategy
      2. Key risk factors
      3. Recommended entry/exit points
    `);

    return analysis;
  }
}

export default ResearchAgent; 