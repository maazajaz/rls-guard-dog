-- Add sample progress reports for testing (run after creating basic data)
-- This creates progress reports for the current teacher's students

-- Create progress reports for students in your classrooms
WITH teacher_classrooms AS (
  SELECT c.id as classroom_id, c.name as classroom_name
  FROM public.classrooms c
  JOIN public.classroom_teachers ct ON c.id = ct.classroom_id
  WHERE ct.teacher_id = auth.uid()
),
school_students AS (
  SELECT p.id as student_id, p.full_name
  FROM public.profiles p
  WHERE p.role = 'student' 
  AND p.school_id = (SELECT school_id FROM public.profiles WHERE id = auth.uid())
  LIMIT 3
)
INSERT INTO public.progress (student_id, classroom_id, report_date, grade, feedback)
SELECT 
  s.student_id,
  tc.classroom_id,
  CURRENT_DATE - (ROW_NUMBER() OVER ())::integer,
  75 + (RANDOM() * 25)::integer, -- Random grade between 75-100
  CASE 
    WHEN tc.classroom_name LIKE '%Math%' THEN 'Good work on algebra. Keep practicing problem-solving techniques.'
    WHEN tc.classroom_name LIKE '%Science%' THEN 'Shows understanding of scientific principles. Excellent lab participation.'
    WHEN tc.classroom_name LIKE '%English%' THEN 'Well-written essays. Continue developing analytical skills.'
    ELSE 'Making good progress. Keep up the excellent work!'
  END
FROM school_students s
CROSS JOIN teacher_classrooms tc
ON CONFLICT DO NOTHING;

-- Show summary of what was created
SELECT 
  'Progress Reports Created' as summary,
  COUNT(*) as total_reports,
  COUNT(DISTINCT student_id) as unique_students,
  COUNT(DISTINCT classroom_id) as unique_classrooms,
  ROUND(AVG(grade)) as average_grade
FROM public.progress 
WHERE classroom_id IN (
  SELECT c.id 
  FROM public.classrooms c
  JOIN public.classroom_teachers ct ON c.id = ct.classroom_id
  WHERE ct.teacher_id = auth.uid()
);
