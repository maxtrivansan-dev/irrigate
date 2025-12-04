
import { Link } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Droplets, 
  Thermometer, 
  Wind, 
  Gauge, 
  BarChart3,
  Settings,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Zap,
  Cloud,
  RefreshCw
} from "lucide-react"
import { useRealTimeData } from "@/hooks/useRealTimeData"

const Index = () => {
  const { sensorData, devices, thresholds, energyData, loading, lastUpdate } = useRealTimeData()

  // Calculate system status based on real data
  const systemOnline = !!sensorData && !!energyData
  const autoMode = devices.length > 0 ? devices[0]?.auto_mode ?? true : true
  const lastUpdateTime = lastUpdate ? lastUpdate.toLocaleTimeString() : "Never"

  // Generate alerts based on real sensor data and thresholds
  const generateAlerts = () => {
    const alerts = []
    
    if (systemOnline) {
      alerts.push({ type: "info", message: "System operating normally with real-time data" })
    } else {
      alerts.push({ type: "warning", message: "Some sensors not responding - check connections" })
    }

    if (sensorData && thresholds) {
      if (sensorData.soil_moisture && sensorData.soil_moisture < thresholds.min_soil_moisture) {
        alerts.push({ type: "warning", message: "Soil moisture below threshold - irrigation needed" })
      }
      if (sensorData.temperature && sensorData.temperature > thresholds.max_temperature) {
        alerts.push({ type: "warning", message: "Temperature above safe level" })
      }
      if (sensorData.water_tank_level && sensorData.water_tank_level < thresholds.low_water_level) {
        alerts.push({ type: "warning", message: "Water tank level is low" })
      }
      if (sensorData.vitamin_tank_level && sensorData.vitamin_tank_level < thresholds.low_vitamin_level) {
        alerts.push({ type: "warning", message: "Vitamin tank will need refill soon" })
      }
    }

    // Energy-based alerts
    if (energyData) {
      const power = Number(energyData.power || 0)
      const voltage = Number(energyData.voltage || 0)
      
      if (power > 1000) {
        alerts.push({ type: "warning", message: "High power consumption detected" })
      }
      if (voltage < 200 || voltage > 250) {
        alerts.push({ type: "warning", message: "Voltage outside normal range" })
      }
    }

    return alerts
  }

  const alerts = generateAlerts()

  const QuickStat = ({ 
    title, 
    value, 
    unit, 
    icon: Icon, 
    status = "normal" 
  }: {
    title: string
    value: number | null
    unit: string
    icon: any
    status?: "normal" | "warning" | "critical"
  }) => {
    const getStatusColor = () => {
      switch (status) {
        case "warning": return "text-warning"
        case "critical": return "text-destructive"
        default: return "text-primary"
      }
    }

    return (
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg bg-muted ${getStatusColor()}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="font-semibold">
            {value?.toFixed(1) ?? '--'}{unit}
          </p>
        </div>
      </div>
    )
  }

  // Calculate status based on thresholds
  const getTemperatureStatus = () => {
    if (!sensorData?.temperature || !thresholds?.max_temperature) return "normal"
    return sensorData.temperature > thresholds.max_temperature ? "warning" : "normal"
  }

  const getSoilMoistureStatus = () => {
    if (!sensorData?.soil_moisture || !thresholds?.min_soil_moisture) return "normal"
    return sensorData.soil_moisture < thresholds.min_soil_moisture ? "warning" : "normal"
  }

  const getPowerStatus = () => {
    if (!energyData?.power) return "normal"
    const power = Number(energyData.power)
    return power > 1000 ? "warning" : "normal"
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading real-time data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-8 p-6">
      {/* Welcome Section */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary">
          <Droplets className="h-5 w-5" />
          <span className="font-medium">Smart Irrigation System</span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight">
          Welcome to Your Smart Garden
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Monitor and control your irrigation system with real-time data, automated scheduling, and intelligent water management.
        </p>
      </div>

      {/* System Status */}
      <Card className="mx-auto max-w-4xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className={`h-5 w-5 ${systemOnline ? 'text-success' : 'text-destructive'}`} />
                System Status
              </CardTitle>
              <CardDescription>
                Last updated: {lastUpdateTime}
                {lastUpdate && <span className="text-xs ml-2 text-success">● Live</span>}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={systemOnline ? "default" : "destructive"}>
                {systemOnline ? "Online" : "Offline"}
              </Badge>
              <Badge variant={autoMode ? "default" : "secondary"}>
                {autoMode ? "Auto Mode" : "Manual Mode"}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <QuickStat
              title="Temperature"
              value={sensorData?.temperature ?? null}
              unit="°C"
              icon={Thermometer}
              status={getTemperatureStatus()}
            />
            <QuickStat
              title="Humidity"
              value={sensorData?.humidity ?? null}
              unit="%"
              icon={Droplets}
            />
            <QuickStat
              title="Soil Moisture"
              value={sensorData?.soil_moisture ?? null}
              unit="%"
              icon={Gauge}
              status={getSoilMoistureStatus()}
            />
            <QuickStat
              title="Power Usage"
              value={energyData?.power ? Number(energyData.power) : null}
              unit="W"
              icon={Zap}
              status={getPowerStatus()}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tank Levels */}
      <div className="grid gap-4 md:grid-cols-2 max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-primary" />
              Water Tank
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Level</span>
                <span className="font-medium">{sensorData?.water_tank_level?.toFixed(0) ?? '--'}%</span>
              </div>
              <Progress value={sensorData?.water_tank_level ?? 0} className="h-3" />
              <p className="text-sm text-muted-foreground">
                {(sensorData?.water_tank_level ?? 0) > 50 ? "Good level" : "Consider refilling"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-success" />
              Vitamin Tank
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Level</span>
                <span className="font-medium">{sensorData?.vitamin_tank_level?.toFixed(0) ?? '--'}%</span>
              </div>
              <Progress value={sensorData?.vitamin_tank_level ?? 0} className="h-3" />
              <p className="text-sm text-muted-foreground">
                {(sensorData?.vitamin_tank_level ?? 0) > 50 ? "Good level" : "Consider refilling"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Energy Status */}
      {energyData && (
        <Card className="mx-auto max-w-4xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Energy Monitoring
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <QuickStat
                title="Voltage"
                value={energyData.voltage ? Number(energyData.voltage) : null}
                unit="V"
                icon={Zap}
              />
              <QuickStat
                title="Current"
                value={energyData.current ? Number(energyData.current) : null}
                unit="A"
                icon={Gauge}
              />
              <QuickStat
                title="Power"
                value={energyData.power ? Number(energyData.power) : null}
                unit="W"
                icon={Zap}
                status={getPowerStatus()}
              />
              <QuickStat
                title="Energy"
                value={energyData.energy ? Number(energyData.energy) : null}
                unit="kWh"
                icon={BarChart3}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card className="mx-auto max-w-4xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              System Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                  {alert.type === "warning" ? (
                    <AlertTriangle className="h-4 w-4 text-warning" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-success" />
                  )}
                  <span className="text-sm">{alert.message}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-4 max-w-5xl mx-auto">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Dashboard
            </CardTitle>
            <CardDescription>
              Real-time monitoring and device control
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/dashboard">
              <Button className="w-full">
                Open Dashboard
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Energy Monitor
            </CardTitle>
            <CardDescription>
              Real-time power consumption
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/energy">
              <Button variant="outline" className="w-full">
                View Energy
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cloud className="h-5 w-5" />
              Weather
            </CardTitle>
            <CardDescription>
              3-day weather forecast
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/weather">
              <Button variant="outline" className="w-full">
                View Forecast
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Settings
            </CardTitle>
            <CardDescription>
              Configure thresholds and schedules
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/settings">
              <Button variant="outline" className="w-full">
                Manage Settings
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Next Steps Banner */}
      <Card className="mx-auto max-w-4xl bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <h2 className="text-xl font-semibold">Real-Time System Active!</h2>
            <p className="text-muted-foreground">
              Your irrigation system is now connected with live sensor data and energy monitoring. 
              All data updates automatically every 30 seconds.
            </p>
            <div className="flex items-center gap-2 justify-center">
              <Link to="/dashboard">
                <Button size="sm">Go to Dashboard</Button>
              </Link>
              <Link to="/energy">
                <Button variant="outline" size="sm">Energy Monitor</Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
