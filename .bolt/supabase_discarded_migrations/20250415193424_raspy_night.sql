/*
  # Enable RLS and add policies for segments table

  1. Security Changes
    - Enable Row Level Security (RLS) on segments table
    - Add policies for:
      - Insert: Authenticated users can insert their own segments
      - Select: Users can read segments they created
      - Update: Users can update their own segments
      - Delete: Users can delete their own segments

  2. Notes
    - All operations are restricted to the user's own records
    - Project-based access is enforced through user_id matching
*/

-- Enable RLS
ALTER TABLE segments ENABLE ROW LEVEL SECURITY;

-- Policy for inserting segments
CREATE POLICY "Users can insert their own segments"
ON segments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy for reading segments
CREATE POLICY "Users can read their own segments"
ON segments
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy for updating segments
CREATE POLICY "Users can update their own segments"
ON segments
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy for deleting segments
CREATE POLICY "Users can delete their own segments"
ON segments
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);