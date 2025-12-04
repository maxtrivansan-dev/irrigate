
import { useState, useEffect } from 'react'
import { supabase } from "@/integrations/supabase/client"
import type { Tables } from "@/integrations/supabase/types"

export interface ActivityItem {
  id: string
  timestamp: string
  type: 'irrigation' | 'manual' | 'schedule' | 'alert' | 'energy'
  action: string
  details: string
  duration: string
  user: string
  status: 'completed' | 'acknowledged' | 'failed' | 'active'
}

export const useActivityHistory = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const processIrrigationLogs = (logs: Tables<"irrigation_logs">[]): ActivityItem[] => {
    return logs.map(log => ({
      id: log.id,
      timestamp: log.created_at || new Date().toISOString(),
      type: 'irrigation' as const,
      action: 'Auto watering completed',
      details: `${log.trigger_reason || 'Scheduled irrigation'} - Tank: ${log.tank_type || 'Water'} - Moisture: ${log.soil_moisture_before}% → ${log.soil_moisture_after}%`,
      duration: `${Math.round((log.duration_seconds || 0) / 60)} min`,
      user: 'System',
      status: 'completed' as const
    }))
  }

  const processEnergyLogs = (logs: Tables<"energy_logs">[]): ActivityItem[] => {
    return logs.map(log => ({
      id: log.id,
      timestamp: log.created_at || new Date().toISOString(),
      type: 'energy' as const,
      action: `${log.device_name} operation`,
      details: `Power: ${log.estimated_power_watts}W - Energy: ${log.estimated_energy_kwh}kWh`,
      duration: `${Math.round((log.duration_seconds || 0) / 60)} min`,
      user: 'System',
      status: 'completed' as const
    }))
  }

  const processSensorReadings = (readings: Tables<"sensor_readings">[]): ActivityItem[] => {
    const alerts: ActivityItem[] = []
    
    readings.forEach(reading => {
      // Check for low water level
      if ((reading.water_tank_level || 0) < 20) {
        alerts.push({
          id: `${reading.id}-water`,
          timestamp: reading.created_at || new Date().toISOString(),
          type: 'alert',
          action: 'Low water level alert',
          details: `Water tank level: ${reading.water_tank_level}%`,
          duration: '-',
          user: 'System',
          status: 'acknowledged'
        })
      }

      // Check for low vitamin level
      if ((reading.vitamin_tank_level || 0) < 15) {
        alerts.push({
          id: `${reading.id}-vitamin`,
          timestamp: reading.created_at || new Date().toISOString(),
          type: 'alert',
          action: 'Low vitamin level alert',
          details: `Vitamin tank level: ${reading.vitamin_tank_level}%`,
          duration: '-',
          user: 'System',
          status: 'acknowledged'
        })
      }

      // Check for high temperature
      if ((reading.temperature || 0) > 30) {
        alerts.push({
          id: `${reading.id}-temp`,
          timestamp: reading.created_at || new Date().toISOString(),
          type: 'alert',
          action: 'High temperature alert',
          details: `Temperature: ${reading.temperature}°C`,
          duration: '-',
          user: 'System',
          status: 'acknowledged'
        })
      }
    })

    return alerts
  }

  const fetchActivityData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get data from the last 30 days
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      // Fetch irrigation logs
      const { data: irrigationLogs, error: irrigationError } = await supabase
        .from('irrigation_logs')
        .select('*')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(50)

      if (irrigationError) throw irrigationError

      // Fetch energy logs
      const { data: energyLogs, error: energyError } = await supabase
        .from('energy_logs')
        .select('*')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(50)

      if (energyError) throw energyError

      // Fetch recent sensor readings for alerts
      const { data: sensorReadings, error: sensorError } = await supabase
        .from('sensor_readings')
        .select('*')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(100)

      if (sensorError) throw sensorError

      // Process all data
      const irrigationActivities = processIrrigationLogs(irrigationLogs || [])
      const energyActivities = processEnergyLogs(energyLogs || [])
      const alertActivities = processSensorReadings(sensorReadings || [])

      // Combine and sort all activities
      const allActivities = [
        ...irrigationActivities,
        ...energyActivities,
        ...alertActivities
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      setActivities(allActivities)

    } catch (error) {
      console.error('Error fetching activity data:', error)
      setError('Failed to fetch activity data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActivityData()

    // Set up real-time subscriptions
    const irrigationChannel = supabase
      .channel('history-irrigation-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'irrigation_logs' },
        () => {
          console.log('New irrigation activity detected')
          fetchActivityData()
        }
      )
      .subscribe()

    const energyChannel = supabase
      .channel('history-energy-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'energy_logs' },
        () => {
          console.log('New energy activity detected')
          fetchActivityData()
        }
      )
      .subscribe()

    const sensorChannel = supabase
      .channel('history-sensor-changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'sensor_readings' },
        () => {
          console.log('New sensor reading detected')
          fetchActivityData()
        }
      )
      .subscribe()

    // Auto-refresh every 2 minutes
    const refreshInterval = setInterval(() => {
      console.log('Auto-refreshing activity history...')
      fetchActivityData()
    }, 2 * 60 * 1000)

    return () => {
      clearInterval(refreshInterval)
      supabase.removeChannel(irrigationChannel)
      supabase.removeChannel(energyChannel)
      supabase.removeChannel(sensorChannel)
    }
  }, [])

  const exportData = () => {
    const csvContent = [
      ['Timestamp', 'Type', 'Action', 'Details', 'Duration', 'User', 'Status'].join(','),
      ...activities.map(item => [
        item.timestamp,
        item.type,
        item.action,
        item.details.replace(/,/g, ';'),
        item.duration,
        item.user,
        item.status
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `irrigation_history_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  return {
    activities,
    loading,
    error,
    refetch: fetchActivityData,
    exportData
  }
}
