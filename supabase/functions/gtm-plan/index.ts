import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GTMPlanRequest {
  projectId: string;
  name: string;
  description?: string;
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

    const { projectId, name, description }: GTMPlanRequest = await req.json();

    // Fetch project insights
    const { data: landscapeData } = await supabase
      .from('landscape_insights')
      .select('*')
      .eq('project_id', projectId);

    const { data: sentimentData } = await supabase
      .from('consumer_sentiment')
      .select('*, sentiment_sources(*)')
      .eq('project_id', projectId);

    const { data: segmentData } = await supabase
      .from('segments')
      .select('*')
      .eq('project_id', projectId);

    // Generate strategies based on insights
    const strategies = {
      awareness: [
        {
          title: "Social Media Engagement",
          description: "Leverage Instagram and Facebook for brand awareness",
          channels: ["Instagram", "Facebook"],
          metrics: ["Reach", "Impressions", "Engagement Rate"],
          budget_allocation: "25%"
        },
        {
          title: "Influencer Partnerships",
          description: "Partner with micro-influencers in health and wellness",
          channels: ["Instagram", "YouTube"],
          metrics: ["Reach", "Engagement", "Brand Mentions"],
          budget_allocation: "20%"
        }
      ],
      consideration: [
        {
          title: "Educational Content",
          description: "Create valuable content about product benefits",
          channels: ["Blog", "YouTube", "Email"],
          metrics: ["Time on Page", "Video Views", "Email Open Rate"],
          budget_allocation: "15%"
        },
        {
          title: "Product Sampling",
          description: "Distribute samples at relevant events",
          channels: ["Events", "Direct Mail"],
          metrics: ["Sample Requests", "Event Attendance"],
          budget_allocation: "15%"
        }
      ],
      conversion: [
        {
          title: "Performance Marketing",
          description: "Run targeted ads to drive sales",
          channels: ["Google Ads", "Facebook Ads"],
          metrics: ["ROAS", "CPA", "Conversion Rate"],
          budget_allocation: "15%"
        },
        {
          title: "Retail Partnerships",
          description: "Expand retail presence",
          channels: ["Modern Trade", "E-commerce"],
          metrics: ["Sales Volume", "Market Share"],
          budget_allocation: "10%"
        }
      ],
      loyalty: [
        {
          title: "Loyalty Program",
          description: "Implement rewards program",
          channels: ["Email", "Mobile App"],
          metrics: ["Repeat Purchase Rate", "Customer LTV"],
          budget_allocation: "10%"
        },
        {
          title: "Community Building",
          description: "Create brand community",
          channels: ["Social Media", "Events"],
          metrics: ["Member Growth", "Engagement Rate"],
          budget_allocation: "10%"
        }
      ]
    };

    // Save GTM plan
    const { data: gtmPlan, error: gtmError } = await supabase
      .from('gtm_plans')
      .insert({
        project_id: projectId,
        user_id: user.id,
        name,
        description,
        awareness_strategies: strategies.awareness,
        consideration_strategies: strategies.consideration,
        conversion_strategies: strategies.conversion,
        loyalty_strategies: strategies.loyalty
      })
      .select()
      .single();

    if (gtmError) throw gtmError;

    return new Response(
      JSON.stringify({ 
        success: true, 
        plan: gtmPlan,
        insights: {
          landscape: landscapeData,
          sentiment: sentimentData,
          segments: segmentData
        }
      }),
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