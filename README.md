```markdown
# ArbiSent - AI-Powered Crypto Arbitrage Platform

![ArbiSent Header](https://raw.githubusercontent.com/abraham12611/arbisent/main/public/arbisent-hero.png)

## Overview

ArbiSent is a sophisticated AI-powered arbitrage platform that leverages multiple intelligent agents to identify and execute profitable trading opportunities across decentralized exchanges (DEXs).

## Technical Architecture

### Agent System

ArbiSent employs a multi-agent system orchestrated through LangChain's StateGraph

The platform consists of five specialized agents:

1. **Data Collection Agent**: Continuously fetches market data and sentiment analysis through the Cookie DataSwarm API
2. **Research Agent**: Processes market data using LangChain's vector embeddings and RAG (Retrieval Augmented Generation)
3. **Strategy Agent**: Generates trading strategies using custom-tuned GPT-4 models
4. **Risk Management Agent**: Evaluates trade risks and sets appropriate parameters
5. **Execution Agent**: Interfaces with DEXs through Solana Agent Kit for trade execution

### Core Features

- **Natural Language Processing**: Processes trading intents through a custom NLU pipeline

- **Real-time Market Analysis**: Implements sophisticated market analysis through the MarketAnalysisService


- **Automated Strategy Generation**: Utilizes LLM-powered strategy generation with strict JSON formatting

### System Architecture

![ArbiSent System Architecture](https://raw.githubusercontent.com/abraham12611/arbisent/main/public/diagram.png)

## Technology Stack

- **Frontend**: React, TypeScript, shadcn-ui, Tailwind CSS
- **Backend**: Supabase, Serverless Functions
- **AI/ML**: LangChain, OpenAI GPT-4, Vector Embeddings
- **Blockchain**: Mantle Network, Solana Web3.js, Multiple DEX Integrations
- **Data Processing**: Cookie DataSwarm API, Firecrawl API


## API Integration

ArbiSent integrates with multiple APIs:

- OpenAI for strategy generation
- Cookie DataSwarm for market sentiment
- Firecrawl for web scraping
- Multiple DEX APIs for price discovery and execution
