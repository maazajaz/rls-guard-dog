-- Simplified RLS policies that should work
-- Run this in your Supabase SQL editor

-- 1. Temporarily disable RLS to clean up
ALTER TABLE public.classrooms DISABLE ROW LEVEL SECURITY;

-- 2. Drop all existing classroom policies
DROP POLICY IF EXISTS "Head teachers create classrooms" ON public.classrooms;
DROP POLICY IF EXISTS "Users view school classrooms" ON public.classrooms;
DROP POLICY IF EXISTS "Users can view classrooms in their own school" ON public.classrooms;

-- 3. Re-enable RLS
ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;

-- 4. Create simple, working policies

-- Allow viewing classrooms in your school
CREATE POLICY "Users can view school classrooms" ON public.classrooms
  FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Allow head teachers to create classrooms in their school
CREATE POLICY "Head teachers can create classrooms" ON public.classrooms
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public.profiles 
      WHERE role = 'head_teacher' 
      AND school_id = classrooms.school_id
    )
  );

-- Test the setup
SELECT 'Classroom RLS policies updated' as status;

-- Check your current permissions
SELECT 
  'Your permissions:' as info,
  p.role,
  CASE 
    WHEN p.role = 'head_teacher' THEN 'Can create and view classrooms'
    ELSE 'Can only view classrooms'
  END as permissions
FROM public.profiles p
WHERE p.id = auth.uid();
