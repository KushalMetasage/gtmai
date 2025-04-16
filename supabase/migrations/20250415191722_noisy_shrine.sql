/*
  # Create qualitative research insights tables

  1. New Tables
    - `qual_research_insights`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to projects)
      - `user_id` (uuid, foreign key to users)
      - `research_type` (enum: 'fgd', 'di', 'expert_interview')
      - `file_name` (text)
      - `file_url` (text)
      - `themes` (jsonb)
      - `key_quotes` (text[])
      - `sentiment` (sentiment_type)
      - `barriers` (text[])
      - `drivers` (text[])
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `qual_research_insights` table
*/

-- Create research type enum
CREATE TYPE research_type AS ENUM ('fgd', 'di', 'expert_interview');

-- Create qualitative research insights table
CREATE TABLE IF NOT EXISTS qual_research_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  research_type research_type NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  themes jsonb NOT NULL DEFAULT '[]'::jsonb,
  key_quotes text[] NOT NULL DEFAULT '{}',
  sentiment sentiment_type NOT NULL,
  barriers text[] NOT NULL DEFAULT '{}',
  drivers text[] NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Disable RLS as requested
ALTER TABLE qual_research_insights DISABLE ROW LEVEL SECURITY;