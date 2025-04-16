import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FeasibilityRequest {
  projectId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization')?.split('Bearer ')[1];
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: `Bearer ${authHeader}` }
        }
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader);
    if (userError || !user) throw new Error('Invalid user token');

    const { projectId }: FeasibilityRequest = await req.json();

    // Fetch project insights
    const { data: landscapeData } = await supabase
      .from('landscape_insights')
      .select('*')
      .eq('project_id', projectId);

    const { data: sentimentData } = await supabase
      .from('consumer_sentiment')
      .select('*')
      .eq('project_id', projectId);

    // Mock AI analysis results
    const cityTiers = ['Tier-1', 'Tier-2', 'Tier-3'];
    const channels = ['E-commerce', 'Quick Commerce', 'Modern Trade', 'General Trade'];
    const scores = ['High', 'Medium', 'Low'];
    
    const feasibilityData = [];
    
    for (const tier of cityTiers) {
      for (const channel of channels) {
        const score = scores[Math.floor(Math.random() * scores.length)];
        const rationale = generateRationale(tier, channel, score);
        
        feasibilityData.push({
          project_id: projectId,
          user_id: user.id,
          city_tier: tier,
          channel: channel,
          feasibility_score: score,
          rationale: rationale
        });
      }
    }

    // Save feasibility data
    const { data: savedData, error: saveError } = await supabase
      .from('channel_feasibility')
      .insert(feasibilityData)
      .select();

    if (saveError) throw saveError;

    return new Response(
      JSON.stringify({ success: true, data: savedData }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

function generateRationale(tier: string, channel: string, score: string): string {
  const rationales = {
    'Tier-1': {
      'E-commerce': {
        'High': 'Strong digital adoption and high smartphone penetration. Consumers value convenience and are willing to pay premium for doorstep delivery.',
        'Medium': 'Moderate digital adoption but high competition in the space.',
        'Low': 'Market saturation and high customer acquisition costs.'
      },
      'Quick Commerce': {
        'High': 'Dense urban population with high demand for instant delivery.',
        'Medium': 'Growing demand but operational challenges in some areas.',
        'Low': 'Limited reach and high operational costs.'
      }
    },
    'Tier-2': {
      'Modern Trade': {
        'High': 'Rapidly growing organized retail presence with strong consumer pull.',
        'Medium': 'Emerging market with potential for growth.',
        'Low': 'Limited presence of organized retail chains.'
      },
      'General Trade': {
        'High': 'Strong existing network and consumer trust.',
        'Medium': 'Good coverage but modernization needed.',
        'Low': 'Fragmented market with logistics challenges.'
      }
    }
  };

  // Default rationale if specific combination not found
  return rationales[tier]?.[channel]?.[score] || 
    `${score} feasibility based on market analysis of ${channel} in ${tier} cities.`;
}