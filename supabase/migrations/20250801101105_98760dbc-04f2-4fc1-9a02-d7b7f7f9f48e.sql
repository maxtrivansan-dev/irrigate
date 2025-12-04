
-- Add light_level column to sensor_readings table if it doesn't exist
ALTER TABLE public.sensor_readings 
ADD COLUMN IF NOT EXISTS light_level numeric;

-- Update the thresholds table to include light level threshold if it doesn't exist
ALTER TABLE public.thresholds 
ADD COLUMN IF NOT EXISTS min_light_level numeric DEFAULT 300.0;
