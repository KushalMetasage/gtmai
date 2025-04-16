/*
  # Create packaging reviews table

  1. New Tables
    - `packaging_reviews`
      - `id` (uuid, primary key)
      - `project_id` (uuid, references projects)
      - `user_id` (uuid, references auth.users)
      - `front_image_url` (text)
      - `back_image_url` (text)
      - `scanned_text` (text)
      - `claims` (text[])
      - `readability_score` (numeric)
      - `clutter_score` (numeric)
      - `compliance_issues` (jsonb)
      - `recommendations` (text[])
      - `created_at` (timestamptz)

  2. Security
    - Disable RLS on `packaging_reviews` table
*/

CREATE TABLE IF NOT EXISTS packaging_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  front_image_url text,
  back_image_url text,
  scanned_text text,
  claims text[] DEFAULT '{}',
  readability_score numeric,
  clutter_score numeric,
  compliance_issues jsonb DEFAULT '[]',
  recommendations text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Disable RLS as requested
ALTER TABLE packaging_reviews DISABLE ROW LEVEL SECURITY;