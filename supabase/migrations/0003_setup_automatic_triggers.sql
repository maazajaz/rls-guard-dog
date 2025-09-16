-- Setup automatic triggers for class average calculation
-- This will automatically call the Edge Function when progress data changes

-- First, enable the pg_net extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a function that will call our Edge Function
CREATE OR REPLACE FUNCTION public.trigger_class_average_calculation()
RETURNS TRIGGER AS $$
BEGIN
  -- Call the Edge Function asynchronously
  PERFORM
    net.http_post(
      url := 'https://qfsadbwvdjexsbcyiwxt.supabase.co/functions/v1/calculate-class-averages',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmc2FkYnd2ZGpleHNiY3lpd3h0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzk1ODU4MywiZXhwIjoyMDczNTM0NTgzfQ.BU1sYnCD7Y5-e3fCOCunprssMv3uYxOrfN6B-CNFXEM'
      ),
      body := jsonb_build_object(
        'classroom_id', COALESCE(NEW.classroom_id, OLD.classroom_id),
        'trigger_type', TG_OP,
        'triggered_at', NOW()
      )
    );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_progress_insert ON public.progress;
DROP TRIGGER IF EXISTS trigger_progress_update ON public.progress;
DROP TRIGGER IF EXISTS trigger_progress_delete ON public.progress;

-- Create triggers for INSERT, UPDATE, and DELETE on progress table
CREATE TRIGGER trigger_progress_insert
  AFTER INSERT ON public.progress
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_class_average_calculation();

CREATE TRIGGER trigger_progress_update
  AFTER UPDATE ON public.progress
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_class_average_calculation();

CREATE TRIGGER trigger_progress_delete
  AFTER DELETE ON public.progress
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_class_average_calculation();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.trigger_class_average_calculation() TO authenticated;
GRANT EXECUTE ON FUNCTION public.trigger_class_average_calculation() TO service_role;
GRANT EXECUTE ON FUNCTION public.trigger_class_average_calculation() TO anon;

-- Also grant usage on the net schema for HTTP requests
GRANT USAGE ON SCHEMA net TO authenticated;
GRANT USAGE ON SCHEMA net TO service_role;
GRANT USAGE ON SCHEMA net TO anon;
