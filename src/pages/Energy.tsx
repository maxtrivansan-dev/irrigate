
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar
} from "recharts"
import { 
  Zap, 
  Activity,
  Gauge,
  TrendingUp, 
  TrendingDown,
  Calendar,
  AlertTriangle,
  CheckCircle
} from "lucide-react"
import { useEnergyMonitoring } from "@/hooks/useEnergyMonitoring"
import { format } from "date-fns"

export default function Energy() {
  const { 
    currentEnergyData, 
    recentReadings, 
    dailyConsumption,
    totalDailyEnergy,
    averagePower,
    peakPower,
    loading,
    error 
  } = useEnergyMonitoring()

  if (loading) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading energy data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-4" />
            <p className="text-destructive">{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Prepare chart data from recent readings
  const chartData = recentReadings.slice(-20).map(reading => ({
    time: format(new Date(reading.created_at || ''), 'HH:mm'),
    voltage: Number(reading.voltage || 0),
    current: Number(reading.current || 0),
    power: Number(reading.power || 0),
    energy: Number(reading.energy || 0)
  }))

  const powerQuality = currentEnergyData.powerFactor > 0.9 ? 'Excellent' : 
                      currentEnergyData.powerFactor > 0.8 ? 'Good' : 
                      currentEnergyData.powerFactor > 0.7 ? 'Fair' : 'Poor'

  const systemStatus = currentEnergyData.power > 0 ? 'Active' : 'Standby'

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Real-Time Energy Monitoring</h1>
          <p className="text-muted-foreground">
            Live energy consumption data from PZEM-004T sensor
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1 bg-success/10 text-success rounded-full">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Live</span>
          </div>
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Real-time Status Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Voltage</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentEnergyData.voltage.toFixed(1)} V</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>Frequency: {currentEnergyData.frequency.toFixed(1)} Hz</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentEnergyData.current.toFixed(3)} A</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>Power Factor: {currentEnergyData.powerFactor.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Power</CardTitle>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentEnergyData.power.toFixed(1)} W</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>Status: {systemStatus}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Energy</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentEnergyData.energy.toFixed(3)} kWh</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>Daily: {totalDailyEnergy.toFixed(3)} kWh</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Power Quality Indicator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5" />
            Power Quality Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Power Factor</span>
                <span className="font-medium">{currentEnergyData.powerFactor.toFixed(2)}</span>
              </div>
              <Progress value={currentEnergyData.powerFactor * 100} className="h-2" />
              <Badge variant={powerQuality === 'Excellent' ? 'default' : powerQuality === 'Good' ? 'secondary' : 'destructive'}>
                {powerQuality}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Voltage Stability</span>
                <span className="font-medium">
                  {Math.abs(currentEnergyData.voltage - 220) < 10 ? 'Stable' : 'Unstable'}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Frequency</span>
                <span className="font-medium">
                  {Math.abs(currentEnergyData.frequency - 50) < 1 ? 'Normal' : 'Deviation'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="realtime" className="space-y-4">
        <TabsList>
          <TabsTrigger value="realtime">Real-time Charts</TabsTrigger>
          <TabsTrigger value="consumption">Daily Consumption</TabsTrigger>
          <TabsTrigger value="analysis">Power Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="realtime" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Power Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Power Consumption</CardTitle>
                <CardDescription>Real-time power usage (last 20 readings)</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="power" 
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary))" 
                      fillOpacity={0.3}
                      name="Power (W)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Voltage & Current Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Voltage & Current</CardTitle>
                <CardDescription>Real-time voltage and current readings</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="voltage" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      name="Voltage (V)"
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="current" 
                      stroke="hsl(var(--destructive))" 
                      strokeWidth={2}
                      name="Current (A)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="consumption" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Daily Consumption Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Today's Summary</CardTitle>
                <CardDescription>Energy consumption overview</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Energy</p>
                    <p className="text-2xl font-bold">{totalDailyEnergy.toFixed(3)} kWh</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Average Power</p>
                    <p className="text-2xl font-bold">{averagePower.toFixed(1)} W</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Peak Power</p>
                    <p className="text-2xl font-bold">{peakPower.toFixed(1)} W</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Est. Cost</p>
                    <p className="text-2xl font-bold">Rp {(totalDailyEnergy * 1500).toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Device Consumption */}
            <Card>
              <CardHeader>
                <CardTitle>Device Breakdown</CardTitle>
                <CardDescription>Energy usage by device</CardDescription>
              </CardHeader>
              <CardContent>
                {dailyConsumption.length > 0 ? (
                  <div className="space-y-3">
                    {dailyConsumption.map((device, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{device.device_name}</span>
                          <span className="font-medium">{Number(device.total_energy).toFixed(3)} kWh</span>
                        </div>
                        <Progress 
                          value={totalDailyEnergy > 0 ? (Number(device.total_energy) / totalDailyEnergy) * 100 : 0} 
                          className="h-2" 
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Avg: {Number(device.avg_power).toFixed(1)}W</span>
                          <span>Peak: {Number(device.peak_power).toFixed(1)}W</span>
                          <span>Runtime: {Number(device.runtime_hours).toFixed(1)}h</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No consumption data available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Power Analysis & Recommendations</CardTitle>
              <CardDescription>System efficiency and optimization suggestions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <h3 className="font-medium">Current Status</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span>System Efficiency</span>
                      <Badge variant={currentEnergyData.powerFactor > 0.8 ? 'default' : 'secondary'}>
                        {(currentEnergyData.powerFactor * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Power Quality</span>
                      <Badge variant={powerQuality === 'Excellent' ? 'default' : 'secondary'}>
                        {powerQuality}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Energy Cost (Est.)</span>
                      <span className="font-medium">Rp {(totalDailyEnergy * 1500).toLocaleString()}/day</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Optimization Tips</h3>
                  <div className="space-y-3 text-sm">
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="font-medium text-success">💡 Efficiency</p>
                      <p>Monitor power factor to maintain above 0.85 for optimal efficiency</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="font-medium text-primary">📊 Monitoring</p>
                      <p>Schedule high-power operations during off-peak hours</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="font-medium text-warning">⚡ Maintenance</p>
                      <p>Regular sensor calibration ensures accurate readings</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
