/*
  # Update user roles system

  1. Changes
    - Modify user roles to only allow 'Boss' and 'Cashier'
    - Update role assignment function to use metadata
    - Clean up existing data before applying new constraints

  2. Security
    - Maintain RLS for user roles table
    - Users can only read their own roles
*/

-- First, drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Clean up existing data
DELETE FROM user_roles WHERE role NOT IN ('Boss', 'Cashier');
UPDATE user_roles SET role = 'Cashier' WHERE role NOT IN ('Boss', 'Cashier');

-- Modify the user_roles table
DO $$ 
BEGIN
  -- Drop existing check constraint if it exists
  ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
  
  -- Add new check constraint
  ALTER TABLE user_roles ADD CONSTRAINT user_roles_role_check CHECK (role IN ('Boss', 'Cashier'));
END $$;

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read their own roles" ON user_roles;

-- Create policies
CREATE POLICY "Users can read their own roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to assign role based on metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'role', 'Cashier'));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user role assignment
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();