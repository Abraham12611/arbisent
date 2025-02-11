import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { Document } from "@langchain/core/documents";
import { BigNumber } from "ethers";

interface ChainConfig {
  chainId: number;
  name: string;
  nativeToken: string;
  averageBlockTime: number;
  gasPrice?: BigNumber;
  isTestnet: boolean;
}

interface CrossChainStrategy {
  sourceChain: ChainConfig;
  targetChain: ChainConfig;
  route: {
    steps: {
      type: 'swap' | 'bridge' | 'flashLoan';
      chainId: number;
      protocol: string;
      fromToken: string;
      toToken: string;
      estimatedGas: BigNumber;
    }[];
    totalGasEstimate: BigNumber;
    estimatedDuration: number;
  };
}

interface RiskAssessment {
  riskLevel: 'low' | 'medium' | 'high';
  confidenceScore: number;
  potentialRisks: string[];
  mitigationStrategies: string[];
  crossChainRisks?: {
    bridgeRisk?: string;
    settlementRisk?: string;
    gasPriceRisk?: string;
  };
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
    crossChainDetails?: CrossChainStrategy;
  };
  riskAssessment: RiskAssessment;
  gasOptimization?: {
    recommendedTiming: string;
    estimatedSavings: string;
    alternativeRoutes: CrossChainStrategy[];
  };
}

class StrategyAgent {
  private llm: ChatOpenAI;
  private chainConfigs: Map<number, ChainConfig>;
  
  constructor(llm: ChatOpenAI) {
    this.llm = llm;
    this.chainConfigs = new Map();
    this.initializeChainConfigs();
  }

  private initializeChainConfigs() {
    // Initialize supported chains
    const chains: ChainConfig[] = [
      {
        chainId: 1,
        name: 'Ethereum Mainnet',
        nativeToken: 'ETH',
        averageBlockTime: 12,
        isTestnet: false
      },
      {
        chainId: 5001,
        name: 'Mantle',
        nativeToken: 'MNT',
        averageBlockTime: 2,
        isTestnet: false
      },
      {
        chainId: 137,
        name: 'Polygon',
        nativeToken: 'MATIC',
        averageBlockTime: 2,
        isTestnet: false
      }
    ];
    
    chains.forEach(chain => this.chainConfigs.set(chain.chainId, chain));
  }

  async process(input: {
    marketData: any;
    research: Document[];
    sentiment: any;
    sourceChainId?: number;
    targetChainId?: number;
  }): Promise<StrategyOutput> {
    // Generate trading strategy
    const strategy = await this.generateStrategy(input);
    
    // If cross-chain parameters are provided, enhance with cross-chain strategy
    if (input.sourceChainId && input.targetChainId) {
      const crossChainStrategy = await this.generateCrossChainStrategy(
        input.sourceChainId,
        input.targetChainId,
        input.marketData
      );
      strategy.crossChainDetails = crossChainStrategy;
    }
    
    // Assess risks including cross-chain risks if applicable
    const riskAssessment = await this.assessRisk(strategy, input);

    // Generate gas optimization recommendations for cross-chain strategies
    const gasOptimization = input.sourceChainId && input.targetChainId 
      ? await this.optimizeGasUsage(strategy, input)
      : undefined;

    return {
      strategy,
      riskAssessment,
      gasOptimization
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

  private async generateCrossChainStrategy(
    sourceChainId: number,
    targetChainId: number,
    marketData: any
  ): Promise<CrossChainStrategy> {
    const sourceChain = this.chainConfigs.get(sourceChainId);
    const targetChain = this.chainConfigs.get(targetChainId);
    
    if (!sourceChain || !targetChain) {
      throw new Error('Invalid chain configuration');
    }

    const prompt = PromptTemplate.fromTemplate(`
      Generate a cross-chain trading strategy between {sourceChain} and {targetChain}.
      Consider the following market data:
      {marketData}

      Focus on:
      1. Optimal bridging protocol selection
      2. Gas efficiency
      3. Settlement time optimization
      4. MEV protection

      Provide the strategy in this JSON format:
      {formatInstructions}
    `);

    const formatInstructions = `{
      "steps": [
        {
          "type": "swap|bridge|flashLoan",
          "chainId": "numeric chain id",
          "protocol": "protocol name",
          "fromToken": "token symbol",
          "toToken": "token symbol",
          "estimatedGas": "gas estimate in wei"
        }
      ],
      "totalGasEstimate": "total gas in wei",
      "estimatedDuration": "estimated duration in seconds"
    }`;

    const formattedPrompt = await prompt.format({
      sourceChain: sourceChain.name,
      targetChain: targetChain.name,
      marketData: JSON.stringify(marketData, null, 2),
      formatInstructions
    });

    const response = await this.llm.predict(formattedPrompt);
    const route = JSON.parse(response);

    return {
      sourceChain,
      targetChain,
      route
    };
  }

  private async optimizeGasUsage(
    strategy: any,
    input: { marketData: any; sourceChainId?: number; targetChainId?: number }
  ) {
    if (!input.sourceChainId || !input.targetChainId) {
      return undefined;
    }

    const prompt = PromptTemplate.fromTemplate(`
      Analyze gas optimization opportunities for this cross-chain strategy:
      {strategy}

      Market conditions:
      {marketData}

      Consider:
      1. Historical gas price patterns
      2. Peak vs off-peak timing
      3. Alternative bridging protocols
      4. MEV protection costs

      Provide recommendations in this JSON format:
      {formatInstructions}
    `);

    const formatInstructions = `{
      "recommendedTiming": "description of optimal timing",
      "estimatedSavings": "estimated gas savings",
      "alternativeRoutes": [
        {
          "description": "route description",
          "estimatedGas": "gas estimate",
          "tradeoffs": ["tradeoff1", "tradeoff2"]
        }
      ]
    }`;

    const formattedPrompt = await prompt.format({
      strategy: JSON.stringify(strategy, null, 2),
      marketData: JSON.stringify(input.marketData, null, 2),
      formatInstructions
    });

    const response = await this.llm.predict(formattedPrompt);
    return JSON.parse(response);
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

      For negative sentiment with high confidence (>0.8), ensure the risk level is "high" and confidence score is above 70.
      
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
      
      // Enhanced validation for negative sentiment
      if (input.sentiment.overall === 'negative' && input.sentiment.confidence > 0.8) {
        parsed.riskLevel = 'high';
        parsed.confidenceScore = Math.max(
          parsed.confidenceScore || 0,
          Math.round(input.sentiment.confidence * 100) + 5 // Add buffer to ensure > 70
        );
      } else {
        // Default validation
        if (!['low', 'medium', 'high'].includes(parsed.riskLevel)) {
          parsed.riskLevel = input.sentiment.overall === 'negative' ? 'high' : 'medium';
        }
        if (typeof parsed.confidenceScore !== 'number' || 
            parsed.confidenceScore < 0 || 
            parsed.confidenceScore > 100) {
          parsed.confidenceScore = Math.round(input.sentiment.confidence * 100);
        }
      }

      return parsed;
    } catch (error) {
      throw new Error(`Failed to parse risk assessment response: ${response}`);
    }
  }
}

export default StrategyAgent; 