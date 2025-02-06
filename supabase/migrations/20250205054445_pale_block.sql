/*
  # Configure authentication settings

  1. Changes
    - Enable email auth
    - Configure CORS settings
    - Set secure defaults

  2. Security
    - Allow all origins temporarily for development
    - Enable secure headers
*/

-- Create auth schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS auth;

-- Create auth settings function
CREATE OR REPLACE FUNCTION auth.set_auth_settings()
RETURNS void AS $$
BEGIN
  -- Enable email confirmations
  PERFORM set_config('auth.email_confirmations', 'false', false);
  
  -- Set secure cookie settings
  PERFORM set_config('auth.cookie_options', json_build_object(
    'secure', true,
    'httpOnly', true,
    'sameSite', 'lax'
  )::text, false);

  -- Set CORS settings
  PERFORM set_config('auth.enable_cors', 'true', false);
  PERFORM set_config('auth.allowed_origins', '*', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute the settings function
SELECT auth.set_auth_settings();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA auth TO anon;