-- TransFitness: Setup pg_cron for scheduled push notifications
-- Run this in Supabase SQL Editor after deploying the Edge Function

-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage to postgres user
GRANT USAGE ON SCHEMA cron TO postgres;

-- Schedule workout reminder at 9:00 AM UTC daily
-- Adjust the time based on your user base timezone
SELECT cron.schedule(
  'daily-workout-reminder',
  '0 9 * * *',  -- 9:00 AM UTC every day
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/send-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{"type": "workout_reminder"}'::jsonb
  );
  $$
);

-- Schedule streak reminder at 8:00 PM UTC daily
-- This reminds users who haven't worked out today
SELECT cron.schedule(
  'evening-streak-reminder',
  '0 20 * * *',  -- 8:00 PM UTC every day
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/send-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{"type": "streak_reminder"}'::jsonb
  );
  $$
);

-- View scheduled jobs
-- SELECT * FROM cron.job;

-- To unschedule a job:
-- SELECT cron.unschedule('daily-workout-reminder');
-- SELECT cron.unschedule('evening-streak-reminder');

-- Alternative: Using pg_cron with supabase edge function invoke
-- This requires the pg_net extension which is available on Supabase

-- Enable pg_net if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a function to invoke the edge function
CREATE OR REPLACE FUNCTION invoke_push_notifications(notification_type TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  project_url TEXT;
  service_key TEXT;
BEGIN
  -- Get values from Supabase vault or app settings
  -- You'll need to set these in Supabase Dashboard > Project Settings > Database > App Settings
  project_url := current_setting('app.settings.supabase_url', true);
  service_key := current_setting('app.settings.service_role_key', true);

  IF project_url IS NULL OR service_key IS NULL THEN
    RAISE EXCEPTION 'Missing app settings for push notifications';
  END IF;

  PERFORM net.http_post(
    url := project_url || '/functions/v1/send-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    ),
    body := jsonb_build_object('type', notification_type)
  );
END;
$$;

-- Note: Before running the cron jobs, you need to set app settings in Supabase:
-- 1. Go to Supabase Dashboard > Project Settings > Database
-- 2. Scroll to "App Settings" section
-- 3. Add:
--    - app.settings.supabase_url = https://YOUR_PROJECT_REF.supabase.co
--    - app.settings.service_role_key = YOUR_SERVICE_ROLE_KEY
