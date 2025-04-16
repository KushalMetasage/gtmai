/*
  # Brand Vision Table Creation

  1. New Tables
    - `brand_vision`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to projects)
      - `user_id` (uuid, foreign key to users)
      - `mission` (text) - Brand's mission and long-term goal
      - `tone` (text) - Brand's communication tone
      - `communication_dos` (text[]) - List of communication do's
      - `communication_donts` (text[]) - List of communication don'ts
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Changes
    - Added foreign key constraints to projects and users tables
    - Added trigger for updating updated_at timestamp
*/

-- Create brand_vision table
CREATE TABLE IF NOT EXISTS brand_vision (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  mission text NOT NULL,
  tone text,
  communication_dos text[] DEFAULT '{}',
  communication_donts text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updating updated_at
CREATE TRIGGER update_brand_vision_updated_at
  BEFORE UPDATE ON brand_vision
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();