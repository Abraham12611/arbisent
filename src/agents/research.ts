import { ChatOpenAI } from "@langchain/openai";
import { VectorStore } from "@langchain/core/vectorstores";
import axios from "axios";
import { AgentInput, AgentOutput } from "../types/agent";
import { Document } from "@langchain/core/documents";

export class ResearchAgent {
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
    const strategies = await this.crawlTradingStrategies(input.urls || []);
    
    // Convert strategies to proper document format and chunk into smaller pieces
    const documents: Document[] = [];
    for (const strategy of strategies) {
      const content = JSON.stringify(strategy);
      const chunks = content.match(/.{1,4000}/g) || [];
      
      chunks.forEach((chunk, index) => {
        documents.push({
          pageContent: chunk,
          metadata: { 
            source: 'trading-strategy',
            chunk: index,
            total_chunks: chunks.length
          }
        });
      });
    }
    
    if (documents.length > 0) {
      const batchSize = 5;
      for (let i = 0; i < documents.length; i += batchSize) {
        const batch = documents.slice(i, i + batchSize);
        await this.vectorStore.addDocuments(batch);
      }
    }

    const analysis = await this.analyzeWithRAG(input.marketData || {});

    return {
      status: 'success',
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
    // Limit the number of similar documents retrieved
    const relevantContext = await this.vectorStore.similaritySearch(
      JSON.stringify(marketData),
      3  // Reduced from 5 to 3 to limit context size
    );

    const prompt = `Analyze the following market data and trading context:
      Market Data: ${JSON.stringify(marketData)}
      Trading Context: ${relevantContext.map(doc => doc.pageContent).join('\n')}`;

    const response = await this.llm.predict(prompt);
    return response;
  }
}
