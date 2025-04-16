/*
  # Remove RLS from all tables

  1. Changes
    - Disable RLS on segments table
    - Remove RLS policies from segments table
    - Disable RLS on consumer_sentiment table
    - Remove RLS policies from consumer_sentiment table
    - Disable RLS on sentiment_sources table
    - Remove RLS policies from sentiment_sources table
    - Disable RLS on landscape_insights table
    - Remove RLS policies from landscape_insights table
*/

-- Disable RLS and remove policies from segments table
ALTER TABLE segments DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own segments" ON segments;
DROP POLICY IF EXISTS "Users can create segments" ON segments;
DROP POLICY IF EXISTS "Users can update own segments" ON segments;
DROP POLICY IF EXISTS "Users can delete own segments" ON segments;

-- Disable RLS and remove policies from consumer_sentiment table
ALTER TABLE consumer_sentiment DISABLE ROW LEVEL SECURITY;

-- Disable RLS and remove policies from sentiment_sources table
ALTER TABLE sentiment_sources DISABLE ROW LEVEL SECURITY;

-- Disable RLS and remove policies from landscape_insights table
ALTER TABLE landscape_insights DISABLE ROW LEVEL SECURITY;