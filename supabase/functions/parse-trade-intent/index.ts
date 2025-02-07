import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { ChatOpenAI } from "npm:@langchain/openai@0.0.14"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    const { message, context } = await req.json()
    if (!message) {
      throw new Error('Message is required')
    }

    console.log('Processing message:', message)
    console.log('With context:', context)

    const llm = new ChatOpenAI({
      modelName: 'gpt-3.5-turbo',
      temperature: 0.3,
      openAIApiKey,
    })

    const systemPrompt = `You are a trading assistant that parses natural language messages into structured trading intents and parameters. 
    Valid intents are: MARKET_BUY, MARKET_SELL, LIMIT_BUY, LIMIT_SELL, ANALYZE, SET_STOP_LOSS, SET_TAKE_PROFIT, SCHEDULE_TRADE.
    Extract parameters like asset, amount, price, stopLoss, takeProfit, timeframe, and strategy.
    Respond with ONLY a JSON object containing intent, parameters, and confidence score.
    Previous context: ${JSON.stringify(context)}`

    const response = await llm.call([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message }
    ])

    console.log('LLM response:', response)

    let parsedData
    try {
      // First try to find JSON in the response if it's wrapped in text
      const jsonMatch = response.content.match(/\{[\s\S]*\}/)
      const jsonStr = jsonMatch ? jsonMatch[0] : response.content
      parsedData = JSON.parse(jsonStr)
    } catch (e) {
      console.error('Failed to parse LLM response as JSON:', e)
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
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        }
      }
    )
  } catch (error) {
    console.error('Error in parse-trade-intent function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        intent: 'ANALYZE',
        parameters: {
          strategy: 'error_fallback'
        },
        confidence: 0.1
      }),
      { 
        status: 200, // Return 200 even on error to handle it gracefully on client
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }
      }
    )
  }
})
