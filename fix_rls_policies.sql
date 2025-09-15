-- Fix RLS policies for proper functioning
-- Run this in your Supabase SQL editor

-- 1. Drop the problematic profiles policy that causes infinite recursion
DROP POLICY IF EXISTS "Users can view profiles in their own school" ON public.profiles;

-- 2. Drop existing policies for clean slate
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Head teachers can view profiles in their school" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view schools" ON public.schools;
DROP POLICY IF EXISTS "Authenticated users can view schools" ON public.schools;

-- 3. Create a simpler, non-recursive policy for profiles
-- This assumes profiles have a school_id that gets set during signup
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- 4. Allow head teachers to view all profiles in their school
-- We'll need to fix this later when we have proper role management
CREATE POLICY "Head teachers can view profiles in their school" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role = 'head_teacher' 
      AND p.school_id = profiles.school_id
    )
  );

-- 5. Enable RLS on schools table and allow public read access
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- 6. Create policy to allow anyone to read schools (needed for signup form)
CREATE POLICY "Anyone can view schools" ON public.schools
  FOR SELECT TO public
  USING (true);

-- 7. Allow authenticated users to read schools as well
CREATE POLICY "Authenticated users can view schools" ON public.schools
  FOR SELECT TO authenticated
  USING (true);
