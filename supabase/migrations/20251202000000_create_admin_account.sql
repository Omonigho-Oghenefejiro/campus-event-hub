-- Create hardcoded admin account
-- Note: You need to create this user manually in Supabase Auth first

-- This migration assumes the admin user already exists with:
-- Email: admin
-- Password: admin123
-- Then manually run this SQL to assign the admin profile and role

-- First, create the admin profile (replace USER_ID with actual admin user ID from auth.users)
-- You can find the user ID in Supabase Dashboard > Authentication > Users
INSERT INTO public.profiles (id, full_name, email)
VALUES (
  -- REPLACE THIS WITH THE ACTUAL ADMIN USER ID FROM auth.users table
  'admin-user-id-placeholder', 
  'System Administrator',
  'admin'
) ON CONFLICT (id) DO UPDATE SET 
  full_name = 'System Administrator',
  email = 'admin';

-- Assign admin role (again replace USER_ID with actual admin user ID)
INSERT INTO public.user_roles (user_id, role)
VALUES (
  -- REPLACE THIS WITH THE ACTUAL ADMIN USER ID FROM auth.users table
  'admin-user-id-placeholder',
  'admin'
) ON CONFLICT (user_id, role) DO NOTHING;
