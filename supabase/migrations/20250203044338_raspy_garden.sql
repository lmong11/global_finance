-- Remove RLS from companies table
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE accounts DISABLE ROW LEVEL SECURITY;

-- Insert default company if it doesn't exist
INSERT INTO companies (
  id,
  name,
  code,
  currency,
  fiscal_year_end,
  status,
  created_at,
  updated_at
)
VALUES (
  '123e4567-e89b-12d3-a456-426614174000',
  'Default Company',
  'DEFAULT',
  'USD',
  '12-31',
  'active',
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;