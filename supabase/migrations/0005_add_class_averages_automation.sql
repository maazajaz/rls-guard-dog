-- Migration to add automatic class averages calculation
-- This trigger will call the Edge Function when progress data changes

-- Create a function to call the Edge Function
CREATE OR REPLACE FUNCTION trigger_class_averages_calculation()
RETURNS TRIGGER AS $$
BEGIN
  -- Use pg_net to call the Edge Function asynchronously
  -- This prevents blocking the main transaction
  PERFORM
    net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/calculate-class-averages',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := '{}'::jsonb
    );
  
  -- Always return the row for INSERT/UPDATE triggers
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on progress table for INSERT/UPDATE/DELETE
DROP TRIGGER IF EXISTS trigger_calculate_class_averages ON progress;
CREATE TRIGGER trigger_calculate_class_averages
  AFTER INSERT OR UPDATE OR DELETE ON progress
  FOR EACH ROW
  EXECUTE FUNCTION trigger_class_averages_calculation();

-- Create a manual function to calculate class averages on demand
CREATE OR REPLACE FUNCTION calculate_class_averages_manual()
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  -- Call the Edge Function and return the result
  SELECT content::json INTO result
  FROM net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/calculate-class-averages',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{}'::jsonb
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a scheduled job (if pg_cron is available)
-- This will run the calculation every day at 2 AM
-- Uncomment the following lines if you have pg_cron enabled:

/*
SELECT cron.schedule(
  'daily-class-averages',
  '0 2 * * *', -- Run at 2 AM every day
  $$SELECT calculate_class_averages_manual();$$
);
*/

-- Grant necessary permissions
GRANT USAGE ON SCHEMA net TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_class_averages_calculation() TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_class_averages_manual() TO authenticated;

-- Create settings table for configuration (if it doesn't exist)
CREATE TABLE IF NOT EXISTS app_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on app_settings
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for app_settings (only service role can access)
CREATE POLICY "Service role can manage app settings" ON app_settings
  FOR ALL USING (auth.role() = 'service_role');

-- Insert default settings (update these with your actual values)
INSERT INTO app_settings (key, value) VALUES
  ('supabase_url', 'https://your-project-ref.supabase.co')
ON CONFLICT (key) DO NOTHING;

INSERT INTO app_settings (key, value) VALUES
  ('service_role_key', 'your-service-role-key-here')
ON CONFLICT (key) DO NOTHING;