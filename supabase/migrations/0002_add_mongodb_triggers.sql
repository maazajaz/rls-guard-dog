-- Create a database function that triggers the Edge Function
-- Run this in your Supabase SQL editor

-- First, create a function that will call our Edge Function
CREATE OR REPLACE FUNCTION public.trigger_class_average_calculation()
RETURNS TRIGGER AS $$
BEGIN
  -- Call the Edge Function asynchronously
  PERFORM
    net.http_post(
      url := 'https://your-project-ref.supabase.co/functions/v1/calculate-class-averages',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || 'your-service-role-key'
      ),
      body := jsonb_build_object(
        'classroom_id', COALESCE(NEW.classroom_id, OLD.classroom_id),
        'trigger_type', TG_OP
      )
    );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for INSERT, UPDATE, and DELETE on progress table
DROP TRIGGER IF EXISTS trigger_progress_insert ON public.progress;
DROP TRIGGER IF EXISTS trigger_progress_update ON public.progress;
DROP TRIGGER IF EXISTS trigger_progress_delete ON public.progress;

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
