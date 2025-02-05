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

      Generate a comprehensive trading strategy following this exact JSON structure, replacing the example values:

      {formatInstructions}

      Ensure the response is valid JSON and follows this structure exactly.
    `);

    const formatInstructions = `{
      "name": "Strategy name",
      "description": "Detailed strategy description",
      "entryConditions": ["condition1", "condition2"],
      "exitConditions": ["condition1", "condition2"],
      "positionSize": "Position sizing recommendation",
      "expectedReturn": "Expected return target",
      "timeframe": "Recommended timeframe"
    }`;

    const formattedPrompt = await prompt.format({
      marketData: JSON.stringify(input.marketData, null, 2),
      research: input.research.map(doc => doc.pageContent).join('\n\n'),
      sentiment: JSON.stringify(input.sentiment, null, 2),
      formatInstructions
    });

    const response = await this.llm.predict(formattedPrompt);
    try {
      return JSON.parse(response);
    } catch (error) {
      throw new Error(`Failed to parse strategy response: ${response}`);
    }
  }

  private async assessRisk(
    strategy: any,
    input: { marketData: any; sentiment: any }
  ): Promise<RiskAssessment> {
    const prompt = PromptTemplate.fromTemplate(`
      Analyze the following trading strategy and market conditions for potential risks:

      Strategy:
      {strategy}

      Market Conditions:
      {marketData}

      Sentiment:
      {sentiment}

      Provide a risk assessment following this exact JSON structure, replacing the example values:

      {formatInstructions}

      Ensure the response is valid JSON and follows this structure exactly.
    `);

    const formatInstructions = `{
      "riskLevel": "high",
      "confidenceScore": 85,
      "potentialRisks": ["risk1", "risk2"],
      "mitigationStrategies": ["strategy1", "strategy2"]
    }`;

    const formattedPrompt = await prompt.format({
      strategy: JSON.stringify(strategy, null, 2),
      marketData: JSON.stringify(input.marketData, null, 2),
      sentiment: JSON.stringify(input.sentiment, null, 2),
      formatInstructions
    });

    const response = await this.llm.predict(formattedPrompt);
    try {
      const parsed = JSON.parse(response);
      // Validate risk level
      if (!['low', 'medium', 'high'].includes(parsed.riskLevel)) {
        parsed.riskLevel = input.sentiment.overall === 'negative' ? 'high' : 'medium';
      }
      // Validate confidence score
      if (typeof parsed.confidenceScore !== 'number' || 
          parsed.confidenceScore < 0 || 
          parsed.confidenceScore > 100) {
        parsed.confidenceScore = input.sentiment.confidence * 100;
      }
      return parsed;
    } catch (error) {
      throw new Error(`Failed to parse risk assessment response: ${response}`);
    }
  }
}

export default StrategyAgent; 