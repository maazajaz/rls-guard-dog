-- Fix infinite recursion in profiles RLS policy
-- The issue is that the policy references the same table it's protecting

-- Step 1: Disable RLS temporarily to clean up
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing policies
DROP POLICY IF EXISTS "Users can view profiles in their own school" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles in their school" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Step 3: Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 4: Create simple, non-recursive policies

-- Allow users to view their own profile (always allowed)
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- For now, let's allow authenticated users to view all profiles
-- (We can make this more restrictive later once we test)
CREATE POLICY "Authenticated users can view all profiles"
  ON public.profiles FOR SELECT
  USING (auth.role() = 'authenticated');

-- Step 5: Test that we can now query profiles
SELECT 
  'Profiles now accessible:' as status,
  COUNT(*) as total_profiles,
  COUNT(*) FILTER (WHERE role = 'teacher') as teachers,
  COUNT(*) FILTER (WHERE role = 'student') as students,
  COUNT(*) FILTER (WHERE role = 'head_teacher') as head_teachers
FROM public.profiles;

-- Show the teachers
SELECT 
  'Available teachers:' as info,
  id,
  full_name,
  role
FROM public.profiles 
WHERE role = 'teacher'
ORDER BY full_name;
