
-- Create table for real-time energy monitoring
CREATE TABLE public.energy_readings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_name TEXT NOT NULL,
  voltage NUMERIC(8,2),
  current NUMERIC(8,3),
  power NUMERIC(8,2),
  energy NUMERIC(10,3),
  frequency NUMERIC(5,2),
  power_factor NUMERIC(4,3),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.energy_readings ENABLE ROW LEVEL SECURITY;

-- Create policy for public access
CREATE POLICY "Allow public access" ON public.energy_readings FOR ALL USING (true);

-- Enable realtime
ALTER TABLE public.energy_readings REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.energy_readings;

-- Create function to calculate daily energy consumption
CREATE OR REPLACE FUNCTION get_daily_energy_consumption()
RETURNS TABLE (
  device_name TEXT,
  total_energy NUMERIC,
  avg_power NUMERIC,
  peak_power NUMERIC,
  runtime_hours NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    er.device_name,
    MAX(er.energy) - MIN(er.energy) as total_energy,
    AVG(er.power) as avg_power,
    MAX(er.power) as peak_power,
    EXTRACT(EPOCH FROM (MAX(er.created_at) - MIN(er.created_at))) / 3600 as runtime_hours
  FROM public.energy_readings er
  WHERE er.created_at >= CURRENT_DATE
  GROUP BY er.device_name;
END;
$$ LANGUAGE plpgsql;
