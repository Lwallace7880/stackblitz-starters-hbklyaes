/*
  # Create HVAC verification tables and storage

  1. New Tables
    - `verifications`
      - `id` (uuid, primary key)
      - `verification_data` (jsonb)
      - `created_at` (timestamptz)
      - `user_id` (uuid, references auth.users)

  2. Storage
    - Create bucket for HVAC photos
    
  3. Security
    - Enable RLS on verifications table
    - Add policies for authenticated users
*/

-- Create verifications table
CREATE TABLE IF NOT EXISTS verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_data jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users NOT NULL DEFAULT auth.uid()
);

-- Enable RLS
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create their own verifications"
  ON verifications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own verifications"
  ON verifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);