-- Check and fix RLS policies for profiles table
-- This ensures head teachers can see all profiles in their school

-- First, check current policies
SELECT 
  'Current RLS policies for profiles table:' as info,
  schemaname, 
  tablename, 
  policyname, 
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- Drop and recreate more permissive policies for profiles
DROP POLICY IF EXISTS "Users can view profiles in their own school" ON public.profiles;

-- Allow users to view profiles in their own school
CREATE POLICY "Users can view profiles in their school"
  ON public.profiles FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Test the policies by checking what profiles the current user can see
SELECT 
  'Profiles visible to current user:' as info,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE role = 'teacher') as teacher_count,
  COUNT(*) FILTER (WHERE role = 'student') as student_count,
  COUNT(*) FILTER (WHERE role = 'head_teacher') as head_teacher_count
FROM public.profiles;

-- Show specific teachers
SELECT 
  'Teachers in your school:' as info,
  id,
  full_name,
  role
FROM public.profiles 
WHERE role = 'teacher'
ORDER BY full_name;
