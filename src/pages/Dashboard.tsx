
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { 
  Droplets, 
  Thermometer, 
  Wind, 
  Gauge, 
  Battery, 
  Play, 
  Pause,
  Settings as SettingsIcon
} from "lucide-react"
import { useRealTimeData } from "@/hooks/useRealTimeData"
import { useSupabaseSettings } from "@/hooks/useSupabaseSettings"
import { toast } from "sonner"

export default function Dashboard() {
  const { sensorData, devices, thresholds, schedule } = useRealTimeData()
  const { updateDeviceControl, loading } = useSupabaseSettings()

  const getDeviceByName = (name: string) => {
    return devices.find(device => device.device_name === name)
  }

  const handleDeviceToggle = async (deviceName: string) => {
    const device = getDeviceByName(deviceName)
    if (!device) return

    try {
      await updateDeviceControl(deviceName, {
        is_active: !device.is_active
      })
    } catch (error) {
      console.error(`Error toggling ${deviceName}:`, error)
      toast.error(`Failed to toggle ${deviceName}`)
    }
  }

  const handleAutoModeToggle = async () => {
    try {
      // Update all devices to the new auto mode state
      const currentAutoMode = devices[0]?.auto_mode ?? true
      const newAutoMode = !currentAutoMode

      for (const device of devices) {
        await updateDeviceControl(device.device_name, {
          auto_mode: newAutoMode
        })
      }
      
      toast.success(`Auto mode ${newAutoMode ? 'enabled' : 'disabled'}`)
    } catch (error) {
      console.error('Error updating auto mode:', error)
      toast.error('Failed to update auto mode')
    }
  }

  const SensorCard = ({ 
    title, 
    value, 
    unit, 
    icon: Icon, 
    status = "normal",
    description 
  }: {
    title: string
    value: number | null
    unit: string
    icon: any
    status?: "normal" | "warning" | "critical"
    description?: string
  }) => {
    const getStatusColor = () => {
      switch (status) {
        case "warning": return "text-warning"
        case "critical": return "text-destructive"
        default: return "text-primary"
      }
    }

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className={`h-4 w-4 ${getStatusColor()}`} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {value?.toFixed(1) ?? '--'}{unit}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">
              {description}
            </p>
          )}
        </CardContent>
      </Card>
    )
  }

  const TankLevel = ({ 
    title, 
    level, 
    type 
  }: { 
    title: string
    level: number | null
    type: "water" | "vitamin" 
  }) => {
    const levelValue = level ?? 0
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplets className="h-4 w-4" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Level</span>
              <span className="font-medium">{levelValue.toFixed(0)}%</span>
            </div>
            <Progress value={levelValue} className="h-2" />
            {levelValue < 30 && (
              <Badge variant="destructive" className="text-xs">
                Low Level Alert
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const pumpDevice = getDeviceByName('pump')
  const fanDevice = getDeviceByName('fan')
  const autoMode = devices[0]?.auto_mode ?? true
  const systemStatus = sensorData ? "online" : "offline"
  const lastUpdate = sensorData?.created_at 
    ? new Date(sensorData.created_at).toLocaleTimeString()
    : "Never"

  // Calculate status based on thresholds
  const getTemperatureStatus = () => {
    if (!sensorData?.temperature || !thresholds?.max_temperature) return "normal"
    return sensorData.temperature > thresholds.max_temperature ? "warning" : "normal"
  }

  const getSoilMoistureStatus = () => {
    if (!sensorData?.soil_moisture || !thresholds?.min_soil_moisture) return "normal"
    return sensorData.soil_moisture < thresholds.min_soil_moisture ? "warning" : "normal"
  }

  const getLightLevelStatus = () => {
    if (!sensorData?.light_level || !thresholds?.min_light_level) return "normal"
    return sensorData.light_level < thresholds.min_light_level ? "warning" : "normal"
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time monitoring of your irrigation system
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={systemStatus === "online" ? "default" : "destructive"}>
            {systemStatus}
          </Badge>
          <span className="text-sm text-muted-foreground">
            Last update: {lastUpdate}
          </span>
        </div>
      </div>

      {/* Sensor Grid - Updated to include light sensor */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <SensorCard
          title="Temperature"
          value={sensorData?.temperature ?? null}
          unit="°C"
          icon={Thermometer}
          status={getTemperatureStatus()}
          description="Ambient temperature"
        />
        <SensorCard
          title="Humidity"
          value={sensorData?.humidity ?? null}
          unit="%"
          icon={Droplets}
          description="Air humidity level"
        />
        <SensorCard
          title="Soil Moisture"
          value={sensorData?.soil_moisture ?? null}
          unit="%"
          icon={Gauge}
          status={getSoilMoistureStatus()}
          description="Soil moisture content"
        />
        <SensorCard
          title="Light Level"
          value={sensorData?.light_level ?? null}
          unit=" lux"
          icon={Wind}
          status={getLightLevelStatus()}
          description="Ambient light intensity"
        />
        <SensorCard
          title="System Load"
          value={23}
          unit="%"
          icon={Battery}
          description="Current system usage"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Tank Levels */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xl font-semibold">Tank Levels</h2>
          <TankLevel 
            title="Water Tank" 
            level={sensorData?.water_tank_level ?? null} 
            type="water" 
          />
          <TankLevel 
            title="Vitamin Tank" 
            level={sensorData?.vitamin_tank_level ?? null} 
            type="vitamin" 
          />
        </div>

        {/* Device Control */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold">Device Control</h2>
          <Card>
            <CardHeader>
              <CardTitle>Manual Controls</CardTitle>
              <CardDescription>
                Control devices manually when auto mode is disabled
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Auto Mode Toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Auto Mode</label>
                  <p className="text-sm text-muted-foreground">
                    Enable automatic irrigation scheduling
                  </p>
                </div>
                <Switch 
                  checked={autoMode} 
                  onCheckedChange={handleAutoModeToggle}
                  disabled={loading}
                />
              </div>

              <Separator />

              {/* Device Controls */}
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Droplets className="h-4 w-4" />
                    <span className="font-medium">Water Pump</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={pumpDevice?.is_active ? "default" : "secondary"}>
                      {pumpDevice?.is_active ? "ON" : "OFF"}
                    </Badge>
                    <Button 
                      variant={pumpDevice?.is_active ? "destructive" : "default"}
                      size="sm"
                      disabled={autoMode || loading}
                      onClick={() => handleDeviceToggle('pump')}
                    >
                      {pumpDevice?.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wind className="h-4 w-4" />
                    <span className="font-medium">Cooling Fan</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={fanDevice?.is_active ? "default" : "secondary"}>
                      {fanDevice?.is_active ? "ON" : "OFF"}
                    </Badge>
                    <Button 
                      variant={fanDevice?.is_active ? "destructive" : "default"}
                      size="sm"
                      disabled={autoMode || loading}
                      onClick={() => handleDeviceToggle('fan')}
                    >
                      {fanDevice?.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              {autoMode && (
                <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <SettingsIcon className="h-4 w-4" />
                    <span>Auto mode enabled - devices controlled by schedule and thresholds</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
