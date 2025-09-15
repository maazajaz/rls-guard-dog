-- Update RLS policies for complete functionality
-- Run this in your Supabase SQL editor

-- First, ensure RLS is enabled on all necessary tables
ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_teachers ENABLE ROW LEVEL SECURITY;

-- Drop existing progress policies to start fresh
DROP POLICY IF EXISTS "Students can view their own progress" ON public.progress;
DROP POLICY IF EXISTS "Teachers can view progress for students in their classes" ON public.progress;
DROP POLICY IF EXISTS "Head teachers can view all progress in their school" ON public.progress;
DROP POLICY IF EXISTS "Teachers can insert progress for students in their classes" ON public.progress;
DROP POLICY IF EXISTS "Teachers can update progress for students in their classes" ON public.progress;

-- Progress table policies
-- 1. Students can view their own progress
CREATE POLICY "Students can view their own progress" ON public.progress
  FOR SELECT TO authenticated
  USING (student_id = auth.uid());

-- 2. Teachers can view progress for students in their assigned classrooms
CREATE POLICY "Teachers can view progress in their classrooms" ON public.progress
  FOR SELECT TO authenticated
  USING (
    classroom_id IN (
      SELECT ct.classroom_id 
      FROM public.classroom_teachers ct 
      WHERE ct.teacher_id = auth.uid()
    )
  );

-- 3. Head teachers can view all progress in their school
CREATE POLICY "Head teachers can view school progress" ON public.progress
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role = 'head_teacher'
      AND p.school_id = (
        SELECT c.school_id 
        FROM public.classrooms c 
        WHERE c.id = progress.classroom_id
      )
    )
  );

-- 4. Teachers can insert progress for students in their classrooms
CREATE POLICY "Teachers can insert progress" ON public.progress
  FOR INSERT TO authenticated
  WITH CHECK (
    classroom_id IN (
      SELECT ct.classroom_id 
      FROM public.classroom_teachers ct 
      WHERE ct.teacher_id = auth.uid()
    )
  );

-- 5. Teachers can update progress they created
CREATE POLICY "Teachers can update progress" ON public.progress
  FOR UPDATE TO authenticated
  USING (
    classroom_id IN (
      SELECT ct.classroom_id 
      FROM public.classroom_teachers ct 
      WHERE ct.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    classroom_id IN (
      SELECT ct.classroom_id 
      FROM public.classroom_teachers ct 
      WHERE ct.teacher_id = auth.uid()
    )
  );

-- Classrooms table policies
DROP POLICY IF EXISTS "Users can view classrooms in their school" ON public.classrooms;

CREATE POLICY "Users can view classrooms in their school" ON public.classrooms
  FOR SELECT TO authenticated
  USING (
    school_id = (
      SELECT p.school_id 
      FROM public.profiles p 
      WHERE p.id = auth.uid()
    )
  );

-- Classroom_teachers table policies
DROP POLICY IF EXISTS "Teachers can view their classroom assignments" ON public.classroom_teachers;
DROP POLICY IF EXISTS "Head teachers can view all classroom assignments" ON public.classroom_teachers;

CREATE POLICY "Teachers can view their classroom assignments" ON public.classroom_teachers
  FOR SELECT TO authenticated
  USING (teacher_id = auth.uid());

CREATE POLICY "Head teachers can view classroom assignments in their school" ON public.classroom_teachers
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role = 'head_teacher'
      AND p.school_id = (
        SELECT c.school_id 
        FROM public.classrooms c 
        WHERE c.id = classroom_teachers.classroom_id
      )
    )
  );

-- Insert policies for head teachers to manage classroom assignments
CREATE POLICY "Head teachers can assign teachers to classrooms" ON public.classroom_teachers
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role = 'head_teacher'
      AND p.school_id = (
        SELECT c.school_id 
        FROM public.classrooms c 
        WHERE c.id = classroom_teachers.classroom_id
      )
    )
  );

-- Test queries to verify policies work
SELECT 'RLS Policy Update Complete' as status;

-- Show current user's role for debugging
SELECT 
  'Current user:' as info,
  p.full_name,
  p.role,
  s.name as school_name
FROM public.profiles p
JOIN public.schools s ON p.school_id = s.id
WHERE p.id = auth.uid();
