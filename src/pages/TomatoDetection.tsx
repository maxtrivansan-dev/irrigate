import React, { useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Camera,
  Upload,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Eye,
  BarChart3,
  Zap,
} from "lucide-react";

// Import dari file utils
import {
  DetectionResult,
  AnalysisResult,
  modelPresets,
  colorSchemes,
  toast,
  captureFromCamera,
  analyzeImageWithRoboflow,
  drawBoundingBoxes,
  getRipenessStats,
} from "@/lib/fruitDetection";

const FruitDetection = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [roboflowApiKey, setRoboflowApiKey] = useState("");
  const [selectedModel, setSelectedModel] = useState("tomato");
  const [projectId, setProjectId] = useState("tomato-oigp9");
  const [modelVersion, setModelVersion] = useState("1");
  const [cameraIP, setCameraIP] = useState("192.168.1.100");
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult | null>(
    null
  );
  const [detectionHistory, setDetectionHistory] = useState<DetectionResult[]>(
    []
  );
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentPreset =
    modelPresets[selectedModel as keyof typeof modelPresets];

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    const preset = modelPresets[model as keyof typeof modelPresets];
    if (preset) {
      setProjectId(preset.projectId);
      setModelVersion(preset.version);
      if (preset.apiKey) {
        setRoboflowApiKey(preset.apiKey);
      }
    }
    setAnalysisResults(null);
  };

  const handleCaptureFromCamera = async () => {
    try {
      const imageUrl = await captureFromCamera(cameraIP);
      setCurrentImage(imageUrl);
      toast.success("Image captured from ESP32 CAM");
    } catch (error) {
      console.error("Error capturing image:", error);
      toast.error("Failed to capture image from camera");
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCurrentImage(e.target?.result as string);
        toast.success("Image uploaded successfully");
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!currentImage || !roboflowApiKey || !projectId) {
      toast.error("Please provide image, API key, and project ID");
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await analyzeImageWithRoboflow(
        currentImage,
        roboflowApiKey,
        projectId,
        modelVersion
      );

      setAnalysisResults(result);

      const newDetections = result.predictions.map((pred) => ({
        ...pred,
        timestamp: new Date().toISOString(),
      }));
      setDetectionHistory((prev) => [...newDetections, ...prev].slice(0, 50));

      toast.success(
        `Analysis complete! Found ${result.predictions.length} detections`
      );

      if (canvasRef.current && currentImage) {
        drawBoundingBoxes(canvasRef.current, currentImage, result.predictions);
      }
    } catch (error) {
      console.error("Error analyzing image:", error);
      toast.error(
        `Failed to analyze image: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const ripenessStats = analysisResults
    ? getRipenessStats(analysisResults.predictions)
    : null;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {currentPreset?.name} Detection
          </h1>
          <p className="text-muted-foreground">
            AI-powered {selectedModel} maturity analysis using ESP32 CAM
          </p>
        </div>
        <Badge
          variant={analysisResults ? "default" : "secondary"}
          className="px-3 py-1"
        >
          {analysisResults
            ? `${analysisResults.predictions.length} Detected`
            : "Ready"}
        </Badge>
      </div>

      <Tabs defaultValue="detection" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="detection">Detection</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="detection" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Image Source
              </CardTitle>
              <CardDescription>
                Capture from ESP32 CAM or upload an image file
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <Button
                  onClick={handleCaptureFromCamera}
                  disabled={isAnalyzing}
                  className="flex-1"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Capture from ESP32 CAM
                </Button>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  disabled={isAnalyzing}
                  className="flex-1"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Image
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              <div className="relative">
                {currentImage ? (
                  <div className="space-y-4">
                    <div className="relative">
                      <img
                        src={currentImage}
                        alt="Fruit analysis"
                        className="w-full max-h-96 object-contain rounded-lg border"
                      />
                      <canvas
                        ref={canvasRef}
                        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                        style={{ display: analysisResults ? "block" : "none" }}
                      />
                    </div>
                    <Button
                      onClick={analyzeImage}
                      disabled={isAnalyzing || !roboflowApiKey || !projectId}
                      className="w-full"
                    >
                      {isAnalyzing ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 mr-2" />
                          Analyze {currentPreset?.name}
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 bg-muted rounded-lg border-2 border-dashed">
                    <Camera className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-center">
                      Capture an image from ESP32 CAM or upload a file to start
                      analysis
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          {analysisResults ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Detection Summary
                    </CardTitle>
                    <CardDescription>
                      Total {analysisResults.predictions.length} fruit(s)
                      detected
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {ripenessStats && (
                      <div className="grid grid-cols-2 gap-4">
                        {Object.entries(ripenessStats).map(
                          ([className, count]) => {
                            const colorScheme =
                              colorSchemes[className.toLowerCase()] ||
                              colorSchemes.tomato;

                            return (
                              <div
                                key={className}
                                className={`text-center p-4 rounded-lg border-2 ${colorScheme.bg} ${colorScheme.border}`}
                              >
                                <div className="text-3xl font-bold mb-1">
                                  {count}
                                </div>
                                <div className="text-sm font-medium capitalize">
                                  {className}
                                </div>
                                <div className="text-xs opacity-75 mt-1">
                                  {(
                                    (count /
                                      analysisResults.predictions.length) *
                                    100
                                  ).toFixed(1)}
                                  %
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {analysisResults.time && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Processing Time
                        </span>
                        <Badge variant="outline">
                          {analysisResults.time.toFixed(0)}ms
                        </Badge>
                      </div>
                    )}
                    {analysisResults.inference_time && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Inference Time
                        </span>
                        <Badge variant="outline">
                          {analysisResults.inference_time.toFixed(0)}ms
                        </Badge>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Total Objects
                      </span>
                      <Badge>{analysisResults.predictions.length}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Avg Confidence
                      </span>
                      <Badge variant="secondary">
                        {analysisResults.predictions.length > 0
                          ? (
                              (analysisResults.predictions.reduce(
                                (sum, pred) => sum + pred.confidence,
                                0
                              ) /
                                analysisResults.predictions.length) *
                              100
                            ).toFixed(1)
                          : 0}
                        %
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Detailed Detection Results
                  </CardTitle>
                  <CardDescription>
                    Individual detection details with confidence scores and
                    coordinates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {analysisResults.predictions.length > 0 ? (
                    <div className="space-y-3">
                      {analysisResults.predictions
                        .sort((a, b) => b.confidence - a.confidence)
                        .map((pred, index) => {
                          const colorScheme =
                            colorSchemes[pred.class.toLowerCase()] ||
                            colorSchemes.tomato;

                          return (
                            <div
                              key={index}
                              className={`p-4 rounded-lg border-2 ${colorScheme.bg} ${colorScheme.border}`}
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-2">
                                    <div className="text-sm font-medium text-muted-foreground">
                                      #{index + 1}
                                    </div>
                                    <Badge
                                      variant="outline"
                                      className={`capitalize ${colorScheme.text} border-current`}
                                    >
                                      {pred.class}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`text-sm font-medium ${colorScheme.text}`}
                                  >
                                    {(pred.confidence * 100).toFixed(1)}%
                                    confident
                                  </span>
                                  <Progress
                                    value={pred.confidence * 100}
                                    className="w-20"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-muted-foreground">
                                <div>
                                  <span className="font-medium">Center X:</span>{" "}
                                  {Math.round(pred.x)}
                                  px
                                </div>
                                <div>
                                  <span className="font-medium">Center Y:</span>{" "}
                                  {Math.round(pred.y)}
                                  px
                                </div>
                                <div>
                                  <span className="font-medium">Width:</span>{" "}
                                  {Math.round(pred.width)}px
                                </div>
                                <div>
                                  <span className="font-medium">Height:</span>{" "}
                                  {Math.round(pred.height)}px
                                </div>
                              </div>

                              <div className="mt-3 pt-3 border-t border-current/10">
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-1">
                                    {pred.confidence >= 0.8 ? (
                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                    ) : pred.confidence >= 0.6 ? (
                                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                                    ) : (
                                      <AlertCircle className="h-4 w-4 text-red-600" />
                                    )}
                                    <span className="text-xs font-medium">
                                      {pred.confidence >= 0.8
                                        ? "High Confidence"
                                        : pred.confidence >= 0.6
                                        ? "Medium Confidence"
                                        : "Low Confidence"}
                                    </span>
                                  </div>
                                  <div className="text-xs">
                                    Area:{" "}
                                    {Math.round(
                                      pred.width * pred.height
                                    ).toLocaleString()}
                                    px²
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                      <Eye className="h-8 w-8 mb-2 opacity-50" />
                      <p>No fruits detected in the image</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <div className="text-center space-y-3">
                  <Eye className="h-16 w-16 mx-auto opacity-50" />
                  <div>
                    <h3 className="text-lg font-medium">No Analysis Results</h3>
                    <p className="text-sm">
                      Upload an image and run analysis to see results here
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Detection History
              </CardTitle>
              <CardDescription>
                Recent fruit maturity detections ({detectionHistory.length}/50)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {detectionHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                  <div className="text-center space-y-3">
                    <BarChart3 className="h-16 w-16 mx-auto opacity-50" />
                    <div>
                      <h3 className="text-lg font-medium">
                        No Detection History
                      </h3>
                      <p className="text-sm">
                        Detection results will appear here after analysis
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {detectionHistory.map((detection, index) => {
                    const colorScheme =
                      colorSchemes[detection.class.toLowerCase()] ||
                      colorSchemes.tomato;

                    return (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border-2 ${colorScheme.bg} ${colorScheme.border}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className={`capitalize ${colorScheme.text} border-current`}
                              >
                                {detection.class}
                              </Badge>
                              <div className="flex items-center gap-1">
                                {detection.confidence >= 0.8 ? (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : detection.confidence >= 0.6 ? (
                                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 text-red-600" />
                                )}
                                <span
                                  className={`text-sm font-medium ${colorScheme.text}`}
                                >
                                  {(detection.confidence * 100).toFixed(1)}%
                                  confident
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">
                              {detection.timestamp &&
                                new Date(detection.timestamp).toLocaleString()}
                            </div>
                            <Progress
                              value={detection.confidence * 100}
                              className="w-20 mt-1"
                            />
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-current/10">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-muted-foreground">
                            <div>
                              <span className="font-medium">Position:</span> (
                              {Math.round(detection.x)},{" "}
                              {Math.round(detection.y)})
                            </div>
                            <div>
                              <span className="font-medium">Size:</span>{" "}
                              {Math.round(detection.width)}×
                              {Math.round(detection.height)}
                            </div>
                            <div>
                              <span className="font-medium">Area:</span>{" "}
                              {Math.round(
                                detection.width * detection.height
                              ).toLocaleString()}
                              px²
                            </div>
                            <div>
                              <span className="font-medium">Quality:</span>
                              {detection.confidence >= 0.8
                                ? " High"
                                : detection.confidence >= 0.6
                                ? " Medium"
                                : " Low"}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {detectionHistory.length >= 50 && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Showing latest 50 detections. Older entries are
                        automatically removed.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Roboflow Configuration</CardTitle>
                <CardDescription>
                  Configure your Roboflow Universe model
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="model-select">Select Model</Label>
                  <select
                    id="model-select"
                    value={selectedModel}
                    onChange={(e) => handleModelChange(e.target.value)}
                    className="w-full p-2 border rounded-md bg-background"
                  >
                    {Object.entries(modelPresets).map(([key, preset]) => (
                      <option key={key} value={key}>
                        {preset.name} - {preset.description}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Current: {currentPreset?.name}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="api-key">Roboflow API Key</Label>
                  <Input
                    id="api-key"
                    type="password"
                    value={roboflowApiKey}
                    onChange={(e) => setRoboflowApiKey(e.target.value)}
                    placeholder="Enter your Roboflow API key"
                  />
                  {currentPreset?.apiKey && (
                    <p className="text-xs text-green-600">
                      ✓ API Key sudah terisi otomatis untuk model{" "}
                      {currentPreset.name}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project-id">Project ID</Label>
                  <Input
                    id="project-id"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    placeholder="tomato-oigp9"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model-version">Model Version</Label>
                  <Input
                    id="model-version"
                    value={modelVersion}
                    onChange={(e) => setModelVersion(e.target.value)}
                    placeholder="1"
                  />
                </div>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p>
                        Current endpoint: https://serverless.roboflow.com/
                        {projectId}/{modelVersion}
                      </p>
                      <p className="text-xs">
                        Selected model: <strong>{currentPreset?.name}</strong>
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ESP32 CAM Settings</CardTitle>
                <CardDescription>
                  Configure ESP32 CAM connection
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="camera-ip">ESP32 CAM IP Address</Label>
                  <Input
                    id="camera-ip"
                    value={cameraIP}
                    onChange={(e) => setCameraIP(e.target.value)}
                    placeholder="192.168.1.100"
                  />
                </div>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Make sure your ESP32 CAM is connected to the same network
                    and accessible via HTTP.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You'll need a Roboflow Universe account and a trained fruit
              maturity detection model. Visit{" "}
              <a
                href="https://universe.roboflow.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Roboflow Universe
              </a>{" "}
              to get started.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FruitDetection;
