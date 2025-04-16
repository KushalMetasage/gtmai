import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MarketData {
  category: string
  geography: string
  brand?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')?.split('Bearer ')[1]
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: `Bearer ${authHeader}`
          }
        }
      }
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader)
    if (userError || !user) throw new Error('Invalid user token')

    const { category, geography, brand }: MarketData = await req.json()

    // Mock data for demonstration
    const mockData = [
      {
        competitor_name: "Health Foods Co",
        product_name: `Organic ${category}`,
        price: 499.99,
        pack_size: "500ml",
        claims: ["Organic", "Sugar-free", "Vegan"],
        listing_url: "https://amazon.com/sample",
        platform: "Amazon"
      },
      {
        competitor_name: "Nature's Best",
        product_name: `Premium ${category}`,
        price: 599.99,
        pack_size: "750ml",
        claims: ["Natural", "No preservatives", "High protein"],
        listing_url: "https://flipkart.com/sample",
        platform: "Flipkart"
      }
    ]

    // Create project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert([
        { 
          category, 
          geography, 
          brand,
          user_id: user.id 
        }
      ])
      .select()
      .single()

    if (projectError) throw projectError

    // Insert insights
    const insights = mockData.map(item => ({
      ...item,
      project_id: project.id
    }))

    const { data: landscapeData, error: insightsError } = await supabase
      .from('landscape_insights')
      .insert(insights)
      .select()

    if (insightsError) throw insightsError

    return new Response(
      JSON.stringify({ project, insights: landscapeData }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
});