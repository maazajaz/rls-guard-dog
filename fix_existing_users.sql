-- Manual fix for existing user without profile
-- Run this in your Supabase SQL editor to create a profile for the current user

-- 1. First, let's check what users exist without profiles
SELECT 
  au.id,
  au.email,
  au.raw_user_meta_data,
  p.id as profile_id,
  p.role
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- 2. Create a profile for users without one (adjust the school_id as needed)
-- Replace 'your-school-uuid-here' with an actual school UUID from your schools table
INSERT INTO public.profiles (id, full_name, role, school_id)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email),
  'student'::public.user_role,
  '2d760439-19b7-4bb8-bfd6-f50b58f6f869'::uuid -- Crestview Institute UUID
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- 3. Verify the profiles were created
SELECT 
  au.email,
  p.full_name,
  p.role,
  s.name as school_name
FROM auth.users au
JOIN public.profiles p ON au.id = p.id
LEFT JOIN public.schools s ON p.school_id = s.id;
