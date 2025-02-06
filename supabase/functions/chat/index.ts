import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { ChatOpenAI } from "https://esm.sh/@langchain/openai"
import { DataCollectionAgent } from "../../../src/agents/dataCollection.ts"
import { ResearchAgent } from "../../../src/agents/research.ts"
import { StrategyAgent } from "../../../src/agents/strategy.ts"
import { ExecutionAgent } from "../../../src/agents/execution.ts"
import { ArbiSentOrchestrator } from "../../../src/agents/orchestrator.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { prompt, chatHistory } = await req.json()

    if (!prompt) {
      throw new Error('Prompt is required')
    }

    console.log('Received prompt:', prompt)
    console.log('Chat history:', chatHistory)

    // Initialize agents
    const llm = new ChatOpenAI({
      modelName: 'gpt-4o-mini',
      temperature: 0.7,
      openAIApiKey: Deno.env.get('OPENAI_API_KEY'),
    });

    // Initialize DataCollection Agent
    const dataCollectionAgent = new DataCollectionAgent({
      apiKey: Deno.env.get('COOKIE_DATASWARM_API_KEY'),
    });

    // Initialize Research Agent
    const researchAgent = new ResearchAgent({
      vectorStore: null, // We'll need to implement this
      firecrawlApiKey: Deno.env.get('FIRECRAWL_API_KEY'),
      llm,
    });

    // Initialize Strategy Agent
    const strategyAgent = new StrategyAgent(llm);

    // Initialize Execution Agent
    const executionAgent = new ExecutionAgent({
      solanaKit: null, // We'll need to implement this
      llm,
    });

    // Initialize Orchestrator
    const orchestrator = new ArbiSentOrchestrator();

    // Prepare the system message
    const messages = [
      {
        role: 'system',
        content: 'You are ArbiSent, an AI assistant specialized in cryptocurrency trading and arbitrage. Help users understand market opportunities, analyze trends, and make informed trading decisions. Be concise and precise in your responses.'
      },
      ...chatHistory
    ]

    // Process the prompt through our agents
    try {
      const result = await orchestrator.run({
        urls: [], // We'll extract relevant URLs from the prompt if needed
        marketData: {}, // This will be populated by the DataCollection agent
        sentiment: {}, // This will be populated by the DataCollection agent
        parameters: {} // This will be determined based on the prompt
      });

      // Generate response based on the orchestration result
      let answer = '';
      if (result.status === 'completed') {
        answer = `I've analyzed your request and here's what I found:\n\n`;
        if (result.data?.research) {
          answer += `Research Analysis:\n${result.data.research.analysis}\n\n`;
        }
        if (result.data?.strategy) {
          answer += `Recommended Strategy:\n${JSON.stringify(result.data.strategy.strategy, null, 2)}\n\n`;
        }
        if (result.data?.execution) {
          answer += `Execution Status:\n${JSON.stringify(result.data.execution, null, 2)}`;
        }
      } else {
        answer = `I encountered an issue while processing your request: ${result.data?.error || 'Unknown error'}`;
      }

      return new Response(
        JSON.stringify({ answer }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } catch (error) {
      console.error('Error in agent processing:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in chat function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})