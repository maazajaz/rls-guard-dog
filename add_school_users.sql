-- Add teachers to your school so you can assign them to classrooms
-- Run this in your Supabase SQL editor

-- First, let's see your current school info
SELECT 
  'Your current info:' as step,
  p.id as your_user_id,
  p.full_name,
  p.role,
  p.school_id,
  s.name as school_name
FROM public.profiles p
LEFT JOIN public.schools s ON p.school_id = s.id
WHERE p.id = auth.uid();

-- Add some teachers to YOUR school (same school_id as you)
INSERT INTO public.profiles (id, full_name, role, school_id)
SELECT 
    gen_random_uuid(),
    teacher_data.name,
    'teacher',
    p.school_id
FROM public.profiles p,
     (VALUES 
        ('Dr. Sarah Wilson'),
        ('Mr. John Davis'),
        ('Ms. Emily Rodriguez'),
        ('Prof. Michael Chen'),
        ('Mrs. Lisa Thompson')
     ) AS teacher_data(name)
WHERE p.id = auth.uid()
ON CONFLICT DO NOTHING;

-- Add some students to YOUR school as well
INSERT INTO public.profiles (id, full_name, role, school_id)
SELECT 
    gen_random_uuid(),
    student_data.name,
    'student',
    p.school_id
FROM public.profiles p,
     (VALUES 
        ('Alice Johnson'),
        ('Bob Smith'),
        ('Charlie Brown'),
        ('Diana Prince'),
        ('Ethan Hunt'),
        ('Fiona Green'),
        ('George Wilson'),
        ('Hannah Davis')
     ) AS student_data(name)
WHERE p.id = auth.uid()
ON CONFLICT DO NOTHING;

-- Show what was created in your school
SELECT 
  'Summary of your school:' as summary,
  COUNT(CASE WHEN p.role = 'student' THEN 1 END) as students,
  COUNT(CASE WHEN p.role = 'teacher' THEN 1 END) as teachers,
  COUNT(CASE WHEN p.role = 'head_teacher' THEN 1 END) as head_teachers,
  p.school_id
FROM public.profiles p
WHERE p.school_id = (SELECT school_id FROM public.profiles WHERE id = auth.uid())
GROUP BY p.school_id;

-- List all teachers in your school (these should now appear in the dropdown)
SELECT 
  'Teachers in your school:' as info,
  p.id,
  p.full_name,
  p.role
FROM public.profiles p
WHERE p.school_id = (SELECT school_id FROM public.profiles WHERE id = auth.uid())
AND p.role = 'teacher'
ORDER BY p.full_name;
