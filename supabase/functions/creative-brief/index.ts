import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BriefRequest {
  projectId: string;
  segmentId?: string;
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

    const { projectId, segmentId }: BriefRequest = await req.json();

    // Fetch required data
    const [
      { data: segment },
      { data: brandVision },
      { data: gtmPlan }
    ] = await Promise.all([
      supabase
        .from('segments')
        .select('*')
        .eq('id', segmentId)
        .single(),
      supabase
        .from('brand_vision')
        .select('*')
        .eq('project_id', projectId)
        .single(),
      supabase
        .from('gtm_plans')
        .select('*')
        .eq('project_id', projectId)
        .single()
    ]);

    // Get latest version number
    const { data: latestBrief } = await supabase
      .from('creative_briefs')
      .select('version')
      .eq('project_id', projectId)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    const nextVersion = latestBrief ? latestBrief.version + 1 : 1;

    // Generate brief
    const brief = {
      project_id: projectId,
      user_id: user.id,
      version: nextVersion,
      objective: `Drive awareness and consideration among ${segment.name} through compelling creative that emphasizes our unique value proposition`,
      target_segment: {
        name: segment.name,
        description: segment.description,
        demographics: segment.demographics,
        psychographics: segment.psychographics,
        behaviors: segment.behaviors
      },
      key_messages: [
        segment.positioning,
        ...gtmPlan.awareness_strategies
          .filter(s => s.isCritical)
          .map(s => s.description)
      ],
      mandatory_claims: [
        "All natural ingredients",
        "Scientifically proven benefits",
        "Premium quality"
      ],
      tone_voice: {
        brand_tone: brandVision.tone,
        communication_dos: brandVision.communication_dos,
        communication_donts: brandVision.communication_donts
      },
      visual_ideas: [
        "Lifestyle shots showing target consumers in their natural environment",
        "Close-up product shots highlighting premium ingredients",
        "Before/after transformation stories",
        "User-generated content featuring real testimonials"
      ]
    };

    // Save brief
    const { data: savedBrief, error: saveError } = await supabase
      .from('creative_briefs')
      .insert(brief)
      .select()
      .single();

    if (saveError) throw saveError;

    return new Response(
      JSON.stringify({ success: true, brief: savedBrief }),
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