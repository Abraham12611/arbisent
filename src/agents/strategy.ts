import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { Document } from "@langchain/core/documents";

interface RiskAssessment {
  riskLevel: 'low' | 'medium' | 'high';
  confidenceScore: number;
  potentialRisks: string[];
  mitigationStrategies: string[];
}

interface StrategyOutput {
  strategy: {
    name: string;
    description: string;
    entryConditions: string[];
    exitConditions: string[];
    positionSize: string;
    expectedReturn: string;
    timeframe: string;
  };
  riskAssessment: RiskAssessment;
}

class StrategyAgent {
  private llm: ChatOpenAI;
  
  constructor(llm: ChatOpenAI) {
    this.llm = llm;
  }

  async process(input: {
    marketData: any;
    research: Document[];
    sentiment: any;
  }): Promise<StrategyOutput> {
    // Generate trading strategy
    const strategy = await this.generateStrategy(input);
    
    // Assess risks
    const riskAssessment = await this.assessRisk(strategy, input);

    return {
      strategy,
      riskAssessment
    };
  }

  private async generateStrategy(input: {
    marketData: any;
    research: Document[];
    sentiment: any;
  }) {
    const prompt = PromptTemplate.fromTemplate(`
      As an expert arbitrage trader, analyze the following data and generate a detailed trading strategy:

      Market Data:
      {marketData}

      Research Context:
      {research}

      Market Sentiment:
      {sentiment}

      Generate a comprehensive trading strategy that includes:
      1. Strategy name and description
      2. Specific entry conditions
      3. Clear exit conditions
      4. Position sizing recommendations
      5. Expected return targets
      6. Recommended timeframe

      Format the response as a structured object.
    `);

    const formattedPrompt = await prompt.format({
      marketData: JSON.stringify(input.marketData, null, 2),
      research: input.research.map(doc => doc.pageContent).join('\n\n'),
      sentiment: JSON.stringify(input.sentiment, null, 2)
    });

    const response = await this.llm.predict(formattedPrompt);
    return JSON.parse(response);
  }

  private async assessRisk(
    strategy: any,
    input: { marketData: any; sentiment: any }
  ): Promise<RiskAssessment> {
    const riskPrompt = PromptTemplate.fromTemplate(`
      Analyze the following trading strategy and market conditions for potential risks:

      Strategy:
      {strategy}

      Market Conditions:
      {marketData}

      Sentiment:
      {sentiment}

      Provide a risk assessment that includes:
      1. Risk level (low/medium/high)
      2. Confidence score (0-100)
      3. List of potential risks
      4. Risk mitigation strategies

      Format the response as a structured object.
    `);

    const formattedPrompt = await riskPrompt.format({
      strategy: JSON.stringify(strategy, null, 2),
      marketData: JSON.stringify(input.marketData, null, 2),
      sentiment: JSON.stringify(input.sentiment, null, 2)
    });

    const response = await this.llm.predict(formattedPrompt);
    return JSON.parse(response);
  }
}

export default StrategyAgent; 