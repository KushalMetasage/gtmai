/*
  # Disable RLS for all tables
  
  1. Changes
    - Disable RLS on all tables
    - Remove any existing RLS policies
*/

-- Disable RLS on projects table
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;

-- Disable RLS on consumer_sentiment table
ALTER TABLE consumer_sentiment DISABLE ROW LEVEL SECURITY;

-- Disable RLS on sentiment_sources table
ALTER TABLE sentiment_sources DISABLE ROW LEVEL SECURITY;

-- Disable RLS on segments table
ALTER TABLE segments DISABLE ROW LEVEL SECURITY;

-- Disable RLS on gtm_plans table
ALTER TABLE gtm_plans DISABLE ROW LEVEL SECURITY;

-- Disable RLS on landscape_insights table
ALTER TABLE landscape_insights DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Users can read own segments" ON segments;
DROP POLICY IF EXISTS "Users can create segments" ON segments;
DROP POLICY IF EXISTS "Users can update own segments" ON segments;
DROP POLICY IF EXISTS "Users can delete own segments" ON segments;

DROP POLICY IF EXISTS "Users can read own consumer_sentiment" ON consumer_sentiment;
DROP POLICY IF EXISTS "Users can create consumer_sentiment" ON consumer_sentiment;
DROP POLICY IF EXISTS "Users can update own consumer_sentiment" ON consumer_sentiment;
DROP POLICY IF EXISTS "Users can delete own consumer_sentiment" ON consumer_sentiment;

DROP POLICY IF EXISTS "Users can read own sentiment_sources" ON sentiment_sources;
DROP POLICY IF EXISTS "Users can create sentiment_sources" ON sentiment_sources;
DROP POLICY IF EXISTS "Users can update own sentiment_sources" ON sentiment_sources;
DROP POLICY IF EXISTS "Users can delete own sentiment_sources" ON sentiment_sources;

DROP POLICY IF EXISTS "Users can read own landscape_insights" ON landscape_insights;
DROP POLICY IF EXISTS "Users can create landscape_insights" ON landscape_insights;
DROP POLICY IF EXISTS "Users can update own landscape_insights" ON landscape_insights;
DROP POLICY IF EXISTS "Users can delete own landscape_insights" ON landscape_insights;

DROP POLICY IF EXISTS "Users can read own gtm_plans" ON gtm_plans;
DROP POLICY IF EXISTS "Users can create gtm_plans" ON gtm_plans;
DROP POLICY IF EXISTS "Users can update own gtm_plans" ON gtm_plans;
DROP POLICY IF EXISTS "Users can delete own gtm_plans" ON gtm_plans;