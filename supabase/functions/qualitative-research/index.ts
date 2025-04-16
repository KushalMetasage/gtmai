import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResearchRequest {
  projectId: string;
  researchType: 'fgd' | 'di' | 'expert_interview';
  fileName: string;
  fileContent: string;
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

    const { projectId, researchType, fileName, fileContent }: ResearchRequest = await req.json();

    // Mock AI analysis results
    const analysis = {
      themes: [
        {
          name: "Price Sensitivity",
          description: "Consumers are highly price conscious and compare across brands",
          confidence: 0.85
        },
        {
          name: "Health Awareness",
          description: "Growing interest in natural and healthy ingredients",
          confidence: 0.92
        },
        {
          name: "Convenience",
          description: "Easy-to-use packaging and portability are key drivers",
          confidence: 0.78
        }
      ],
      key_quotes: [
        "I always check the ingredients list before buying",
        "The price is a bit high compared to regular options",
        "I love how easy it is to carry in my gym bag"
      ],
      sentiment: "positive",
      barriers: [
        "High price point",
        "Limited availability",
        "Lack of awareness"
      ],
      drivers: [
        "Health benefits",
        "Natural ingredients",
        "Convenient packaging"
      ]
    };

    // Store file in Supabase Storage
    const { data: fileData, error: fileError } = await supabase
      .storage
      .from('research-files')
      .upload(`${user.id}/${fileName}`, fileContent);

    if (fileError) throw fileError;

    // Create signed URL for file access
    const { data: { signedUrl }, error: urlError } = await supabase
      .storage
      .from('research-files')
      .createSignedUrl(`${user.id}/${fileName}`, 7 * 24 * 60 * 60); // 7 days expiry

    if (urlError) throw urlError;

    // Save insights to database
    const { data: insight, error: insightError } = await supabase
      .from('qual_research_insights')
      .insert({
        project_id: projectId,
        user_id: user.id,
        research_type: researchType,
        file_name: fileName,
        file_url: signedUrl,
        themes: analysis.themes,
        key_quotes: analysis.key_quotes,
        sentiment: analysis.sentiment,
        barriers: analysis.barriers,
        drivers: analysis.drivers
      })
      .select()
      .single();

    if (insightError) throw insightError;

    return new Response(
      JSON.stringify({ success: true, insight }),
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