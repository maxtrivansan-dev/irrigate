import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Cloud,
  Sun,
  CloudRain,
  CloudSnow,
  Zap,
  Wind,
  Droplets,
  Thermometer,
  Eye,
  Gauge,
  MapPin,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

interface WeatherData {
  location: {
    name: string;
    country: string;
  };
  current: {
    temp_c: number;
    condition: {
      text: string;
      icon: string;
    };
    wind_kph: number;
    humidity: number;
    vis_km: number;
    pressure_mb: number;
  };
  forecast: {
    forecastday: Array<{
      date: string;
      day: {
        maxtemp_c: number;
        mintemp_c: number;
        condition: {
          text: string;
          icon: string;
        };
        avghumidity: number;
        daily_chance_of_rain: number;
        maxwind_kph: number;
      };
    }>;
  };
}

const Weather = () => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState("Jakarta");
  const [apiKey, setApiKey] = useState("");
  const [showSetup, setShowSetup] = useState(false);

  const getWeatherIcon = (condition: string) => {
    const conditionLower = condition.toLowerCase();
    if (conditionLower.includes("sunny") || conditionLower.includes("clear")) {
      return <Sun className="h-8 w-8 text-yellow-500" />;
    } else if (
      conditionLower.includes("rain") ||
      conditionLower.includes("drizzle")
    ) {
      return <CloudRain className="h-8 w-8 text-blue-500" />;
    } else if (conditionLower.includes("snow")) {
      return <CloudSnow className="h-8 w-8 text-blue-200" />;
    } else if (
      conditionLower.includes("thunder") ||
      conditionLower.includes("storm")
    ) {
      return <Zap className="h-8 w-8 text-purple-500" />;
    } else {
      return <Cloud className="h-8 w-8 text-gray-500" />;
    }
  };

  const fetchWeatherData = async (
    savedApiKey?: string,
    savedLocation?: string
  ) => {
    const keyToUse = savedApiKey || apiKey;
    const locationToUse = savedLocation || location;

    if (!keyToUse) {
      toast.error("Please enter your WeatherAPI key");
      setShowSetup(true);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://api.weatherapi.com/v1/forecast.json?key=${keyToUse}&q=${locationToUse}&days=3&aqi=no&alerts=no`
      );

      if (!response.ok) {
        throw new Error("Weather data not found");
      }

      const data = await response.json();
      setWeatherData(data);

      // Save to localStorage
      localStorage.setItem("weatherApiKey", keyToUse);
      localStorage.setItem("weatherLocation", locationToUse);
      localStorage.setItem("lastWeatherUpdate", new Date().toISOString());

      setShowSetup(false);
      toast.success("Weather data updated successfully");
      console.log("Weather data fetched and cached:", data);
    } catch (error) {
      console.error("Error fetching weather data:", error);
      toast.error(
        "Failed to fetch weather data. Please check your API key and location."
      );
      setShowSetup(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeWeather = async () => {
      const savedApiKey = localStorage.getItem("weatherApiKey");
      const savedLocation =
        localStorage.getItem("weatherLocation") || "Jakarta";
      const lastUpdate = localStorage.getItem("lastWeatherUpdate");

      console.log("Initializing weather with saved data:", {
        savedApiKey: !!savedApiKey,
        savedLocation,
        lastUpdate,
      });

      if (savedApiKey) {
        setApiKey(savedApiKey);
        setLocation(savedLocation);

        // Check if data is older than 1 hour, then fetch new data
        const shouldUpdate =
          !lastUpdate ||
          new Date().getTime() - new Date(lastUpdate).getTime() >
            60 * 60 * 1000;

        if (shouldUpdate) {
          console.log("Auto-fetching weather data...");
          await fetchWeatherData(savedApiKey, savedLocation);
        } else {
          console.log("Weather data is recent, skipping auto-fetch");
        }
      } else {
        console.log("No saved API key found, showing setup");
        setShowSetup(true);
      }
    };

    initializeWeather();

    // Auto-refresh weather data every hour
    const weatherInterval = setInterval(() => {
      const savedApiKey = localStorage.getItem("weatherApiKey");
      const savedLocation =
        localStorage.getItem("weatherLocation") || "Jakarta";

      if (savedApiKey) {
        console.log("Auto-refreshing weather data...");
        fetchWeatherData(savedApiKey, savedLocation);
      }
    }, 60 * 60 * 1000); // 1 hour

    return () => {
      clearInterval(weatherInterval);
    };
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  };

  const getIrrigationRecommendation = (
    forecast: WeatherData["forecast"]["forecastday"]
  ) => {
    const rainChance = forecast[0]?.day.daily_chance_of_rain || 0;
    const humidity = forecast[0]?.day.avghumidity || 0;

    if (rainChance > 70) {
      return {
        message: "Heavy rain expected - reduce irrigation",
        color: "text-blue-600",
        action: "Skip scheduled watering",
      };
    } else if (rainChance > 40) {
      return {
        message: "Light rain possible - monitor soil moisture",
        color: "text-yellow-600",
        action: "Reduce watering duration",
      };
    } else if (humidity < 30) {
      return {
        message: "Low humidity - increase irrigation",
        color: "text-orange-600",
        action: "Extend watering time",
      };
    } else {
      return {
        message: "Normal conditions - maintain regular schedule",
        color: "text-green-600",
        action: "Continue as planned",
      };
    }
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Weather Forecast
          </h1>
          <p className="text-muted-foreground">
            3-day weather forecast for irrigation planning
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => fetchWeatherData()} disabled={loading}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            {loading ? "Loading..." : "Refresh"}
          </Button>
          <Button variant="outline" onClick={() => setShowSetup(!showSetup)}>
            Settings
          </Button>
        </div>
      </div>

      {/* API Configuration */}
      {showSetup && (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Weather API Configuration</CardTitle>
            <CardDescription>
              Configure your WeatherAPI settings. Get your free API key from{" "}
              <a
                href="https://www.weatherapi.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                weatherapi.com
              </a>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your WeatherAPI key"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City name or coordinates"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => fetchWeatherData()}
                disabled={loading}
                className="flex-1"
              >
                {loading ? "Loading..." : "Save & Get Weather Data"}
              </Button>
              <Button variant="outline" onClick={() => setShowSetup(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {weatherData && (
        <>
          {/* Current Weather */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Current Weather - {weatherData.location.name},{" "}
                {weatherData.location.country}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-center gap-3">
                  {getWeatherIcon(weatherData.current.condition.text)}
                  <div>
                    <p className="text-2xl font-bold">
                      {weatherData.current.temp_c}°C
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {weatherData.current.condition.text}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Droplets className="h-6 w-6 text-blue-500" />
                  <div>
                    <p className="font-semibold">
                      {weatherData.current.humidity}%
                    </p>
                    <p className="text-sm text-muted-foreground">Humidity</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Wind className="h-6 w-6 text-gray-500" />
                  <div>
                    <p className="font-semibold">
                      {weatherData.current.wind_kph} km/h
                    </p>
                    <p className="text-sm text-muted-foreground">Wind Speed</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Gauge className="h-6 w-6 text-orange-500" />
                  <div>
                    <p className="font-semibold">
                      {weatherData.current.pressure_mb} mb
                    </p>
                    <p className="text-sm text-muted-foreground">Pressure</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Irrigation Recommendation */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-primary">
                Irrigation Recommendation
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const recommendation = getIrrigationRecommendation(
                  weatherData.forecast.forecastday
                );
                return (
                  <div className="space-y-2">
                    <p className={`font-semibold ${recommendation.color}`}>
                      {recommendation.message}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Recommended action: {recommendation.action}
                    </p>
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* 3-Day Forecast */}
          <div className="grid gap-4 md:grid-cols-3">
            {weatherData.forecast.forecastday.map((day, index) => (
              <Card key={day.date}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {index === 0 ? "Today" : formatDate(day.date)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    {getWeatherIcon(day.day.condition.text)}
                    <div className="text-right">
                      <p className="text-xl font-bold">{day.day.maxtemp_c}°C</p>
                      <p className="text-sm text-muted-foreground">
                        {day.day.mintemp_c}°C
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-center text-muted-foreground">
                    {day.day.condition.text}
                  </p>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Rain Chance:</span>
                      <Badge
                        variant={
                          day.day.daily_chance_of_rain > 50
                            ? "default"
                            : "secondary"
                        }
                      >
                        {day.day.daily_chance_of_rain}%
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Humidity:</span>
                      <span className="font-medium">
                        {day.day.avghumidity}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Max Wind:</span>
                      <span className="font-medium">
                        {day.day.maxwind_kph} km/h
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {!weatherData && !showSetup && !loading && (
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground mb-4">
              No weather data available
            </p>
            <Button onClick={() => setShowSetup(true)}>
              Configure Weather API
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Weather;
