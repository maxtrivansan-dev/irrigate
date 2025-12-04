import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Camera,
  CameraOff,
  Download,
  RefreshCw,
  Maximize2,
  Wifi,
  WifiOff,
  AlertCircle,
  Settings,
} from "lucide-react";

const LandMonitoring = () => {
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [autoCapture, setAutoCapture] = useState(false);
  const [captureInterval, setCaptureInterval] = useState(30);
  const [cameraIP, setCameraIP] = useState("192.168.1.112");
  const [snapshots, setSnapshots] = useState<string[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "disconnected" | "connecting" | "connected" | "error"
  >("disconnected");
  const [lastError, setLastError] = useState<string>("");
  const [showSettings, setShowSettings] = useState(false);
  const videoRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamTimeoutRef = useRef<NodeJS.Timeout>();

  // Test connection to ESP32-CAM
  const testConnection = async (ip: string) => {
    try {
      setConnectionStatus("connecting");
      setLastError("");

      const response = await fetch(`http://${ip}/test`, {
        method: "GET",
        mode: "no-cors",
        cache: "no-cache",
      });

      setConnectionStatus("connected");
      return true;
    } catch (error) {
      console.error("Connection test failed:", error);
      setConnectionStatus("error");
      setLastError(
        `Cannot connect to ${ip}. Make sure ESP32-CAM is powered on and connected to the same network.`
      );
      return false;
    }
  };

  // Start/Stop camera stream
  const toggleStream = async () => {
    if (isStreamActive) {
      setIsStreamActive(false);
      setConnectionStatus("disconnected");
      if (streamTimeoutRef.current) {
        clearTimeout(streamTimeoutRef.current);
      }
    } else {
      const connected = await testConnection(cameraIP);
      if (connected) {
        setIsStreamActive(true);
        streamTimeoutRef.current = setTimeout(() => {
          if (videoRef.current && !videoRef.current.complete) {
            setLastError(
              "Stream failed to load. Check ESP32-CAM configuration."
            );
            setConnectionStatus("error");
          }
        }, 5000);
      }
    }
  };

  // Capture snapshot
  const captureSnapshot = async () => {
    try {
      // Method 1: Try to fetch from /snapshot endpoint (returns base64)
      try {
        const response = await fetch(`http://${cameraIP}/snapshot`, {
          method: "GET",
          mode: "cors",
        });

        if (response.ok) {
          const data = await response.json();
          if (data.status === "success" && data.image) {
            setSnapshots((prev) => [...prev, data.image]);
            return;
          }
        }
      } catch (corsError) {
        console.log("CORS snapshot failed, trying alternative method");
      }

      // Method 2: Create a hidden img element to capture
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        if (canvasRef.current) {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            ctx.drawImage(img, 0, 0);

            const dataURL = canvas.toDataURL("image/jpeg", 0.8);
            setSnapshots((prev) => [...prev, dataURL]);
          }
        }
      };

      img.onerror = () => {
        setLastError("Failed to capture snapshot. CORS or network issue.");
      };

      img.src = `http://${cameraIP}/capture?t=${Date.now()}`;
    } catch (error) {
      console.error("Snapshot capture failed:", error);
      setLastError("Snapshot capture failed");
    }
  };

  // Download snapshot
  const downloadSnapshot = (dataURL: string, index: number) => {
    const link = document.createElement("a");
    link.href = dataURL;
    link.download = `land-monitoring-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Auto-capture effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoCapture && isStreamActive && connectionStatus === "connected") {
      interval = setInterval(() => {
        captureSnapshot();
      }, captureInterval * 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoCapture, isStreamActive, captureInterval, connectionStatus]);

  // Stream URL
  const getStreamURL = () => {
    return `http://${cameraIP}/stream?t=${Date.now()}`;
  };

  // Handle stream load success
  const handleStreamLoad = () => {
    setConnectionStatus("connected");
    setLastError("");
    if (streamTimeoutRef.current) {
      clearTimeout(streamTimeoutRef.current);
    }
  };

  // Handle stream load error
  const handleStreamError = () => {
    setConnectionStatus("error");
    setLastError(
      "Failed to load camera stream. Check network connection and ESP32-CAM status."
    );
    setIsStreamActive(false);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white-800">
              Land Monitoring
            </h1>
            <p className="text-white-600 mt-2">
              Real-time monitoring with ESP32 CAM
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge
              variant={
                connectionStatus === "connected"
                  ? "default"
                  : connectionStatus === "connecting"
                  ? "secondary"
                  : "destructive"
              }
              className="px-4 py-2"
            >
              {connectionStatus === "connected" && isStreamActive && (
                <Wifi className="w-4 h-4 mr-2" />
              )}
              {connectionStatus === "error" && (
                <WifiOff className="w-4 h-4 mr-2" />
              )}
              {connectionStatus === "connected" && isStreamActive
                ? "🟢 LIVE"
                : connectionStatus === "connecting"
                ? "🟡 CONNECTING"
                : connectionStatus === "error"
                ? "🔴 ERROR"
                : "⚫ OFFLINE"}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Connection Error Alert */}
        {lastError && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-800">Connection Error</h4>
                  <p className="text-sm text-red-600 mt-1">{lastError}</p>
                  <div className="mt-3 text-xs text-red-600">
                    <p>
                      <strong>Troubleshooting:</strong>
                    </p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>
                        Make sure ESP32-CAM is powered on and connected to WiFi
                      </li>
                      <li>
                        Check if you can access http://{cameraIP} directly in
                        browser
                      </li>
                      <li>Ensure both devices are on the same network</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Settings Panel */}
        {showSettings && (
          <Card>
            <CardHeader>
              <CardTitle>⚙️ Camera Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="camera-ip">📡 Camera IP Address</Label>
                  <Input
                    id="camera-ip"
                    value={cameraIP}
                    onChange={(e) => setCameraIP(e.target.value)}
                    placeholder="192.168.1.100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capture-interval">
                    ⏱️ Auto Capture Interval (seconds)
                  </Label>
                  <Input
                    id="capture-interval"
                    type="number"
                    min="5"
                    max="300"
                    value={captureInterval}
                    onChange={(e) => setCaptureInterval(Number(e.target.value))}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={() => testConnection(cameraIP)}
                    disabled={connectionStatus === "connecting"}
                    className="w-full"
                  >
                    {connectionStatus === "connecting" ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <Wifi className="w-4 h-4 mr-2" />
                        Test Connection
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Live Feed - Main Column */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    📹 Live Camera Feed
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsFullscreen(!isFullscreen)}
                      disabled={!isStreamActive}
                    >
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={captureSnapshot}
                      disabled={
                        !isStreamActive || connectionStatus !== "connected"
                      }
                    >
                      <Camera className="h-4 w-4" />
                      📸
                    </Button>
                    <Button
                      onClick={toggleStream}
                      variant={isStreamActive ? "destructive" : "default"}
                      size="sm"
                      disabled={connectionStatus === "connecting"}
                    >
                      {isStreamActive ? (
                        <CameraOff className="h-4 w-4" />
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                      {connectionStatus === "connecting"
                        ? "Connecting..."
                        : isStreamActive
                        ? "Stop"
                        : "Start"}
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`relative ${
                    isFullscreen
                      ? "fixed inset-0 z-50 bg-black flex items-center justify-center"
                      : ""
                  }`}
                >
                  {isStreamActive ? (
                    <div className="relative">
                      <img
                        ref={videoRef}
                        src={getStreamURL()}
                        alt="ESP32 CAM Live Feed"
                        className="w-full h-auto rounded-lg shadow-lg"
                        onLoad={handleStreamLoad}
                        onError={handleStreamError}
                      />
                      {connectionStatus === "connected" && (
                        <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium animate-pulse">
                          🔴 LIVE
                        </div>
                      )}
                      {connectionStatus === "connecting" && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                          <div className="text-white text-center">
                            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                            <p>Connecting to camera...</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-80 bg-gray-100 rounded-lg">
                      <CameraOff className="h-16 w-16 text-gray-400 mb-4" />
                      <p className="text-gray-600 text-lg">
                        📴 Camera stream is offline
                      </p>
                      <p className="text-sm text-gray-500 text-center mt-2">
                        Click start to begin monitoring
                        <br />
                        <strong>IP:</strong> {cameraIP}
                      </p>
                    </div>
                  )}

                  {isFullscreen && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-4 right-4"
                      onClick={() => setIsFullscreen(false)}
                    >
                      Exit Fullscreen
                    </Button>
                  )}
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="auto-capture"
                        checked={autoCapture}
                        onCheckedChange={setAutoCapture}
                      />
                      <Label htmlFor="auto-capture">
                        🤖 Auto Capture ({captureInterval}s)
                      </Label>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    📊 Status: {connectionStatus} | 📍 IP: {cameraIP}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">📈 Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">📸 Snapshots</span>
                  <span className="font-bold text-lg">{snapshots.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">🔗 Connection</span>
                  <span
                    className={`font-bold text-sm ${
                      connectionStatus === "connected"
                        ? "text-green-600"
                        : connectionStatus === "connecting"
                        ? "text-yellow-600"
                        : connectionStatus === "error"
                        ? "text-red-600"
                        : "text-gray-600"
                    }`}
                  >
                    {connectionStatus.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">🤖 Auto Capture</span>
                  <span className="font-bold text-sm">
                    {autoCapture ? "✅ ON" : "❌ OFF"}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Recent Snapshots */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg">
                  📷 Recent Snapshots
                  {snapshots.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSnapshots([])}
                    >
                      Clear All
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {snapshots.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                    <Camera className="h-8 w-8 mb-2" />
                    <p>No snapshots yet</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {snapshots
                      .slice(-5)
                      .reverse()
                      .map((snapshot, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={snapshot}
                            alt={`Snapshot ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => window.open(snapshot, "_blank")}
                          />
                          <Button
                            size="sm"
                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => downloadSnapshot(snapshot, index)}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                          <div className="absolute bottom-1 left-1 bg-black/75 text-white px-2 py-0.5 rounded text-xs">
                            #{snapshots.length - index}
                          </div>
                        </div>
                      ))}
                    {snapshots.length > 5 && (
                      <p className="text-xs text-center text-gray-500">
                        Showing latest 5 of {snapshots.length} snapshots
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Hidden canvas for snapshot capture */}
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
};

export default LandMonitoring;
