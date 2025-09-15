-- Fix RLS policies to allow users to read their own profiles
-- The current policy might be too restrictive

-- 1. Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Head teachers can view profiles in their school" ON public.profiles;

-- 2. Create a simple policy that allows users to see their own profile
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- 3. Allow users to update their own profile
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- 4. Create separate policies for different roles to view other profiles
CREATE POLICY "Head teachers can view all profiles in their school" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    auth.uid() IN (
      SELECT p.id FROM public.profiles p 
      WHERE p.role = 'head_teacher' 
      AND p.school_id = profiles.school_id
    )
  );

CREATE POLICY "Teachers can view students in their classrooms" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    profiles.role = 'student' AND
    auth.uid() IN (
      SELECT ct.teacher_id FROM public.classroom_teachers ct
      JOIN public.progress pr ON ct.classroom_id = pr.classroom_id
      WHERE pr.student_id = profiles.id
    )
  );

-- 5. Test the policy by checking if the current user can see their profile
SELECT 'Policy test result:' as test, count(*) as profile_count
FROM public.profiles 
WHERE id = auth.uid();
