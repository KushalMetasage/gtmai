/*
  # Add Consumer Sentiment Tables
  
  1. New Tables
    - consumer_sentiment table to store sentiment analysis results
    - sentiment_sources table to track where insights came from
*/

-- Create enum for sentiment types
CREATE TYPE sentiment_type AS ENUM ('positive', 'negative', 'neutral');

-- Create enum for source types
CREATE TYPE source_type AS ENUM ('amazon', 'reddit', 'youtube');

-- Create table for sentiment analysis results
CREATE TABLE consumer_sentiment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  category text NOT NULL,
  insight_type text NOT NULL,
  sentiment sentiment_type NOT NULL,
  content text NOT NULL,
  keywords text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create table for sentiment sources
CREATE TABLE sentiment_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sentiment_id uuid REFERENCES consumer_sentiment(id) ON DELETE CASCADE,
  source_type source_type NOT NULL,
  source_url text NOT NULL,
  source_text text NOT NULL,
  created_at timestamptz DEFAULT now()
);