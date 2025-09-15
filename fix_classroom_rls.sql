-- Fix the classroom creation RLS policy issue
-- Run this in your Supabase SQL editor

-- Drop the restrictive classroom creation policy
DROP POLICY IF EXISTS "Head teachers create classrooms" ON public.classrooms;

-- Create a simpler policy that allows head teachers to create classrooms in their own school
CREATE POLICY "Head teachers create classrooms" ON public.classrooms
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role = 'head_teacher'
      AND p.school_id = classrooms.school_id
    )
  );

-- Test the policy by showing current user info
SELECT 
  'Current user check:' as test,
  p.id,
  p.full_name,
  p.role,
  p.school_id
FROM public.profiles p
WHERE p.id = auth.uid();
