-- Create proper database structure and RLS policies for the education management system
-- Run this in your Supabase SQL editor

-- 1. Create student_classrooms table to track which students are in which classrooms
CREATE TABLE IF NOT EXISTS public.student_classrooms (
  student_id uuid references public.profiles(id) on delete cascade not null,
  classroom_id uuid references public.classrooms(id) on delete cascade not null,
  enrolled_date date not null default now(),
  primary key (student_id, classroom_id)
);

-- Enable RLS on new table
ALTER TABLE public.student_classrooms ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing problematic RLS policies
DROP POLICY IF EXISTS "Students can view their own progress" ON public.progress;
DROP POLICY IF EXISTS "Teachers can view progress in their classrooms" ON public.progress;
DROP POLICY IF EXISTS "Head teachers can view school progress" ON public.progress;
DROP POLICY IF EXISTS "Teachers can insert progress" ON public.progress;
DROP POLICY IF EXISTS "Teachers can update progress" ON public.progress;

-- 3. Create proper RLS policies for progress table

-- Students can only view their own progress reports
CREATE POLICY "Students view own progress" ON public.progress
  FOR SELECT TO authenticated
  USING (student_id = auth.uid());

-- Teachers can view progress for students in their assigned classrooms only
CREATE POLICY "Teachers view classroom progress" ON public.progress
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.classroom_teachers ct
      WHERE ct.teacher_id = auth.uid() 
      AND ct.classroom_id = progress.classroom_id
    )
  );

-- Head teachers can view all progress in their school
CREATE POLICY "Head teachers view all school progress" ON public.progress
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.classrooms c ON c.school_id = p.school_id
      WHERE p.id = auth.uid() 
      AND p.role = 'head_teacher'
      AND c.id = progress.classroom_id
    )
  );

-- Teachers can insert progress for students in their classrooms only
CREATE POLICY "Teachers insert classroom progress" ON public.progress
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.classroom_teachers ct
      WHERE ct.teacher_id = auth.uid() 
      AND ct.classroom_id = progress.classroom_id
    )
    AND
    EXISTS (
      SELECT 1 FROM public.student_classrooms sc
      WHERE sc.student_id = progress.student_id
      AND sc.classroom_id = progress.classroom_id
    )
  );

-- Teachers can update progress they created
CREATE POLICY "Teachers update classroom progress" ON public.progress
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.classroom_teachers ct
      WHERE ct.teacher_id = auth.uid() 
      AND ct.classroom_id = progress.classroom_id
    )
  );

-- 4. RLS policies for student_classrooms table

-- Students can view their own classroom assignments
CREATE POLICY "Students view own classrooms" ON public.student_classrooms
  FOR SELECT TO authenticated
  USING (student_id = auth.uid());

-- Teachers can view student assignments in their classrooms
CREATE POLICY "Teachers view classroom students" ON public.student_classrooms
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.classroom_teachers ct
      WHERE ct.teacher_id = auth.uid() 
      AND ct.classroom_id = student_classrooms.classroom_id
    )
  );

-- Teachers can assign students to their classrooms
CREATE POLICY "Teachers assign students to classrooms" ON public.student_classrooms
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.classroom_teachers ct
      WHERE ct.teacher_id = auth.uid() 
      AND ct.classroom_id = student_classrooms.classroom_id
    )
  );

-- Head teachers can view and manage all classroom assignments in their school
CREATE POLICY "Head teachers manage school classroom assignments" ON public.student_classrooms
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.classrooms c ON c.school_id = p.school_id
      WHERE p.id = auth.uid() 
      AND p.role = 'head_teacher'
      AND c.id = student_classrooms.classroom_id
    )
  );

-- 5. RLS policies for classrooms table

-- Drop existing classroom policies
DROP POLICY IF EXISTS "Users can view classrooms in their school" ON public.classrooms;

-- All authenticated users can view classrooms in their school
CREATE POLICY "Users view school classrooms" ON public.classrooms
  FOR SELECT TO authenticated
  USING (
    school_id = (
      SELECT p.school_id FROM public.profiles p WHERE p.id = auth.uid()
    )
  );

-- Only head teachers can create classrooms
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

-- 6. RLS policies for classroom_teachers table

-- Drop existing policies
DROP POLICY IF EXISTS "Teachers can view their classroom assignments" ON public.classroom_teachers;
DROP POLICY IF EXISTS "Head teachers can view classroom assignments in their school" ON public.classroom_teachers;
DROP POLICY IF EXISTS "Head teachers can assign teachers to classrooms" ON public.classroom_teachers;

-- Teachers can view their own assignments
CREATE POLICY "Teachers view own assignments" ON public.classroom_teachers
  FOR SELECT TO authenticated
  USING (teacher_id = auth.uid());

-- Head teachers can view all assignments in their school
CREATE POLICY "Head teachers view school assignments" ON public.classroom_teachers
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.classrooms c ON c.school_id = p.school_id
      WHERE p.id = auth.uid() 
      AND p.role = 'head_teacher'
      AND c.id = classroom_teachers.classroom_id
    )
  );

-- Only head teachers can assign teachers to classrooms
CREATE POLICY "Head teachers assign teachers" ON public.classroom_teachers
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.classrooms c ON c.school_id = p.school_id
      WHERE p.id = auth.uid() 
      AND p.role = 'head_teacher'
      AND c.id = classroom_teachers.classroom_id
    )
  );

-- Test the setup
SELECT 'Database structure and RLS policies updated successfully' as status;
