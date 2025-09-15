-- Test data setup for the hierarchical education system
-- Run this after running fix_hierarchy_structure.sql

-- Step 1: Create some basic students in your school (if you're a head teacher)
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
        ('Charlie Brown')
     ) AS students(student_name)
WHERE p.id = auth.uid() AND p.role = 'head_teacher'
ON CONFLICT DO NOTHING;

-- Step 2: Create some teachers (if you're a head teacher)  
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

-- Show current state
SELECT 
    'Current School Data:' as info,
    (SELECT COUNT(*) FROM public.profiles WHERE school_id = (SELECT school_id FROM public.profiles WHERE id = auth.uid()) AND role = 'student') as students,
    (SELECT COUNT(*) FROM public.profiles WHERE school_id = (SELECT school_id FROM public.profiles WHERE id = auth.uid()) AND role = 'teacher') as teachers,
    (SELECT COUNT(*) FROM public.classrooms WHERE school_id = (SELECT school_id FROM public.profiles WHERE id = auth.uid())) as classrooms;

-- Show your role for context
SELECT 
    'Your Info:' as info,
    full_name,
    role
FROM public.profiles 
WHERE id = auth.uid();
