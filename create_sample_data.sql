-- Create sample data for testing the RLS Guard Dog application
-- Run this in your Supabase SQL editor after setting up the basic schema

-- First, let's get the current user's school_id to use for sample data
DO $$
DECLARE
    current_user_id uuid;
    current_school_id uuid;
    math_classroom_id uuid;
    science_classroom_id uuid;
    english_classroom_id uuid;
    student1_id uuid;
    student2_id uuid;
    student3_id uuid;
    teacher1_id uuid;
    teacher2_id uuid;
BEGIN
    -- Get current authenticated user
    current_user_id := auth.uid();
    
    -- Get their school_id
    SELECT school_id INTO current_school_id 
    FROM public.profiles 
    WHERE id = current_user_id;
    
    -- Only proceed if we found a school_id
    IF current_school_id IS NOT NULL THEN
        
        -- Create sample classrooms in the current user's school
        INSERT INTO public.classrooms (id, name, school_id) VALUES
            (gen_random_uuid(), 'Mathematics 101', current_school_id),
            (gen_random_uuid(), 'Science Lab', current_school_id),
            (gen_random_uuid(), 'English Literature', current_school_id)
        RETURNING id INTO math_classroom_id;
        
        -- Get the classroom IDs we just created
        SELECT id INTO math_classroom_id FROM public.classrooms WHERE name = 'Mathematics 101' AND school_id = current_school_id;
        SELECT id INTO science_classroom_id FROM public.classrooms WHERE name = 'Science Lab' AND school_id = current_school_id;
        SELECT id INTO english_classroom_id FROM public.classrooms WHERE name = 'English Literature' AND school_id = current_school_id;
        
        -- Create sample student profiles
        INSERT INTO public.profiles (id, full_name, role, school_id) VALUES
            (gen_random_uuid(), 'Alice Johnson', 'student', current_school_id),
            (gen_random_uuid(), 'Bob Smith', 'student', current_school_id),
            (gen_random_uuid(), 'Charlie Brown', 'student', current_school_id)
        ON CONFLICT (id) DO NOTHING;
        
        -- Get student IDs
        SELECT id INTO student1_id FROM public.profiles WHERE full_name = 'Alice Johnson' AND school_id = current_school_id;
        SELECT id INTO student2_id FROM public.profiles WHERE full_name = 'Bob Smith' AND school_id = current_school_id;
        SELECT id INTO student3_id FROM public.profiles WHERE full_name = 'Charlie Brown' AND school_id = current_school_id;
        
        -- Create sample teacher profiles
        INSERT INTO public.profiles (id, full_name, role, school_id) VALUES
            (gen_random_uuid(), 'Dr. Sarah Wilson', 'teacher', current_school_id),
            (gen_random_uuid(), 'Mr. John Davis', 'teacher', current_school_id)
        ON CONFLICT (id) DO NOTHING;
        
        -- Get teacher IDs
        SELECT id INTO teacher1_id FROM public.profiles WHERE full_name = 'Dr. Sarah Wilson' AND school_id = current_school_id;
        SELECT id INTO teacher2_id FROM public.profiles WHERE full_name = 'Mr. John Davis' AND school_id = current_school_id;
        
        -- Assign teachers to classrooms
        INSERT INTO public.classroom_teachers (classroom_id, teacher_id) VALUES
            (math_classroom_id, teacher1_id),
            (science_classroom_id, teacher1_id),
            (english_classroom_id, teacher2_id)
        ON CONFLICT (classroom_id, teacher_id) DO NOTHING;
        
        -- Create sample progress reports
        INSERT INTO public.progress (student_id, classroom_id, report_date, grade, feedback) VALUES
            -- Alice's progress
            (student1_id, math_classroom_id, CURRENT_DATE - INTERVAL '1 day', 92, 'Excellent work on algebra problems. Shows strong understanding of quadratic equations.'),
            (student1_id, science_classroom_id, CURRENT_DATE - INTERVAL '2 days', 88, 'Good lab report on chemical reactions. Needs to improve hypothesis writing.'),
            (student1_id, english_classroom_id, CURRENT_DATE - INTERVAL '3 days', 95, 'Outstanding essay on Shakespeare. Creative analysis and strong writing skills.'),
            
            -- Bob's progress
            (student2_id, math_classroom_id, CURRENT_DATE - INTERVAL '1 day', 78, 'Making steady progress. Needs extra practice with geometry concepts.'),
            (student2_id, science_classroom_id, CURRENT_DATE - INTERVAL '2 days', 82, 'Good understanding of basic principles. Participation in class discussions is improving.'),
            (student2_id, english_classroom_id, CURRENT_DATE - INTERVAL '4 days', 85, 'Well-structured essays. Continue working on vocabulary expansion.'),
            
            -- Charlie's progress
            (student3_id, math_classroom_id, CURRENT_DATE - INTERVAL '5 days', 67, 'Struggling with advanced concepts. Recommend additional tutoring sessions.'),
            (student3_id, science_classroom_id, CURRENT_DATE - INTERVAL '1 week', 75, 'Shows improvement in lab work. Keep practicing scientific method steps.'),
            (student3_id, english_classroom_id, CURRENT_DATE - INTERVAL '6 days', 72, 'Creative ideas but needs help with grammar and structure. Consider peer editing.'),
            
            -- Additional recent reports
            (student1_id, math_classroom_id, CURRENT_DATE, 94, 'Exceptional performance on the midterm exam. Ready for advanced topics.'),
            (student2_id, science_classroom_id, CURRENT_DATE, 80, 'Lab safety procedures followed perfectly. Good teamwork skills.'),
            (student3_id, english_classroom_id, CURRENT_DATE, 76, 'Noticeable improvement in writing quality. Keep up the good work!')
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Sample data created successfully for school: %', current_school_id;
        RAISE NOTICE 'Created % classrooms, % students, % teachers, and % progress reports', 
            (SELECT COUNT(*) FROM public.classrooms WHERE school_id = current_school_id),
            (SELECT COUNT(*) FROM public.profiles WHERE school_id = current_school_id AND role = 'student'),
            (SELECT COUNT(*) FROM public.profiles WHERE school_id = current_school_id AND role = 'teacher'),
            (SELECT COUNT(*) FROM public.progress WHERE classroom_id IN (SELECT id FROM public.classrooms WHERE school_id = current_school_id));
            
    ELSE
        RAISE NOTICE 'Could not find school_id for current user. Please ensure you are logged in and have a profile.';
    END IF;
END $$;
