/*
  # Setup User Permissions and RLS Policies

  1. Security Updates
    - Enable RLS on landscape_insights table
    - Add policies for authenticated users to manage their landscape insights
    - Ensure proper cascading delete when projects are removed

  2. Changes
    - Add RLS policies for landscape_insights table
    - Update foreign key constraint with CASCADE delete
*/

-- Enable RLS on landscape_insights table if not already enabled
ALTER TABLE landscape_insights ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert own landscape insights" ON landscape_insights;
DROP POLICY IF EXISTS "Users can read own landscape insights" ON landscape_insights;

-- Create policies for landscape_insights
CREATE POLICY "Users can insert own landscape insights"
ON landscape_insights
FOR INSERT
TO authenticated
WITH CHECK (
  project_id IN (
    SELECT id FROM projects 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can read own landscape insights"
ON landscape_insights
FOR SELECT
TO authenticated
USING (
  project_id IN (
    SELECT id FROM projects 
    WHERE user_id = auth.uid()
  )
);

-- Update foreign key constraint to cascade deletes
ALTER TABLE landscape_insights 
DROP CONSTRAINT IF EXISTS landscape_insights_project_id_fkey,
ADD CONSTRAINT landscape_insights_project_id_fkey 
  FOREIGN KEY (project_id) 
  REFERENCES projects(id) 
  ON DELETE CASCADE;