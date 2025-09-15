-- COMPLETE RLS RESET - Remove all problematic policies and start fresh
-- Run this in your Supabase SQL editor

-- 1. Disable RLS temporarily to clear everything
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Head teachers can view all profiles in their school" ON public.profiles;
DROP POLICY IF EXISTS "Teachers can view students in their classrooms" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- 3. Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Create ONLY the essential policy for users to see their own profile
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- 5. Allow users to update their own profile  
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- 6. Allow users to insert their own profile (for the trigger)
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- 7. Test the policy
SELECT 'Policy test - should return 1:' as test, count(*) as profile_count
FROM public.profiles 
WHERE id = auth.uid();

-- 8. Show current user info for debugging
SELECT 
  'Current user info:' as info,
  auth.uid() as user_id,
  auth.email() as user_email;
