
import { useEffect, useState } from 'react'
import { supabase } from "@/integrations/supabase/client"
import type { Tables } from "@/integrations/supabase/types"

interface HistoricalDataPoint {
  date: string
  time: string
  temperature: number
  humidity: number
  soilMoisture: number
  lightLevel: number
  waterUsage: number
  energyUsage: number
  waterTankLevel: number
  vitaminTankLevel: number
  flowRate: number
}

export const useHistoricalData = () => {
  const [dailyData, setDailyData] = useState<HistoricalDataPoint[]>([])
  const [weeklyData, setWeeklyData] = useState<HistoricalDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const processData = (sensorData: Tables<"sensor_readings">[], energyData: Tables<"energy_readings">[]): HistoricalDataPoint[] => {
    // Group energy data by date for easier lookup
    const energyByDate: Record<string, Tables<"energy_readings">[]> = {}
    energyData.forEach(reading => {
      const date = new Date(reading.created_at).toISOString().split('T')[0]
      if (!energyByDate[date]) energyByDate[date] = []
      energyByDate[date].push(reading)
    })

    return sensorData.map(reading => {
      const date = new Date(reading.created_at!)
      const dateStr = date.toISOString().split('T')[0]
      const dayEnergyData = energyByDate[dateStr] || []
      
      // Calculate average energy usage for the day
      const avgEnergyUsage = dayEnergyData.length > 0 
        ? dayEnergyData.reduce((sum, e) => sum + (Number(e.power) || 0), 0) / dayEnergyData.length / 1000 // Convert to kWh
        : 0

      return {
        date: dateStr,
        time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        temperature: Number(reading.temperature) || 0,
        humidity: Number(reading.humidity) || 0,
        soilMoisture: Number(reading.soil_moisture) || 0,
        lightLevel: Number(reading.light_level) || 0,
        waterUsage: Number(reading.flow_rate) || 0,
        energyUsage: avgEnergyUsage,
        waterTankLevel: Number(reading.water_tank_level) || 0,
        vitaminTankLevel: Number(reading.vitamin_tank_level) || 0,
        flowRate: Number(reading.flow_rate) || 0
      }
    })
  }

  const fetchHistoricalData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get sensor data for the last 30 days
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: sensorData, error: sensorError } = await supabase
        .from('sensor_readings')
        .select('*')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true })

      if (sensorError) throw sensorError

      // Get energy data for the same period
      const { data: energyData, error: energyError } = await supabase
        .from('energy_readings')
        .select('*')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true })

      if (energyError) throw energyError

      const processedData = processData(sensorData || [], energyData || [])
      
      // Split into daily (last 7 days) and weekly (last 30 days)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      
      const daily = processedData.filter(d => new Date(d.date) >= sevenDaysAgo)
      const weekly = processedData

      setDailyData(daily)
      setWeeklyData(weekly)

    } catch (error) {
      console.error('Error fetching historical data:', error)
      setError('Failed to fetch historical data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistoricalData()

    // Set up real-time subscriptions for new data
    const sensorChannel = supabase
      .channel('historical-sensor-changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'sensor_readings' },
        () => {
          console.log('New sensor data received, refreshing historical data')
          fetchHistoricalData()
        }
      )
      .subscribe()

    const energyChannel = supabase
      .channel('historical-energy-changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'energy_readings' },
        () => {
          console.log('New energy data received, refreshing historical data')
          fetchHistoricalData()
        }
      )
      .subscribe()

    // Refresh data every 5 minutes
    const refreshInterval = setInterval(() => {
      console.log('Auto-refreshing historical data...')
      fetchHistoricalData()
    }, 5 * 60 * 1000)

    return () => {
      clearInterval(refreshInterval)
      supabase.removeChannel(sensorChannel)
      supabase.removeChannel(energyChannel)
    }
  }, [])

  // Calculate statistics
  const calculateStats = (data: HistoricalDataPoint[]) => {
    if (data.length === 0) return {
      avgTemperature: 0,
      avgHumidity: 0,
      avgSoilMoisture: 0,
      avgLightLevel: 0,
      totalWaterUsage: 0
    }

    const totals = data.reduce((acc, curr) => ({
      temperature: acc.temperature + curr.temperature,
      humidity: acc.humidity + curr.humidity,
      soilMoisture: acc.soilMoisture + curr.soilMoisture,
      lightLevel: acc.lightLevel + curr.lightLevel,
      waterUsage: acc.waterUsage + curr.waterUsage
    }), { temperature: 0, humidity: 0, soilMoisture: 0, lightLevel: 0, waterUsage: 0 })

    return {
      avgTemperature: totals.temperature / data.length,
      avgHumidity: totals.humidity / data.length,
      avgSoilMoisture: totals.soilMoisture / data.length,
      avgLightLevel: totals.lightLevel / data.length,
      totalWaterUsage: totals.waterUsage
    }
  }

  const weeklyStats = calculateStats(weeklyData)
  const dailyStats = calculateStats(dailyData)

  // Calculate percentage changes (weekly vs daily)
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return 0
    return ((current - previous) / previous) * 100
  }

  return {
    dailyData,
    weeklyData,
    loading,
    error,
    stats: {
      avgTemperature: weeklyStats.avgTemperature,
      avgHumidity: weeklyStats.avgHumidity,
      avgSoilMoisture: weeklyStats.avgSoilMoisture,
      avgLightLevel: weeklyStats.avgLightLevel,
      totalWaterUsage: weeklyStats.totalWaterUsage,
      changes: {
        temperature: calculateChange(dailyStats.avgTemperature, weeklyStats.avgTemperature),
        humidity: calculateChange(dailyStats.avgHumidity, weeklyStats.avgHumidity),
        soilMoisture: calculateChange(dailyStats.avgSoilMoisture, weeklyStats.avgSoilMoisture),
        lightLevel: calculateChange(dailyStats.avgLightLevel, weeklyStats.avgLightLevel),
        waterUsage: calculateChange(dailyStats.totalWaterUsage, weeklyStats.totalWaterUsage)
      }
    },
    refetch: fetchHistoricalData
  }
}
