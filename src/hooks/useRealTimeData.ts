
import { useEffect, useState } from 'react'
import { supabase } from "@/integrations/supabase/client"
import type { Tables } from "@/integrations/supabase/types"

export const useRealTimeData = () => {
  const [sensorData, setSensorData] = useState<Tables<"sensor_readings"> | null>(null)
  const [devices, setDevices] = useState<Tables<"device_control">[]>([])
  const [thresholds, setThresholds] = useState<Tables<"thresholds"> | null>(null)
  const [schedule, setSchedule] = useState<Tables<"irrigation_schedule"> | null>(null)
  const [energyData, setEnergyData] = useState<Tables<"energy_readings"> | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  useEffect(() => {
    // Fetch initial data
    const fetchInitialData = async () => {
      try {
        setLoading(true)
        
        // Get latest sensor reading
        const { data: sensorReading } = await supabase
          .from('sensor_readings')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        
        if (sensorReading) {
          console.log('Latest sensor data:', sensorReading)
          setSensorData(sensorReading)
        }

        // Get latest energy reading
        const { data: energyReading } = await supabase
          .from('energy_readings')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        
        if (energyReading) {
          console.log('Latest energy data:', energyReading)
          setEnergyData(energyReading)
        }

        // Get device controls
        const { data: deviceData, error: deviceError } = await supabase
          .from('device_control')
          .select('*')
          .order('last_updated', { ascending: false })
        
        if (deviceError) {
          console.error('Error fetching devices:', deviceError)
        } else if (deviceData) {
          console.log('Device data:', deviceData)
          setDevices(deviceData)
        }

        // Get latest thresholds
        const { data: thresholdData } = await supabase
          .from('thresholds')
          .select('*')
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        
        if (thresholdData) {
          console.log('Threshold data:', thresholdData)
          setThresholds(thresholdData)
        }

        // Get latest schedule
        const { data: scheduleData } = await supabase
          .from('irrigation_schedule')
          .select('*')
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        
        if (scheduleData) {
          console.log('Schedule data:', scheduleData)
          setSchedule(scheduleData)
        }

        setLastUpdate(new Date())
      } catch (error) {
        console.error('Error fetching initial data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchInitialData()

    // Set up real-time subscriptions
    const sensorChannel = supabase
      .channel('sensor-changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'sensor_readings' },
        (payload) => {
          console.log('New sensor data received:', payload.new)
          setSensorData(payload.new as Tables<"sensor_readings">)
          setLastUpdate(new Date())
        }
      )
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'sensor_readings' },
        (payload) => {
          console.log('Updated sensor data received:', payload.new)
          setSensorData(payload.new as Tables<"sensor_readings">)
          setLastUpdate(new Date())
        }
      )
      .subscribe()

    const energyChannel = supabase
      .channel('energy-changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'energy_readings' },
        (payload) => {
          console.log('New energy data received:', payload.new)
          setEnergyData(payload.new as Tables<"energy_readings">)
          setLastUpdate(new Date())
        }
      )
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'energy_readings' },
        (payload) => {
          console.log('Updated energy data received:', payload.new)
          setEnergyData(payload.new as Tables<"energy_readings">)
          setLastUpdate(new Date())
        }
      )
      .subscribe()

    const deviceChannel = supabase
      .channel('device-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'device_control' },
        (payload) => {
          console.log('Device change received:', payload)
          // Refetch device data when changes occur to get latest
          supabase.from('device_control').select('*').order('last_updated', { ascending: false }).then(({ data, error }) => {
            if (error) {
              console.error('Error refetching devices:', error)
            } else if (data) {
              console.log('Updated device data:', data)
              setDevices(data)
              setLastUpdate(new Date())
            }
          })
        }
      )
      .subscribe()

    const thresholdChannel = supabase
      .channel('threshold-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'thresholds' },
        (payload) => {
          console.log('Threshold update received:', payload.new)
          setThresholds(payload.new as Tables<"thresholds">)
          setLastUpdate(new Date())
        }
      )
      .subscribe()

    const scheduleChannel = supabase
      .channel('schedule-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'irrigation_schedule' },
        (payload) => {
          console.log('Schedule update received:', payload.new)
          setSchedule(payload.new as Tables<"irrigation_schedule">)
          setLastUpdate(new Date())
        }
      )
      .subscribe()

    // Auto-refresh data every 30 seconds to ensure we have latest data
    const refreshInterval = setInterval(() => {
      console.log('Auto-refreshing data...')
      fetchInitialData()
    }, 30000)

    return () => {
      console.log('Cleaning up realtime subscriptions')
      clearInterval(refreshInterval)
      supabase.removeChannel(sensorChannel)
      supabase.removeChannel(energyChannel)
      supabase.removeChannel(deviceChannel)
      supabase.removeChannel(thresholdChannel)
      supabase.removeChannel(scheduleChannel)
    }
  }, [])

  return { 
    sensorData, 
    devices, 
    thresholds, 
    schedule, 
    energyData, 
    loading,
    lastUpdate 
  }
}
