import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get all watched pairs
    const { data: watchedPairs, error: fetchError } = await supabaseClient
      .from('watched_pairs')
      .select('*');

    if (fetchError) throw fetchError;

    // Fetch prices for each pair (mock implementation)
    const prices = watchedPairs.map(pair => ({
      dex: 'mock-dex',
      pair: pair.pair_name,
      price: Math.random() * 1000,
      timestamp: Date.now()
    }));

    // Broadcast price updates
    for (const price of prices) {
      await supabaseClient
        .channel(`dex-${price.pair}`)
        .send({
          type: 'broadcast',
          event: 'price_update',
          payload: price
        });
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Price updates broadcasted' }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('Error in dex-monitor function:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});