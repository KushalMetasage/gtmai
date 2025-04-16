import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisRequest {
  projectId: string;
  imageType: 'front' | 'back';
  imageUrl: string;
  scannedText: string;
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

    const { projectId, imageType, imageUrl, scannedText }: AnalysisRequest = await req.json();

    // Mock AI analysis results
    const mockReview = {
      project_id: projectId,
      user_id: user.id,
      [imageType === 'front' ? 'front_image_url' : 'back_image_url']: imageUrl,
      scanned_text: scannedText,
      claims: [
        "100% Natural",
        "No Artificial Colors",
        "High in Protein",
        "Gluten Free"
      ],
      readability_score: 85,
      clutter_score: 25,
      compliance_issues: [
        {
          type: "Font Size",
          description: "Nutritional information font size below minimum requirement",
          severity: "high"
        },
        {
          type: "Claims Validation",
          description: "Natural claim requires supporting documentation",
          severity: "medium"
        },
        {
          type: "Allergen Statement",
          description: "Missing clear allergen declaration",
          severity: "high"
        }
      ],
      recommendations: [
        "Increase font size of nutritional information to meet regulations",
        "Add clear allergen declaration box",
        "Reduce visual clutter in the main panel",
        "Ensure all claims have supporting documentation",
        "Consider adding batch code for better traceability"
      ]
    };

    // Save review to database
    const { data: review, error: saveError } = await supabase
      .from('packaging_reviews')
      .upsert(mockReview)
      .select()
      .single();

    if (saveError) throw saveError;

    return new Response(
      JSON.stringify({ success: true, review }),
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