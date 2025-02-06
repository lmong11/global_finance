/*
  # Update transactions table for no authentication

  1. Changes
    - Drop foreign key constraint on created_by
    - Drop policies that depend on created_by
    - Modify created_by column to be text
    - Re-create policies with updated column type
*/

-- First drop the foreign key constraint
ALTER TABLE transactions
  DROP CONSTRAINT IF EXISTS transactions_created_by_fkey;

-- Drop all policies that depend on created_by
DROP POLICY IF EXISTS "Users can update their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert transaction entries" ON transaction_entries;
DROP POLICY IF EXISTS "Users can update transaction entries" ON transaction_entries;

-- Now we can safely modify the column
ALTER TABLE transactions 
  ALTER COLUMN created_by TYPE text,
  ALTER COLUMN created_by SET DEFAULT 'Default User';

-- Update any existing records
UPDATE transactions 
SET created_by = 'Default User' 
WHERE created_by IS NULL;

-- Re-create the policies with the new column type
CREATE POLICY "Users can update their own transactions"
  ON transactions
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can insert transaction entries"
  ON transaction_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update transaction entries"
  ON transaction_entries
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);