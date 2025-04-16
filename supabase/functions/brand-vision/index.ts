import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to validate UUID format
function isValidUUID(uuid: string) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
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

    if (req.method === 'GET') {
      const url = new URL(req.url);
      const projectId = url.searchParams.get('projectId');
      
      if (!projectId) {
        throw new Error('Project ID is required');
      }

      // Return early if projectId is 'new'
      if (projectId === 'new') {
        return new Response(
          JSON.stringify({ vision: null }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }

      // Validate UUID format
      if (!isValidUUID(projectId)) {
        throw new Error('Invalid project ID format');
      }

      const { data, error } = await supabase
        .from('brand_vision')
        .select('*')
        .eq('project_id', projectId)
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ vision: data }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    if (req.method === 'POST') {
      const { projectId, mission, tone, communicationDos, communicationDonts } = await req.json();

      // Validate UUID format for non-new projects
      if (projectId !== 'new' && !isValidUUID(projectId)) {
        throw new Error('Invalid project ID format');
      }

      // If projectId is 'new', create a new project first
      let finalProjectId = projectId;
      if (projectId === 'new') {
        const { data: newProject, error: projectError } = await supabase
          .from('projects')
          .insert([{
            user_id: user.id,
            category: 'default',
            geography: 'global',
          }])
          .select()
          .single();

        if (projectError) throw projectError;
        if (!newProject) throw new Error('Failed to create new project');
        
        finalProjectId = newProject.id;
      }

      const { data, error } = await supabase
        .from('brand_vision')
        .upsert({
          project_id: finalProjectId,
          user_id: user.id,
          mission,
          tone,
          communication_dos: communicationDos,
          communication_donts: communicationDonts
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ vision: data }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    throw new Error(`Method ${req.method} not allowed`);
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