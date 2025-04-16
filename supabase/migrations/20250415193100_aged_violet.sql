/*
  # Create creative briefs table

  1. New Tables
    - `creative_briefs`
      - `id` (uuid, primary key)
      - `project_id` (uuid, references projects)
      - `user_id` (uuid, references auth.users)
      - `version` (integer)
      - `objective` (text)
      - `target_segment` (jsonb)
      - `key_messages` (text[])
      - `mandatory_claims` (text[])
      - `tone_voice` (jsonb)
      - `visual_ideas` (text[])
      - `created_at` (timestamptz)

  2. Security
    - Disable RLS on `creative_briefs` table
*/

CREATE TABLE IF NOT EXISTS creative_briefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  version integer NOT NULL DEFAULT 1,
  objective text NOT NULL,
  target_segment jsonb NOT NULL,
  key_messages text[] NOT NULL DEFAULT '{}',
  mandatory_claims text[] NOT NULL DEFAULT '{}',
  tone_voice jsonb NOT NULL,
  visual_ideas text[] NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Disable RLS as requested
ALTER TABLE creative_briefs DISABLE ROW LEVEL SECURITY;