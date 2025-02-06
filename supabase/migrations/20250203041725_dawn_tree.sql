/*
  # Create ledger tables

  1. New Tables
    - `accounts`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key to companies)
      - `code` (text, required)
      - `name` (text, required)
      - `type` (text, required)
      - `parent_id` (uuid, self-reference)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `transactions`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key to companies)
      - `date` (date, required)
      - `description` (text, required)
      - `status` (text, required)
      - `created_by` (uuid, foreign key to auth.users)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `transaction_entries`
      - `id` (uuid, primary key)
      - `transaction_id` (uuid, foreign key to transactions)
      - `account_id` (uuid, foreign key to accounts)
      - `amount` (numeric, required)
      - `currency` (text, required)
      - `type` (text, required)
      - `description` (text)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to:
      - Read/write accounts for their companies
      - Read/write transactions for their companies
      - Read/write transaction entries for their transactions
*/

-- Accounts table
CREATE TABLE IF NOT EXISTS accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id),
  code text NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
  parent_id uuid REFERENCES accounts(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, code)
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id),
  date date NOT NULL,
  description text NOT NULL,
  status text NOT NULL CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Transaction entries table
CREATE TABLE IF NOT EXISTS transaction_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES accounts(id),
  amount numeric(19,4) NOT NULL,
  currency text NOT NULL,
  type text NOT NULL CHECK (type IN ('debit', 'credit')),
  description text,
  CONSTRAINT balanced_transaction CHECK (
    amount >= 0
  )
);

-- Enable RLS
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_entries ENABLE ROW LEVEL SECURITY;

-- Accounts policies
CREATE POLICY "Users can read accounts for their companies"
  ON accounts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = accounts.company_id
    )
  );

CREATE POLICY "Users can insert accounts for their companies"
  ON accounts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = accounts.company_id
    )
  );

CREATE POLICY "Users can update accounts for their companies"
  ON accounts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = accounts.company_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = accounts.company_id
    )
  );

-- Transactions policies
CREATE POLICY "Users can read transactions for their companies"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = transactions.company_id
    )
  );

CREATE POLICY "Users can insert transactions for their companies"
  ON transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = transactions.company_id
    )
  );

CREATE POLICY "Users can update their own transactions"
  ON transactions
  FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
  )
  WITH CHECK (
    created_by = auth.uid()
  );

-- Transaction entries policies
CREATE POLICY "Users can read transaction entries"
  ON transaction_entries
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM transactions
      WHERE transactions.id = transaction_entries.transaction_id
    )
  );

CREATE POLICY "Users can insert transaction entries"
  ON transaction_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM transactions
      WHERE transactions.id = transaction_entries.transaction_id
      AND transactions.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update transaction entries"
  ON transaction_entries
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM transactions
      WHERE transactions.id = transaction_entries.transaction_id
      AND transactions.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM transactions
      WHERE transactions.id = transaction_entries.transaction_id
      AND transactions.created_by = auth.uid()
    )
  );