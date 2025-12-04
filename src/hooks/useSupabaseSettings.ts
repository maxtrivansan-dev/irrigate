
import { useState, useCallback } from 'react'
import { supabase } from "@/integrations/supabase/client"
import type { Tables, TablesUpdate } from "@/integrations/supabase/types"
import { toast } from "sonner"

export const useSupabaseSettings = () => {
  const [loading, setLoading] = useState(false)

  const updateThresholds = useCallback(async (thresholds: Partial<TablesUpdate<"thresholds">>) => {
    setLoading(true)
    try {
      // Get the first threshold record to update
      const { data: existingThreshold } = await supabase
        .from('thresholds')
        .select('id')
        .limit(1)
        .single()

      if (existingThreshold) {
        const { error } = await supabase
          .from('thresholds')
          .update({ ...thresholds, updated_at: new Date().toISOString() })
          .eq('id', existingThreshold.id)

        if (error) throw error
      }
      
      toast.success("Thresholds updated successfully")
    } catch (error) {
      console.error('Error updating thresholds:', error)
      toast.error("Failed to update thresholds")
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const updateSchedule = useCallback(async (schedule: Partial<TablesUpdate<"irrigation_schedule">>) => {
    setLoading(true)
    try {
      // Get the first schedule record to update
      const { data: existingSchedule } = await supabase
        .from('irrigation_schedule')
        .select('id')
        .limit(1)
        .single()

      if (existingSchedule) {
        const { error } = await supabase
          .from('irrigation_schedule')
          .update({ ...schedule, updated_at: new Date().toISOString() })
          .eq('id', existingSchedule.id)

        if (error) throw error
      }
      
      toast.success("Schedule updated successfully")
    } catch (error) {
      console.error('Error updating schedule:', error)
      toast.error("Failed to update schedule")
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const updateDeviceControl = useCallback(async (deviceName: string, updates: Partial<TablesUpdate<"device_control">>) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('device_control')
        .update({ ...updates, last_updated: new Date().toISOString() })
        .eq('device_name', deviceName)

      if (error) throw error
      console.log(`Device ${deviceName} updated successfully`, updates)
    } catch (error) {
      console.error(`Error updating ${deviceName}:`, error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  return { updateThresholds, updateSchedule, updateDeviceControl, loading }
}
