/*
  # Add sample data for Creative Brief feature

  1. Sample Data
    - Adds example creative briefs with realistic content
    - Links to existing projects, segments, and brand vision data
    - Includes multiple versions to demonstrate versioning

  2. Structure
    - Creative briefs with full content
    - Linked to projects and segments
    - Includes versioning and timestamps
*/

-- Insert sample creative briefs
INSERT INTO creative_briefs (
  id,
  project_id,
  user_id,
  version,
  objective,
  target_segment,
  key_messages,
  mandatory_claims,
  tone_voice,
  visual_ideas,
  created_at
) VALUES 
(
  'cb71e2c6-1234-4567-8901-abcdef123456',
  (SELECT id FROM projects WHERE category = 'Plant based protein drinks' LIMIT 1),
  (SELECT user_id FROM projects WHERE category = 'Plant based protein drinks' LIMIT 1),
  1,
  'Drive awareness and consideration among health-conscious professionals through compelling creative that emphasizes our unique value proposition in natural plant-based nutrition',
  jsonb_build_object(
    'name', 'Health-Conscious Professionals',
    'description', 'Urban professionals aged 25-40 who prioritize health and convenience',
    'demographics', array['Age: 25-40', 'Urban areas', 'High disposable income', 'College educated'],
    'psychographics', array['Health-conscious', 'Time-starved', 'Quality-oriented', 'Brand conscious'],
    'behaviors', array['Regular gym-goers', 'Online shoppers', 'Social media active', 'Willing to pay premium for quality']
  ),
  ARRAY[
    'Natural plant-based protein that fits your busy lifestyle',
    'Premium quality ingredients for optimal nutrition',
    'Convenient and delicious way to fuel your day'
  ],
  ARRAY[
    'All natural ingredients',
    'No artificial additives',
    'High protein content',
    'Scientifically proven benefits'
  ],
  jsonb_build_object(
    'brand_tone', 'Premium yet approachable',
    'communication_dos', array[
      'Use confident, empowering language',
      'Highlight scientific benefits',
      'Focus on quality and natural ingredients',
      'Emphasize convenience and lifestyle fit'
    ],
    'communication_donts', array[
      'Avoid aggressive sales language',
      'Don''t use technical jargon',
      'Avoid making unsubstantiated claims',
      'Don''t compare directly to competitors'
    ]
  ),
  ARRAY[
    'Lifestyle shots of professionals enjoying the product during their busy day',
    'Clean, minimalist product photography highlighting ingredients',
    'Split-screen before/after energy levels visualization',
    'Quick, dynamic social media stories showing product integration into daily routine'
  ],
  NOW()
),
(
  'cb71e2c6-1234-4567-8901-abcdef123457',
  (SELECT id FROM projects WHERE category = 'Plant based protein drinks' LIMIT 1),
  (SELECT user_id FROM projects WHERE category = 'Plant based protein drinks' LIMIT 1),
  2,
  'Establish brand leadership in the premium plant-based protein segment by showcasing our commitment to quality, sustainability, and performance',
  jsonb_build_object(
    'name', 'Fitness Enthusiasts',
    'description', 'Active individuals focused on performance and muscle recovery',
    'demographics', array['Age: 18-35', 'Gym members', 'Sports enthusiasts', 'Suburban/urban'],
    'psychographics', array['Performance-driven', 'Nutrition-conscious', 'Goal-oriented', 'Community-focused'],
    'behaviors', array['Regular workout routine', 'Tracks macros', 'Follows fitness influencers', 'Uses fitness apps']
  ),
  ARRAY[
    'Superior plant protein for peak performance',
    'Clean, sustainable nutrition for active lifestyles',
    'Science-backed formula for optimal results'
  ],
  ARRAY[
    'Plant-based',
    'High protein content',
    'All natural ingredients',
    'Scientifically formulated'
  ],
  jsonb_build_object(
    'brand_tone', 'Energetic and authoritative',
    'communication_dos', array[
      'Use dynamic, action-oriented language',
      'Include performance metrics and benefits',
      'Showcase real athlete testimonials',
      'Highlight scientific backing'
    ],
    'communication_donts', array[
      'Avoid exclusive/intimidating language',
      'Don''t oversell or make extreme claims',
      'Avoid generic fitness clichés',
      'Don''t undermine other protein sources'
    ]
  ),
  ARRAY[
    'Dynamic workout action shots with product integration',
    'Before/during/after workout sequence featuring the product',
    'Ingredient spotlight series highlighting key components',
    'User-generated content from athlete ambassadors'
  ],
  NOW()
);