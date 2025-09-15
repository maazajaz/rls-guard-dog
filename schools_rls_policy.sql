-- Allow public read access to schools table for signup form
-- This should be run in your Supabase SQL editor

-- Enable RLS on schools table
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read schools (needed for signup form)
CREATE POLICY "Anyone can view schools" ON public.schools
  FOR SELECT TO public
  USING (true);
