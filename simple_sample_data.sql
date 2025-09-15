-- Simple sample data creation script that works with current user
-- Run this in your Supabase SQL editor

-- First, let's create some basic data using the current user's school_id
INSERT INTO public.classrooms (name, school_id) 
SELECT 'Mathematics 101', p.school_id FROM public.profiles p WHERE p.id = auth.uid()
ON CONFLICT DO NOTHING;

INSERT INTO public.classrooms (name, school_id) 
SELECT 'Science Lab', p.school_id FROM public.profiles p WHERE p.id = auth.uid()
ON CONFLICT DO NOTHING;

INSERT INTO public.classrooms (name, school_id) 
SELECT 'English Literature', p.school_id FROM public.profiles p WHERE p.id = auth.uid()
ON CONFLICT DO NOTHING;

-- If you are a teacher, assign yourself to the classrooms
INSERT INTO public.classroom_teachers (classroom_id, teacher_id)
SELECT c.id, auth.uid()
FROM public.classrooms c
JOIN public.profiles p ON p.school_id = c.school_id
WHERE p.id = auth.uid() AND p.role IN ('teacher', 'head_teacher')
ON CONFLICT DO NOTHING;

-- Create some sample students in your school
INSERT INTO public.profiles (id, full_name, role, school_id)
SELECT 
    gen_random_uuid(),
    student_name,
    'student',
    p.school_id
FROM public.profiles p,
     (VALUES 
        ('Alice Johnson'),
        ('Bob Smith'), 
        ('Charlie Brown'),
        ('Diana Prince'),
        ('Ethan Hunt')
     ) AS students(student_name)
WHERE p.id = auth.uid()
ON CONFLICT DO NOTHING;

-- Create sample teachers if you're a head teacher
INSERT INTO public.profiles (id, full_name, role, school_id)
SELECT 
    gen_random_uuid(),
    teacher_name,
    'teacher',
    p.school_id
FROM public.profiles p,
     (VALUES 
        ('Dr. Sarah Wilson'),
        ('Mr. John Davis')
     ) AS teachers(teacher_name)
WHERE p.id = auth.uid() AND p.role = 'head_teacher'
ON CONFLICT DO NOTHING;

-- Show what was created
SELECT 
    'Data Summary:' as info,
    (SELECT COUNT(*) FROM public.classrooms c JOIN public.profiles p ON c.school_id = p.school_id WHERE p.id = auth.uid()) as classrooms,
    (SELECT COUNT(*) FROM public.profiles WHERE school_id = (SELECT school_id FROM public.profiles WHERE id = auth.uid()) AND role = 'student') as students,
    (SELECT COUNT(*) FROM public.profiles WHERE school_id = (SELECT school_id FROM public.profiles WHERE id = auth.uid()) AND role = 'teacher') as teachers;
