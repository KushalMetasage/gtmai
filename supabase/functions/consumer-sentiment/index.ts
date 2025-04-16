import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SentimentRequest {
  category: string;
  keywords?: string[];
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

    const { category, keywords, projectId }: SentimentRequest = await req.json();

    // Mock data for demonstration
    const mockInsights = [
      {
        insight_type: 'buying_driver',
        sentiment: 'positive',
        content: 'Users consistently praise the natural ingredients and clean label',
        keywords: ['natural', 'clean label', 'ingredients'],
        source: {
          source_type: 'amazon',
          source_url: 'https://amazon.com/sample-review-1',
          source_text: 'Love how natural this product is, no artificial ingredients!'
        }
      },
      {
        insight_type: 'objection',
        sentiment: 'negative',
        content: 'Price point is considered too high compared to traditional alternatives',
        keywords: ['price', 'expensive', 'cost'],
        source: {
          source_type: 'reddit',
          source_url: 'https://reddit.com/r/sample/comments/1',
          source_text: 'Great product but way too expensive compared to regular options'
        }
      }
    ];

    // Insert insights and their sources
    for (const insight of mockInsights) {
      const { data: sentimentData, error: sentimentError } = await supabase
        .from('consumer_sentiment')
        .insert({
          project_id: projectId,
          user_id: user.id,
          category,
          insight_type: insight.insight_type,
          sentiment: insight.sentiment,
          content: insight.content,
          keywords: insight.keywords
        })
        .select()
        .single();

      if (sentimentError) throw sentimentError;

      const { error: sourceError } = await supabase
        .from('sentiment_sources')
        .insert({
          sentiment_id: sentimentData.id,
          source_type: insight.source.source_type,
          source_url: insight.source.source_url,
          source_text: insight.source.source_text
        });

      if (sourceError) throw sourceError;
    }

    return new Response(
      JSON.stringify({ success: true, insights: mockInsights }),
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