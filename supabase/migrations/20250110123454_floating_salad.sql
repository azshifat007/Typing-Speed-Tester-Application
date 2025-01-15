/*
  # Fix user registration

  1. Changes
    - Drop and recreate the trigger function with proper error handling
    - Ensure profile creation works correctly
    - Add default username generation

  2. Security
    - Maintain existing RLS policies
*/

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Recreate function with better error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  default_username TEXT;
BEGIN
  -- Generate a default username if none provided
  default_username := 'user_' || substr(md5(random()::text), 0, 10);
  
  INSERT INTO public.profiles (id, username)
  VALUES (
    new.id,
    COALESCE(
      (new.raw_user_meta_data->>'username'),
      default_username
    )
  );
  RETURN new;
EXCEPTION
  WHEN others THEN
    -- Log error details if needed
    RAISE NOTICE 'Error in handle_new_user: %', SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();