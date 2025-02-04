import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

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

    // Prepare messages array with system message and chat history
    const messages = [
      {
        role: 'system',
        content: 'You are ArbiSent, an AI assistant specialized in cryptocurrency trading and arbitrage. Help users understand market opportunities, analyze trends, and make informed trading decisions. Be concise and precise in your responses.'
      },
      ...chatHistory // Include previous conversation context
    ]

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
      }),
    })

    const data = await response.json()
    console.log('OpenAI response:', data)

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to get response from OpenAI')
    }

    const answer = data.choices[0].message.content

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