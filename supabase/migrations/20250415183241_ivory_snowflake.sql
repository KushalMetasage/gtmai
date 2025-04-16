/*
  # Remove direct auth user creation
  
  This migration has been removed as user creation should be handled through
  Supabase's Auth UI instead of direct database manipulation.
  
  Users can create an account through the login page using:
  Email: any valid email
  Password: minimum 6 characters
*/

-- No SQL statements needed as auth is handled by Supabase Auth UI