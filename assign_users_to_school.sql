-- Quick fix: Assign existing users to the same school
-- Based on your screenshot, it looks like all users have the same school_id: 2d760439-19b7-4bb8-bfd6-f50b58f6f869

-- Step 1: First check current state
SELECT 
  'Current users and their schools:' as status,
  p.full_name,
  p.role,
  CASE 
    WHEN p.school_id IS NOT NULL THEN 'Has school assigned'
    ELSE 'NO SCHOOL ASSIGNED'
  END as school_status,
  s.name as school_name
FROM public.profiles p
LEFT JOIN public.schools s ON p.school_id = s.id
ORDER BY p.role;

-- Step 2: If any users don't have school_id, assign them to the main school
-- (This will make teachers available for classroom assignment)
UPDATE public.profiles 
SET school_id = '2d760439-19b7-4bb8-bfd6-f50b58f6f869'
WHERE school_id IS NULL;

-- Step 3: Verify the fix
SELECT 
  'After fix - Teachers available for assignment:' as status,
  COUNT(*) as teacher_count
FROM public.profiles 
WHERE role = 'teacher' 
  AND school_id = '2d760439-19b7-4bb8-bfd6-f50b58f6f869';

-- Step 4: Show all teachers now available
SELECT 
  'Available teachers:' as info,
  full_name,
  role
FROM public.profiles 
WHERE role = 'teacher' 
  AND school_id = '2d760439-19b7-4bb8-bfd6-f50b58f6f869'
ORDER BY full_name;
