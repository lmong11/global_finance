/*
  # Create companies table

  1. New Tables
    - `companies`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `code` (text, required, unique)
      - `tax_id` (text)
      - `currency` (text, required)
      - `fiscal_year_end` (text, required)
      - `address` (jsonb)
      - `status` (text, required)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `companies` table
    - Add policies for authenticated users to:
      - Read all companies
      - Create new companies
      - Update companies they have access to
*/

CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  tax_id text,
  currency text NOT NULL,
  fiscal_year_end text NOT NULL,
  address jsonb,
  status text NOT NULL CHECK (status IN ('active', 'inactive')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all companies
CREATE POLICY "Users can read all companies"
  ON companies
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to create companies
CREATE POLICY "Users can create companies"
  ON companies
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update companies
CREATE POLICY "Users can update companies"
  ON companies
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);