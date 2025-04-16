/*
  # Create landscape insights tables

  1. New Tables
    - `projects`
      - `id` (uuid, primary key)
      - `category` (text)
      - `geography` (text)
      - `brand` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `landscape_insights`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key)
      - `competitor_name` (text)
      - `product_name` (text)
      - `price` (numeric)
      - `pack_size` (text)
      - `claims` (text[])
      - `listing_url` (text)
      - `platform` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to read/write their own data
*/

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  geography text NOT NULL,
  brand text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create landscape_insights table
CREATE TABLE IF NOT EXISTS landscape_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  competitor_name text NOT NULL,
  product_name text NOT NULL,
  price numeric NOT NULL,
  pack_size text NOT NULL,
  claims text[] NOT NULL DEFAULT '{}',
  listing_url text NOT NULL,
  platform text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE landscape_insights ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own projects"
  ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read own landscape insights"
  ON landscape_insights
  FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE auth.uid() = projects.id
    )
  );

CREATE POLICY "Users can insert own landscape insights"
  ON landscape_insights
  FOR INSERT
  TO authenticated
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE auth.uid() = projects.id
    )
  );