/*
  # Fix RLS policies for projects table

  1. Changes
    - Update projects table RLS policies to correctly handle project creation
    - Add user_id column to projects table to track ownership
    - Update existing policies to use user_id instead of id for ownership checks
    
  2. Security
    - Enable RLS on projects table (already enabled)
    - Update policies to use user_id for ownership checks
    - Ensure authenticated users can create and access their own projects
*/

-- Add user_id column to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert own projects" ON projects;
DROP POLICY IF EXISTS "Users can read own projects" ON projects;

-- Create new policies using user_id
CREATE POLICY "Users can insert own projects"
ON projects
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own projects"
ON projects
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);