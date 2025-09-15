-- Check and fix user school assignments
-- Run this in your Supabase SQL editor

-- First, let's see what users we have and their school assignments
SELECT 'Current user data:' as info;
SELECT 
  p.id,
  p.full_name,
  p.role,
  p.school_id,
  s.name as school_name
FROM public.profiles p
LEFT JOIN public.schools s ON p.school_id = s.id
ORDER BY p.role, p.full_name;

-- Check if we have schools
SELECT 'Available schools:' as info;
SELECT id, name FROM public.schools ORDER BY name;

-- If you need to assign existing users to schools, uncomment and run the following:
-- (Replace the UUIDs with actual user IDs and school IDs from above)

-- Example: Assign specific users to a school
-- UPDATE public.profiles 
-- SET school_id = '2d760439-19b7-4bb8-bfd6-f50b58f6f869'  -- Replace with actual school_id
-- WHERE id = 'f367ddee-12a5-4bb5-a653-b6f37c829b92';    -- Replace with actual user_id

-- Or assign all users without school_id to a default school:
-- UPDATE public.profiles 
-- SET school_id = '2d760439-19b7-4bb8-bfd6-f50b58f6f869'  -- Replace with actual school_id
-- WHERE school_id IS NULL;

-- After assignment, check the results:
SELECT 'Updated user data:' as info;
SELECT 
  p.id,
  p.full_name,
  p.role,
  p.school_id,
  s.name as school_name
FROM public.profiles p
LEFT JOIN public.schools s ON p.school_id = s.id
ORDER BY p.role, p.full_name;

-- Check specifically for teachers in the same school as the current user
SELECT 'Teachers in your school:' as info;
SELECT 
  p.id,
  p.full_name,
  p.role,
  s.name as school_name
FROM public.profiles p
JOIN public.schools s ON p.school_id = s.id
WHERE p.role = 'teacher' 
  AND p.school_id = (
    SELECT school_id FROM public.profiles WHERE id = auth.uid()
  )
ORDER BY p.full_name;
