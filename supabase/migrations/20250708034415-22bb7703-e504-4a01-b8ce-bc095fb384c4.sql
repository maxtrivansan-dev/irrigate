
-- Create sensor_readings table to store all sensor data
CREATE TABLE public.sensor_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  temperature DECIMAL(5,2),
  humidity DECIMAL(5,2),
  soil_moisture DECIMAL(5,2),
  water_tank_level DECIMAL(5,2),
  vitamin_tank_level DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create device_control table for managing device states
CREATE TABLE public.device_control (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  auto_mode BOOLEAN DEFAULT TRUE,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create thresholds table for system configuration
CREATE TABLE public.thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  max_temperature DECIMAL(5,2) DEFAULT 30.0,
  min_soil_moisture DECIMAL(5,2) DEFAULT 25.0,
  low_water_level DECIMAL(5,2) DEFAULT 20.0,
  low_vitamin_level DECIMAL(5,2) DEFAULT 15.0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create irrigation_schedule table
CREATE TABLE public.irrigation_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled BOOLEAN DEFAULT TRUE,
  morning_time TIME DEFAULT '08:00',
  evening_time TIME DEFAULT '18:00',
  weekend_mode BOOLEAN DEFAULT TRUE,
  tank_rotation BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create irrigation_logs table to track watering activities
CREATE TABLE public.irrigation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tank_type TEXT CHECK (tank_type IN ('water', 'vitamin')),
  duration_seconds INTEGER,
  trigger_reason TEXT,
  soil_moisture_before DECIMAL(5,2),
  soil_moisture_after DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create energy_logs table for energy monitoring
CREATE TABLE public.energy_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_name TEXT NOT NULL,
  duration_seconds INTEGER,
  estimated_power_watts DECIMAL(8,2),
  estimated_energy_kwh DECIMAL(10,4),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial device control records
INSERT INTO public.device_control (device_name, is_active, auto_mode) VALUES
('pump', FALSE, TRUE),
('fan', FALSE, TRUE),
('water_valve', FALSE, TRUE),
('vitamin_valve', FALSE, TRUE);

-- Insert initial thresholds
INSERT INTO public.thresholds (max_temperature, min_soil_moisture, low_water_level, low_vitamin_level) VALUES
(30.0, 25.0, 20.0, 15.0);

-- Insert initial irrigation schedule
INSERT INTO public.irrigation_schedule (enabled, morning_time, evening_time, weekend_mode, tank_rotation) VALUES
(TRUE, '08:00', '18:00', TRUE, TRUE);

-- Enable Row Level Security (make tables public for now since no authentication)
ALTER TABLE public.sensor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_control ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.irrigation_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.irrigation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.energy_logs ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public access (since no auth required for this system)
CREATE POLICY "Allow public access" ON public.sensor_readings FOR ALL USING (true);
CREATE POLICY "Allow public access" ON public.device_control FOR ALL USING (true);
CREATE POLICY "Allow public access" ON public.thresholds FOR ALL USING (true);
CREATE POLICY "Allow public access" ON public.irrigation_schedule FOR ALL USING (true);
CREATE POLICY "Allow public access" ON public.irrigation_logs FOR ALL USING (true);
CREATE POLICY "Allow public access" ON public.energy_logs FOR ALL USING (true);

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.sensor_readings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.device_control;
ALTER PUBLICATION supabase_realtime ADD TABLE public.thresholds;
ALTER PUBLICATION supabase_realtime ADD TABLE public.irrigation_schedule;
ALTER PUBLICATION supabase_realtime ADD TABLE public.irrigation_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.energy_logs;
