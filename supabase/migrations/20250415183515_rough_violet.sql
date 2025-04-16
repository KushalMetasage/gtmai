/*
  # Disable RLS and Remove Policies
  
  1. Changes
    - Disable RLS on projects table
    - Disable RLS on landscape_insights table
    - Remove all existing policies
*/

-- Disable RLS on projects table
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;

-- Disable RLS on landscape_insights table
ALTER TABLE landscape_insights DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can insert own projects" ON projects;
DROP POLICY IF EXISTS "Users can read own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert own landscape insights" ON landscape_insights;
DROP POLICY IF EXISTS "Users can read own landscape insights" ON landscape_insights;