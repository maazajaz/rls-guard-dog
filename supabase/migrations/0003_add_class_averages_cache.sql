-- Create a table to cache class averages calculated by the Edge Function
-- This table will be synced with MongoDB by our Next.js app

CREATE TABLE IF NOT EXISTS public.class_averages_cache (
  id uuid default gen_random_uuid() primary key,
  classroom_id uuid references public.classrooms(id) on delete cascade not null,
  classroom_name text not null,
  school_id uuid references public.schools(id) on delete cascade not null,
  average_grade decimal(5,2) not null,
  total_students integer not null default 0,
  total_reports integer not null default 0,
  excellent_count integer not null default 0,
  good_count integer not null default 0,
  satisfactory_count integer not null default 0,
  needs_improvement_count integer not null default 0,
  last_updated timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  UNIQUE(classroom_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_class_averages_cache_school_id ON public.class_averages_cache(school_id);
CREATE INDEX IF NOT EXISTS idx_class_averages_cache_classroom_id ON public.class_averages_cache(classroom_id);
CREATE INDEX IF NOT EXISTS idx_class_averages_cache_last_updated ON public.class_averages_cache(last_updated);

-- Enable RLS
ALTER TABLE public.class_averages_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Students can view averages for their classrooms
CREATE POLICY "Students can view classroom averages" ON public.class_averages_cache
  FOR SELECT TO authenticated
  USING (
    classroom_id IN (
      SELECT sc.classroom_id 
      FROM public.student_classrooms sc 
      WHERE sc.student_id = auth.uid()
    )
  );

-- Teachers can view averages for their assigned classrooms
CREATE POLICY "Teachers can view their classroom averages" ON public.class_averages_cache
  FOR SELECT TO authenticated
  USING (
    classroom_id IN (
      SELECT ct.classroom_id 
      FROM public.classroom_teachers ct 
      WHERE ct.teacher_id = auth.uid()
    )
  );

-- Head teachers can view all averages in their school
CREATE POLICY "Head teachers can view school averages" ON public.class_averages_cache
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'head_teacher'
      AND p.school_id = class_averages_cache.school_id
    )
  );

-- Only the service role can insert/update (for Edge Functions)
CREATE POLICY "Service role can manage averages" ON public.class_averages_cache
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_class_averages_cache_updated_at 
  BEFORE UPDATE ON public.class_averages_cache
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();
