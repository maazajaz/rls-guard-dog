-- Debug and test classroom creation
-- Run this step by step in your Supabase SQL editor

-- 1. Check your current user and role
SELECT 
  'Step 1 - Your current info:' as step,
  auth.uid() as user_id,
  p.full_name,
  p.role,
  p.school_id,
  s.name as school_name
FROM public.profiles p
LEFT JOIN public.schools s ON p.school_id = s.id
WHERE p.id = auth.uid();

-- 2. Check if you can insert a classroom manually (this should work if you're a head teacher)
-- Replace 'Test Classroom' with any name you want
INSERT INTO public.classrooms (name, school_id)
SELECT 'Test Classroom Manual', p.school_id
FROM public.profiles p
WHERE p.id = auth.uid() AND p.role = 'head_teacher';

-- 3. Check if the classroom was created
SELECT 
  'Step 3 - Classrooms in your school:' as step,
  c.id,
  c.name,
  c.school_id
FROM public.classrooms c
JOIN public.profiles p ON c.school_id = p.school_id
WHERE p.id = auth.uid();

-- 4. If the above worked, the UI should work too. If not, we need to check your role.
SELECT 
  'Step 4 - Role verification:' as step,
  CASE 
    WHEN p.role = 'head_teacher' THEN 'You are a head teacher - should be able to create classrooms'
    WHEN p.role = 'teacher' THEN 'You are a teacher - cannot create classrooms, only head teachers can'
    WHEN p.role = 'student' THEN 'You are a student - cannot create classrooms'
    ELSE 'Unknown role: ' || p.role
  END as message
FROM public.profiles p
WHERE p.id = auth.uid();
