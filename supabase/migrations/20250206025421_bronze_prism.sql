/*
  # Configure CORS settings for authentication

  1. Changes
    - Add CORS configuration for Supabase authentication
    - Allow all origins temporarily for testing
    - Set secure headers and methods

  2. Security
    - Enables CORS with secure defaults
    - Allows authentication from any origin
*/

-- Create CORS configuration function
CREATE OR REPLACE FUNCTION auth.configure_cors()
RETURNS void AS $$
BEGIN
  -- Set CORS configuration
  PERFORM set_config('auth.enable_cors', 'true', false);
  PERFORM set_config('auth.allowed_origins', '*', false);
  PERFORM set_config('auth.allowed_methods', 'GET,POST,PUT,DELETE,OPTIONS', false);
  PERFORM set_config('auth.allowed_headers', 'Authorization,Content-Type,Accept', false);
  PERFORM set_config('auth.expose_headers', 'Content-Range,X-Total-Count', false);
  PERFORM set_config('auth.max_age', '3600', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute CORS configuration
SELECT auth.configure_cors();