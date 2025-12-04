
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
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
  Thermometer, 
  Droplets, 
  Gauge, 
  Calendar,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Sun
} from "lucide-react"
import { useHistoricalData } from "@/hooks/useHistoricalData"
import { useToast } from "@/hooks/use-toast"

export default function Analysis() {
  const { 
    dailyData, 
    weeklyData, 
    loading, 
    error, 
    stats,
    refetch 
  } = useHistoricalData()
  
  const { toast } = useToast()

  const handleRefresh = async () => {
    toast({
      title: "Refreshing data...",
      description: "Fetching latest historical data",
    })
    await refetch()
    toast({
      title: "Data refreshed",
      description: "Historical data has been updated",
    })
  }

  const StatCard = ({ 
    title, 
    value, 
    unit, 
    change, 
    icon: Icon 
  }: {
    title: string
    value: number
    unit: string
    change: number
    icon: any
  }) => {
    const isPositive = change > 0
    
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {value.toFixed(1)}{unit}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {isPositive ? (
              <TrendingUp className="h-3 w-3 text-green-500" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500" />
            )}
            <span className={isPositive ? "text-green-500" : "text-red-500"}>
              {Math.abs(change).toFixed(1)}%
            </span>
            <span>from last week</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span>Loading historical data...</span>
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
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analysis</h1>
          <p className="text-muted-foreground">
            Real-time historical data and trends for your irrigation system
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Real-time Data Indicator */}
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-sm text-muted-foreground">
          Real-time data • Last updated: {new Date().toLocaleTimeString()}
        </span>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Avg Temperature"
          value={stats.avgTemperature}
          unit="°C"
          change={stats.changes.temperature}
          icon={Thermometer}
        />
        <StatCard
          title="Avg Humidity"
          value={stats.avgHumidity}
          unit="%"
          change={stats.changes.humidity}
          icon={Droplets}
        />
        <StatCard
          title="Avg Soil Moisture"
          value={stats.avgSoilMoisture}
          unit="%"
          change={stats.changes.soilMoisture}
          icon={Gauge}
        />
        <StatCard
          title="Avg Light Level"
          value={stats.avgLightLevel}
          unit=" lux"
          change={stats.changes.lightLevel}
          icon={Sun}
        />
        <StatCard
          title="Water Usage"
          value={stats.totalWaterUsage}
          unit="L"
          change={stats.changes.waterUsage}
          icon={Droplets}
        />
      </div>

      {/* Charts */}
      <Tabs defaultValue="environmental" className="space-y-4">
        <TabsList>
          <TabsTrigger value="environmental">Environmental</TabsTrigger>
          <TabsTrigger value="irrigation">Irrigation</TabsTrigger>
          <TabsTrigger value="energy">Energy</TabsTrigger>
        </TabsList>

        <TabsContent value="environmental" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Temperature & Humidity */}
            <Card>
              <CardHeader>
                <CardTitle>Temperature & Humidity</CardTitle>
                <CardDescription>
                  Environmental conditions over the last 7 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="temperature" 
                      stroke="hsl(var(--destructive))" 
                      strokeWidth={2}
                      name="Temperature (°C)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="humidity" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      name="Humidity (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Soil Moisture & Light Level */}
            <Card>
              <CardHeader>
                <CardTitle>Soil Moisture & Light Level</CardTitle>
                <CardDescription>
                  Soil conditions and light exposure tracking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="moisture" orientation="left" />
                    <YAxis yAxisId="light" orientation="right" />
                    <Tooltip />
                    <Line 
                      yAxisId="moisture"
                      type="monotone" 
                      dataKey="soilMoisture" 
                      stroke="hsl(var(--success))" 
                      strokeWidth={2}
                      name="Soil Moisture (%)"
                    />
                    <Line 
                      yAxisId="light"
                      type="monotone" 
                      dataKey="lightLevel" 
                      stroke="hsl(var(--warning))" 
                      strokeWidth={2}
                      name="Light Level (lux)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Light Level Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Light Exposure</CardTitle>
              <CardDescription>
                Light intensity patterns throughout the week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="lightLevel" 
                    stroke="hsl(var(--warning))" 
                    fill="hsl(var(--warning))" 
                    fillOpacity={0.3}
                    name="Light Level (lux)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Tank Levels */}
          <Card>
            <CardHeader>
              <CardTitle>Tank Levels</CardTitle>
              <CardDescription>
                Water and vitamin tank levels over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="waterTankLevel" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="Water Tank (%)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="vitaminTankLevel" 
                    stroke="hsl(var(--success))" 
                    strokeWidth={2}
                    name="Vitamin Tank (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="irrigation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Water Usage Patterns</CardTitle>
              <CardDescription>
                Daily water consumption and flow rate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar 
                    dataKey="waterUsage" 
                    fill="hsl(var(--primary))" 
                    name="Water Usage (L)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="energy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Energy Consumption</CardTitle>
              <CardDescription>
                Device energy usage and efficiency metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="energyUsage" 
                    stroke="hsl(var(--chart-1))" 
                    fill="hsl(var(--chart-1))" 
                    fillOpacity={0.3}
                    name="Energy (kWh)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
