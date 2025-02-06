import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get all watched pairs
    const { data: watchedPairs, error: fetchError } = await supabase
      .from('watched_pairs')
      .select('*')

    if (fetchError) throw fetchError

    // Fetch prices for each pair from multiple DEXs
    const prices = await Promise.all(
      watchedPairs.map(async (pair) => {
        // Here we'll integrate with actual DEX APIs
        // For now, returning mock data
        return {
          dex: "Orca",
          pair: pair.pair_name,
          price: Math.random() * 1000,
          timestamp: Date.now()
        }
      })
    )

    // Broadcast price updates to all clients
    for (const price of prices) {
      await supabase
        .channel(`dex-${price.pair}`)
        .send({
          type: 'broadcast',
          event: 'price_update',
          payload: price
        })
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Price updates sent' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in dex-monitor function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})