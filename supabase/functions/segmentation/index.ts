import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SegmentationRequest {
  productName: string;
  productForm: string;
  priceRange: string;
  ingredients: string;
  targetConsumer?: string;
  channels: string[];
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
    if (userError) {
      console.error('User authentication error:', userError);
      throw new Error('Authentication failed');
    }
    if (!user) {
      throw new Error('No user found');
    }

    const requestData: SegmentationRequest = await req.json().catch(error => {
      console.error('JSON parsing error:', error);
      throw new Error('Invalid request data');
    });

    const {
      productName,
      productForm,
      priceRange,
      ingredients,
      targetConsumer,
      channels,
      projectId
    } = requestData;

    // Validate required fields
    if (!productName || !productForm || !priceRange || !ingredients) {
      throw new Error('Missing required fields');
    }

    // If projectId is 'new', create a new project first
    let finalProjectId = projectId;
    if (projectId === 'new') {
      const { data: newProject, error: projectError } = await supabase
        .from('projects')
        .insert([{
          user_id: user.id,
          category: productName,
          geography: 'global', // Default value
        }])
        .select()
        .single();

      if (projectError) {
        console.error('Project creation error:', projectError);
        throw new Error('Failed to create new project');
      }
      
      finalProjectId = newProject.id;
    }

    // Mock data for demonstration
    const mockSegments = [
      {
        name: "Health-Conscious Professionals",
        description: "Urban professionals aged 25-40 who prioritize health and convenience",
        demographics: [
          "Age: 25-40",
          "Urban areas",
          "High disposable income",
          "College educated"
        ],
        psychographics: [
          "Health-conscious",
          "Time-starved",
          "Quality-oriented",
          "Brand conscious"
        ],
        behaviors: [
          "Regular gym-goers",
          "Online shoppers",
          "Social media active",
          "Willing to pay premium for quality"
        ],
        channels: ["Modern Trade", "E-commerce", "Instagram"],
        positioning: `For busy professionals who want a healthy lifestyle, ${productName} is a premium ${productForm} that delivers convenience without compromising on nutrition.`,
        tagline: "Fuel Your Success, Naturally",
        messages: {
          whatsapp: `🌟 Introducing ${productName}: Your daily dose of wellness in a convenient ${productForm}! Made with ${ingredients}. Perfect for your busy lifestyle. Order now and get 10% off your first purchase! 💪`,
          instagram: `Elevate your wellness journey with ${productName} 🌱✨\n\nPacked with ${ingredients}, our premium ${productForm} is designed for those who refuse to compromise on health or taste.\n\n#HealthyLiving #WellnessJourney #CleanEating`
        }
      },
      {
        name: "Fitness Enthusiasts",
        description: "Active individuals focused on performance and muscle recovery",
        demographics: [
          "Age: 18-35",
          "Gym members",
          "Sports enthusiasts",
          "Suburban/urban"
        ],
        psychographics: [
          "Performance-driven",
          "Nutrition-conscious",
          "Goal-oriented",
          "Community-focused"
        ],
        behaviors: [
          "Regular workout routine",
          "Tracks macros",
          "Follows fitness influencers",
          "Uses fitness apps"
        ],
        channels: ["D2C", "Modern Trade", "Instagram"],
        positioning: `For fitness enthusiasts seeking peak performance, ${productName} is the premium ${productForm} that delivers optimal nutrition for maximum results.`,
        tagline: "Power Your Performance",
        messages: {
          whatsapp: `💪 Level up your gains with ${productName}! Premium ${productForm} packed with ${ingredients}. Perfect pre/post workout nutrition. Join our fitness community and save 15% on your first order! 🏋️‍♂️`,
          instagram: `Transform your workout with ${productName} 💪\n\nEngineered for performance with ${ingredients}. Your perfect workout partner in a convenient ${productForm}.\n\n#FitnessGoals #WorkoutNutrition #PerformanceFuel`
        }
      }
    ];

    // Save segments to database
    const savedSegments = [];
    for (const segment of mockSegments) {
      const { data, error: segmentError } = await supabase
        .from('segments')
        .insert({
          project_id: finalProjectId,
          user_id: user.id,
          name: segment.name,
          description: segment.description,
          demographics: segment.demographics,
          psychographics: segment.psychographics,
          behaviors: segment.behaviors,
          channels: segment.channels,
          positioning: segment.positioning,
          tagline: segment.tagline,
          messages: segment.messages
        })
        .select()
        .single();

      if (segmentError) {
        console.error('Database insertion error:', segmentError);
        throw new Error(`Database error: ${segmentError.message}`);
      }

      savedSegments.push(data);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        segments: savedSegments,
        projectId: finalProjectId // Return the new project ID if one was created
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
        success: false 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.message.includes('Authentication') ? 401 : 500,
      }
    );
  }
});