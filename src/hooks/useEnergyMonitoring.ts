import { useEffect, useState } from 'react'
import { supabase } from "@/integrations/supabase/client"
import type { Tables } from "@/integrations/supabase/types"

interface EnergyData {
  voltage: number
  current: number
  power: number
  energy: number
  frequency: number
  powerFactor: number
}

interface DailyEnergyConsumption {
  device_name: string
  total_energy: number
  avg_power: number
  peak_power: number
  runtime_hours: number
}

export const useEnergyMonitoring = () => {
  const [latestReading, setLatestReading] = useState<Tables<"energy_readings"> | null>(null)
  const [dailyConsumption, setDailyConsumption] = useState<DailyEnergyConsumption[]>([])
  const [recentReadings, setRecentReadings] = useState<Tables<"energy_readings">[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Get latest energy reading
        const { data: latestData, error: latestError } = await supabase
          .from('energy_readings')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (latestError && latestError.code !== 'PGRST116') {
          throw latestError
        }

        if (latestData) {
          setLatestReading(latestData)
        }

        // Get recent readings for charts (last 24 hours)
        const twentyFourHoursAgo = new Date()
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

        const { data: recentData, error: recentError } = await supabase
          .from('energy_readings')
          .select('*')
          .gte('created_at', twentyFourHoursAgo.toISOString())
          .order('created_at', { ascending: true })

        if (recentError) {
          throw recentError
        }

        if (recentData) {
          setRecentReadings(recentData)
        }

        // Get daily consumption using the database function
        const { data: consumptionData, error: consumptionError } = await supabase
          .rpc('get_daily_energy_consumption')

        if (consumptionError) {
          console.warn('Error fetching daily consumption:', consumptionError)
        } else if (consumptionData) {
          setDailyConsumption(consumptionData)
        }

      } catch (error) {
        console.error('Error fetching energy data:', error)
        setError('Failed to fetch energy data')
      } finally {
        setLoading(false)
      }
    }

    fetchInitialData()
  }, [])

  // Set up real-time subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('energy-readings-changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'energy_readings' },
        (payload) => {
          console.log('New energy reading received:', payload.new)
          const newReading = payload.new as Tables<"energy_readings">
          setLatestReading(newReading)
          
          // Add to recent readings and keep only last 100 points
          setRecentReadings(prev => {
            const updated = [...prev, newReading].slice(-100)
            return updated
          })
        }
      )
      .subscribe()

    return () => {
      console.log('Cleaning up energy monitoring subscription')
      supabase.removeChannel(channel)
    }
  }, [])

  // Calculate derived values
  const currentEnergyData: EnergyData = {
    voltage: latestReading?.voltage ? Number(latestReading.voltage) : 0,
    current: latestReading?.current ? Number(latestReading.current) : 0,
    power: latestReading?.power ? Number(latestReading.power) : 0,
    energy: latestReading?.energy ? Number(latestReading.energy) : 0,
    frequency: latestReading?.frequency ? Number(latestReading.frequency) : 0,
    powerFactor: latestReading?.power_factor ? Number(latestReading.power_factor) : 0,
  }

  const totalDailyEnergy = dailyConsumption.reduce((sum, device) => sum + Number(device.total_energy || 0), 0)
  const averagePower = dailyConsumption.reduce((sum, device) => sum + Number(device.avg_power || 0), 0) / Math.max(dailyConsumption.length, 1)
  const peakPower = Math.max(...dailyConsumption.map(device => Number(device.peak_power || 0)), 0)

  return {
    latestReading,
    recentReadings,
    dailyConsumption,
    currentEnergyData,
    totalDailyEnergy,
    averagePower,
    peakPower,
    loading,
    error
  }
}
