/*
  # Update CORS configuration for authentication

  1. Changes
    - Add comprehensive CORS configuration
    - Allow specific authentication headers
    - Set secure defaults for auth endpoints

  2. Security
    - Enables CORS with secure defaults
    - Allows required authentication headers
    - Sets appropriate cache control
*/

-- Create auth settings function
CREATE OR REPLACE FUNCTION auth.set_auth_config()
RETURNS void AS $$
BEGIN
  -- Basic auth settings
  PERFORM set_config('auth.email_confirmations', 'false', false);
  PERFORM set_config('auth.enable_signup', 'true', false);

  -- CORS settings
  PERFORM set_config('auth.enable_cors', 'true', false);
  PERFORM set_config('auth.allowed_origins', '*', false);
  
  -- Required headers for auth
  PERFORM set_config('auth.allowed_headers', 
    'Authorization,X-Client-Info,X-Client-Version,X-Client-Proto,Content-Type,Accept,Origin,Referer,User-Agent', 
    false
  );
  
  -- Allow required methods
  PERFORM set_config('auth.allowed_methods', 'GET,POST,PUT,DELETE,OPTIONS', false);
  
  -- Set cache control
  PERFORM set_config('auth.max_age', '3600', false);
  
  -- Cookie settings
  PERFORM set_config('auth.cookie_options', json_build_object(
    'secure', true,
    'httpOnly', true,
    'sameSite', 'lax'
  )::text, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute the configuration
SELECT auth.set_auth_config();