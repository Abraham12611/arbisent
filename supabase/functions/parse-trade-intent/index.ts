
import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { ChatOpenAI } from "https://esm.sh/@langchain/openai"

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
    const { message, context } = await req.json()

    const llm = new ChatOpenAI({
      modelName: 'gpt-4o-mini',
      temperature: 0.3,
      openAIApiKey: Deno.env.get('OPENAI_API_KEY'),
    })

    const systemPrompt = `You are a trading assistant that parses natural language messages into structured trading intents and parameters. 
    Valid intents are: MARKET_BUY, MARKET_SELL, LIMIT_BUY, LIMIT_SELL, ANALYZE, SET_STOP_LOSS, SET_TAKE_PROFIT, SCHEDULE_TRADE.
    For scheduled trades, include timeframe parameters.
    Extract parameters like asset, amount, price, stopLoss, takeProfit, timeframe, and strategy.
    Respond with a JSON object containing intent, parameters, and confidence score.
    Previous context: ${JSON.stringify(context)}`

    console.log('Processing message:', message)
    console.log('With context:', context)

    const response = await llm.call([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message }
    ])

    console.log('LLM response:', response)

    // Parse the response text into structured data
    let parsedData
    try {
      parsedData = JSON.parse(response.content)
    } catch (e) {
      console.error('Failed to parse LLM response as JSON:', e)
      // Provide a default structured response if parsing fails
      parsedData = {
        intent: 'ANALYZE',
        parameters: {
          asset: message.includes('SOL') ? 'SOL' : 'USDC',
          strategy: 'basic_analysis'
        },
        confidence: 0.6
      }
    }

    console.log('Parsed response:', parsedData)

    return new Response(
      JSON.stringify(parsedData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in parse-trade-intent function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
