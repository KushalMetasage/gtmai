/*
  # Create GTM Plans Schema

  1. New Tables
    - `gtm_plans`
      - `id` (uuid, primary key)
      - `project_id` (uuid, references projects)
      - `user_id` (uuid, references auth.users)
      - `name` (text)
      - `description` (text)
      - `awareness_strategies` (jsonb)
      - `consideration_strategies` (jsonb)
      - `conversion_strategies` (jsonb)
      - `loyalty_strategies` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Changes
    - Add trigger for updated_at timestamp
*/

-- Create GTM plans table
CREATE TABLE IF NOT EXISTS gtm_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  name text NOT NULL,
  description text,
  awareness_strategies jsonb DEFAULT '[]'::jsonb,
  consideration_strategies jsonb DEFAULT '[]'::jsonb,
  conversion_strategies jsonb DEFAULT '[]'::jsonb,
  loyalty_strategies jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_gtm_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER gtm_plans_updated_at
  BEFORE UPDATE ON gtm_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_gtm_plans_updated_at();