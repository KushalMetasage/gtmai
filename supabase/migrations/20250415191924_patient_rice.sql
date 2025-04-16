/*
  # Create channel feasibility table

  1. New Tables
    - `channel_feasibility`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to projects)
      - `user_id` (uuid, foreign key to users)
      - `city_tier` (text)
      - `channel` (text)
      - `feasibility_score` (text)
      - `rationale` (text)
      - `created_at` (timestamptz)

  2. Security
    - Disable RLS on `channel_feasibility` table
*/

CREATE TABLE IF NOT EXISTS channel_feasibility (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  city_tier text NOT NULL,
  channel text NOT NULL,
  feasibility_score text NOT NULL,
  rationale text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Disable RLS as requested
ALTER TABLE channel_feasibility DISABLE ROW LEVEL SECURITY;