export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      device_control: {
        Row: {
          auto_mode: boolean | null
          device_name: string
          id: string
          is_active: boolean | null
          last_updated: string | null
        }
        Insert: {
          auto_mode?: boolean | null
          device_name: string
          id?: string
          is_active?: boolean | null
          last_updated?: string | null
        }
        Update: {
          auto_mode?: boolean | null
          device_name?: string
          id?: string
          is_active?: boolean | null
          last_updated?: string | null
        }
        Relationships: []
      }
      energy_logs: {
        Row: {
          created_at: string | null
          device_name: string
          duration_seconds: number | null
          estimated_energy_kwh: number | null
          estimated_power_watts: number | null
          id: string
        }
        Insert: {
          created_at?: string | null
          device_name: string
          duration_seconds?: number | null
          estimated_energy_kwh?: number | null
          estimated_power_watts?: number | null
          id?: string
        }
        Update: {
          created_at?: string | null
          device_name?: string
          duration_seconds?: number | null
          estimated_energy_kwh?: number | null
          estimated_power_watts?: number | null
          id?: string
        }
        Relationships: []
      }
      energy_readings: {
        Row: {
          created_at: string
          current: number | null
          device_name: string
          energy: number | null
          frequency: number | null
          id: string
          power: number | null
          power_factor: number | null
          voltage: number | null
        }
        Insert: {
          created_at?: string
          current?: number | null
          device_name: string
          energy?: number | null
          frequency?: number | null
          id?: string
          power?: number | null
          power_factor?: number | null
          voltage?: number | null
        }
        Update: {
          created_at?: string
          current?: number | null
          device_name?: string
          energy?: number | null
          frequency?: number | null
          id?: string
          power?: number | null
          power_factor?: number | null
          voltage?: number | null
        }
        Relationships: []
      }
      irrigation_logs: {
        Row: {
          created_at: string | null
          duration_seconds: number | null
          id: string
          soil_moisture_after: number | null
          soil_moisture_before: number | null
          tank_type: string | null
          trigger_reason: string | null
        }
        Insert: {
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          soil_moisture_after?: number | null
          soil_moisture_before?: number | null
          tank_type?: string | null
          trigger_reason?: string | null
        }
        Update: {
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          soil_moisture_after?: number | null
          soil_moisture_before?: number | null
          tank_type?: string | null
          trigger_reason?: string | null
        }
        Relationships: []
      }
      irrigation_schedule: {
        Row: {
          enabled: boolean | null
          evening_time: string | null
          id: string
          morning_time: string | null
          tank_rotation: boolean | null
          updated_at: string | null
          weekend_mode: boolean | null
        }
        Insert: {
          enabled?: boolean | null
          evening_time?: string | null
          id?: string
          morning_time?: string | null
          tank_rotation?: boolean | null
          updated_at?: string | null
          weekend_mode?: boolean | null
        }
        Update: {
          enabled?: boolean | null
          evening_time?: string | null
          id?: string
          morning_time?: string | null
          tank_rotation?: boolean | null
          updated_at?: string | null
          weekend_mode?: boolean | null
        }
        Relationships: []
      }
      sensor_readings: {
        Row: {
          created_at: string | null
          flow_rate: number | null
          humidity: number | null
          id: string
          light_level: number | null
          soil_moisture: number | null
          temperature: number | null
          total_flow_volume: number | null
          vitamin_tank_level: number | null
          vitamin_temp: number | null
          water_tank_level: number | null
          water_temp: number | null
        }
        Insert: {
          created_at?: string | null
          flow_rate?: number | null
          humidity?: number | null
          id?: string
          light_level?: number | null
          soil_moisture?: number | null
          temperature?: number | null
          total_flow_volume?: number | null
          vitamin_tank_level?: number | null
          vitamin_temp?: number | null
          water_tank_level?: number | null
          water_temp?: number | null
        }
        Update: {
          created_at?: string | null
          flow_rate?: number | null
          humidity?: number | null
          id?: string
          light_level?: number | null
          soil_moisture?: number | null
          temperature?: number | null
          total_flow_volume?: number | null
          vitamin_tank_level?: number | null
          vitamin_temp?: number | null
          water_tank_level?: number | null
          water_temp?: number | null
        }
        Relationships: []
      }
      thresholds: {
        Row: {
          id: string
          low_vitamin_level: number | null
          low_water_level: number | null
          max_temperature: number | null
          min_light_level: number | null
          min_soil_moisture: number | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          low_vitamin_level?: number | null
          low_water_level?: number | null
          max_temperature?: number | null
          min_light_level?: number | null
          min_soil_moisture?: number | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          low_vitamin_level?: number | null
          low_water_level?: number | null
          max_temperature?: number | null
          min_light_level?: number | null
          min_soil_moisture?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_daily_energy_consumption: {
        Args: Record<PropertyKey, never>
        Returns: {
          device_name: string
          total_energy: number
          avg_power: number
          peak_power: number
          runtime_hours: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
