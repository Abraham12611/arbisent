
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
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
    const { prompt, chatHistory } = await req.json()

    if (!prompt) {
      throw new Error('Prompt is required')
    }

    console.log('Received prompt:', prompt)
    console.log('Chat history:', chatHistory)

    const llm = new ChatOpenAI({
      modelName: 'gpt-4o-mini',
      temperature: 0.7,
      openAIApiKey: Deno.env.get('OPENAI_API_KEY'),
    })

    const messages = [
      {
        role: 'system',
        content: 'You are ArbiSent, an AI assistant specialized in cryptocurrency trading and arbitrage. Help users understand market opportunities, analyze trends, and make informed trading decisions. Be concise and precise in your responses.'
      },
      ...chatHistory,
      {
        role: 'user',
        content: prompt
      }
    ]

    const response = await llm.call(messages)
    const answer = response.content

    return new Response(
      JSON.stringify({ answer }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

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
