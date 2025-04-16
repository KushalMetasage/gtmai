/*
  # Add auth schema and segments table

  1. New Tables
    - `segments`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to projects)
      - `user_id` (uuid, foreign key to auth.users)
      - `name` (text)
      - `description` (text)
      - `demographics` (text array)
      - `psychographics` (text array)
      - `behaviors` (text array)
      - `channels` (text array)
      - `positioning` (text)
      - `tagline` (text)
      - `messages` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `segments` table
    - Add policies for authenticated users to:
      - Read their own segments
      - Create new segments
      - Update their own segments
      - Delete their own segments
*/

-- Create segments table with auth.users foreign key
CREATE TABLE IF NOT EXISTS segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  name text NOT NULL,
  description text,
  demographics text[],
  psychographics text[],
  behaviors text[],
  channels text[],
  positioning text,
  tagline text,
  messages jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE segments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own segments"
  ON segments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create segments"
  ON segments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own segments"
  ON segments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own segments"
  ON segments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_segments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER segments_updated_at
  BEFORE UPDATE ON segments
  FOR EACH ROW
  EXECUTE FUNCTION update_segments_updated_at();