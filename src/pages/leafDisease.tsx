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
  Leaf,
  Activity,
} from "lucide-react";

// Types
interface DetectionResult {
  confidence: number;
  class: string;
  x: number;
  y: number;
  width: number;
  height: number;
  timestamp?: string;
}

interface AnalysisResult {
  predictions: DetectionResult[];
  time?: number;
  inference_time?: number;
  image?: {
    width: number;
    height: number;
  };
}

interface ModelPreset {
  name: string;
  projectId: string;
  version: string;
  apiKey: string;
  classes: string[];
  description: string;
}

// Model Presets
const modelPresets: Record<string, ModelPreset> = {
  tomato: {
    name: "Tomato Diseases",
    projectId: "leaf-tomato-0lvzm",
    version: "1",
    apiKey: "q4UPgFhZpQTxmloM5WA9",
    classes: ["Early Blight", "Late Blight", "Leaf Mold", "Healthy"],
    description: "Deteksi penyakit tomat",
  },
  potato: {
    name: "Potato Diseases",
    projectId: "potato-leaf-disease-3tpo3",
    version: "3",
    apiKey: "q4UPgFhZpQTxmloM5WA9",
    classes: [
      "Bacteria",
      "Fungi",
      "Healthy",
      "Nematode",
      "Pest",
      "Phytopthora",
      "Virus",
    ],
    description: "Deteksi penyakit kentang (7 kelas)",
  },
  corn: {
    name: "Cassava Diseases",
    projectId: "cassava-classification",
    version: "4",
    apiKey: "q4UPgFhZpQTxmloM5WA9",
    classes: ["CBB", "CBSD", "CGM", "CMD", "Healthy"],
    description: "Deteksi penyakit singkong (cassava)",
  },
  rice: {
    name: "Corn Diseases",
    projectId: "dr.mangosteen",
    version: "1",
    apiKey: "q4UPgFhZpQTxmloM5WA9",
    classes: ["Blight", "Common_Rust", "Gray_Leaf_Spot", "Healthy"],
    description: "Deteksi penyakit jagung (corn)",
  },
};

// Color Schemes
const colorSchemes: Record<
  string,
  { bg: string; border: string; text: string }
> = {
  healthy: {
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-700",
  },
  "early blight": {
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-700",
  },
  "late blight": {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
  },
  "leaf mold": {
    bg: "bg-purple-50",
    border: "border-purple-200",
    text: "text-purple-700",
  },
  "common rust": {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
  },
  "gray leaf spot": {
    bg: "bg-gray-50",
    border: "border-gray-200",
    text: "text-gray-700",
  },
  blight: {
    bg: "bg-rose-50",
    border: "border-rose-200",
    text: "text-rose-700",
  },
  "bacterial blight": {
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    text: "text-yellow-700",
  },
  blast: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
  },
  "brown spot": {
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-700",
  },
  cbb: {
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-700",
  },
  cbsd: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
  },
  cgm: {
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    text: "text-yellow-700",
  },
  cmd: {
    bg: "bg-purple-50",
    border: "border-purple-200",
    text: "text-purple-700",
  },
  common_rust: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
  },
  gray_leaf_spot: {
    bg: "bg-gray-50",
    border: "border-gray-200",
    text: "text-gray-700",
  },
};

const boundingBoxColors: Record<string, string> = {
  healthy: "#22c55e",
  "early blight": "#fb923c",
  "late blight": "#ef4444",
  "leaf mold": "#9333ea",
  "common rust": "#f59e0b",
  "gray leaf spot": "#6b7280",
  blight: "#f43f5e",
  "bacterial blight": "#eab308",
  blast: "#dc2626",
  "brown spot": "#ea580c",
  cbb: "#fb923c",
  cbsd: "#ef4444",
  cgm: "#eab308",
  cmd: "#9333ea",
  common_rust: "#f59e0b",
  gray_leaf_spot: "#6b7280",
};

// Tambahkan object untuk saran penanganan setelah boundingBoxColors
const diseaseTreatments: Record<
  string,
  { description: string; treatments: string[] }
> = {
  "early blight": {
    description:
      "Penyakit jamur yang menyebabkan bercak coklat dengan cincin konsentris pada daun",
    treatments: [
      "Buang dan musnahkan daun yang terinfeksi",
      "Aplikasikan fungisida berbasis tembaga atau chlorothalonil",
      "Jaga jarak tanam untuk sirkulasi udara yang baik",
      "Hindari penyiraman dari atas, siram di pangkal tanaman",
      "Rotasi tanaman setiap musim tanam",
    ],
  },
  "late blight": {
    description:
      "Penyakit jamur berbahaya yang dapat merusak seluruh tanaman dalam waktu singkat",
    treatments: [
      "SEGERA buang tanaman yang terinfeksi berat",
      "Aplikasikan fungisida systemik (metalaxyl atau mancozeb)",
      "Tingkatkan drainase dan kurangi kelembaban",
      "Hindari penyiraman di malam hari",
      "Gunakan varietas tahan penyakit",
    ],
  },
  "leaf mold": {
    description:
      "Jamur yang tumbuh di permukaan bawah daun, sering terjadi di greenhouse",
    treatments: [
      "Tingkatkan ventilasi dan sirkulasi udara",
      "Kurangi kelembaban dengan pengaturan penyiraman",
      "Aplikasikan fungisida berbasis tembaga",
      "Buang daun yang terinfeksi parah",
      "Jaga jarak antar tanaman",
    ],
  },
  "common rust": {
    description:
      "Penyakit karat yang menyebabkan pustula berwarna kuning-coklat pada daun",
    treatments: [
      "Aplikasikan fungisida berbasis azoxystrobin",
      "Buang sisa tanaman yang terinfeksi",
      "Gunakan varietas resisten karat",
      "Rotasi tanaman dengan non-host",
      "Jaga kebersihan lahan dari gulma",
    ],
  },
  "gray leaf spot": {
    description:
      "Bercak abu-abu persegi panjang pada daun yang dapat mengurangi hasil panen",
    treatments: [
      "Rotasi tanaman minimal 2 tahun",
      "Aplikasikan fungisida triazole atau strobilurin",
      "Pengelolaan residu tanaman dengan baik",
      "Gunakan benih bersertifikat bebas penyakit",
      "Hindari penanaman terlalu rapat",
    ],
  },
  blight: {
    description: "Penyakit layu yang menyerang daun dan batang tanaman",
    treatments: [
      "Isolasi tanaman yang terinfeksi",
      "Aplikasikan fungisida broad-spectrum",
      "Perbaiki drainase tanah",
      "Sanitasi alat pertanian sebelum digunakan",
      "Gunakan mulsa untuk mencegah percikan air tanah",
    ],
  },
  "bacterial blight": {
    description:
      "Infeksi bakteri yang menyebabkan bercak basah dan layu pada daun",
    treatments: [
      "Aplikasikan bakterisida berbasis tembaga",
      "Buang dan musnahkan tanaman terinfeksi",
      "Hindari pelukaan pada tanaman",
      "Jangan bekerja saat tanaman basah",
      "Gunakan benih bebas patogen",
    ],
  },
  blast: {
    description:
      "Penyakit jamur yang menyebabkan bercak diamond-shaped pada daun",
    treatments: [
      "Aplikasikan fungisida tricyclazole atau azoxystrobin",
      "Kelola pemupukan nitrogen dengan tepat",
      "Gunakan varietas tahan blast",
      "Atur sistem irigasi untuk mengurangi kelembaban daun",
      "Rotasi tanaman dan pengelolaan jerami",
    ],
  },
  "brown spot": {
    description: "Bercak coklat bundar pada daun yang disebabkan oleh jamur",
    treatments: [
      "Perbaiki nutrisi tanah, terutama silika",
      "Aplikasikan fungisida mancozeb atau benomyl",
      "Kelola air irigasi dengan baik",
      "Gunakan benih sehat dan bersertifikat",
      "Jaga kebersihan lahan dari sisa tanaman",
    ],
  },
  cbb: {
    description: "Cassava Bacterial Blight - penyakit bakteri pada singkong",
    treatments: [
      "Gunakan stek dari tanaman sehat",
      "Buang dan bakar tanaman terinfeksi",
      "Aplikasikan bakterisida berbasis tembaga",
      "Sanitasi alat pemangkasan",
      "Tanam varietas tahan CBB",
    ],
  },
  cbsd: {
    description: "Cassava Brown Streak Disease - penyakit virus pada singkong",
    treatments: [
      "Gunakan stek bebas virus",
      "Kendalikan vektor whitefly dengan insektisida",
      "Tanam varietas toleran CBSD",
      "Roguing (buang tanaman sakit) secara rutin",
      "Hindari penanaman dekat tanaman terinfeksi",
    ],
  },
  cgm: {
    description: "Cassava Green Mite - tungau yang menyerang singkong",
    treatments: [
      "Aplikasikan akarisida atau sabun insektisida",
      "Gunakan musuh alami seperti predator tungau",
      "Jaga kelembaban tanaman dengan penyiraman",
      "Buang daun yang terserang berat",
      "Tanam varietas tahan tungau",
    ],
  },
  cmd: {
    description: "Cassava Mosaic Disease - penyakit virus mosaik pada singkong",
    treatments: [
      "Gunakan stek dari tanaman bebas CMD",
      "Kendalikan vektor whitefly",
      "Roguing tanaman terinfeksi segera",
      "Tanam varietas resisten CMD",
      "Jaga jarak dari sumber infeksi",
    ],
  },
  healthy: {
    description: "Tanaman dalam kondisi sehat tanpa tanda-tanda penyakit",
    treatments: [
      "Pertahankan praktik pemeliharaan yang baik",
      "Monitor rutin untuk deteksi dini penyakit",
      "Jaga nutrisi dan irigasi optimal",
      "Lakukan sanitasi kebun secara berkala",
      "Terapkan rotasi tanaman untuk pencegahan",
    ],
  },
  bacteria: {
    description: "Infeksi bakteri umum pada tanaman",
    treatments: [
      "Aplikasikan bakterisida berbasis tembaga",
      "Tingkatkan drainase dan sirkulasi udara",
      "Buang bagian tanaman yang terinfeksi",
      "Sanitasi alat pertanian",
      "Hindari penyiraman berlebihan",
    ],
  },
  fungi: {
    description: "Infeksi jamur pada tanaman",
    treatments: [
      "Aplikasikan fungisida sesuai jenis jamur",
      "Kurangi kelembaban dan tingkatkan sirkulasi udara",
      "Buang daun atau bagian tanaman terinfeksi",
      "Hindari penyiraman dari atas",
      "Jaga kebersihan area tanam",
    ],
  },
  nematode: {
    description: "Serangan nematoda pada sistem akar tanaman",
    treatments: [
      "Rotasi tanaman dengan tanaman non-host",
      "Aplikasikan nematisida atau biopestisida",
      "Gunakan mulsa organik",
      "Tanam tanaman perangkap nematoda (marigold)",
      "Solarisasi tanah sebelum tanam",
    ],
  },
  pest: {
    description: "Serangan hama serangga pada tanaman",
    treatments: [
      "Identifikasi jenis hama spesifik",
      "Aplikasikan insektisida sesuai jenis hama",
      "Gunakan perangkap atau penghalang fisik",
      "Terapkan pengendalian hayati dengan musuh alami",
      "Monitor dan tindak lanjut secara berkala",
    ],
  },
  phytopthora: {
    description: "Penyakit busuk yang disebabkan oleh Phytophthora",
    treatments: [
      "Perbaiki drainase tanah",
      "Aplikasikan fungisida metalaxyl atau fosetyl-Al",
      "Hindari genangan air",
      "Gunakan varietas tahan",
      "Tingkatkan guludan untuk drainase lebih baik",
    ],
  },
  virus: {
    description: "Infeksi virus pada tanaman",
    treatments: [
      "Buang dan musnahkan tanaman terinfeksi",
      "Kendalikan vektor serangga pembawa virus",
      "Gunakan benih atau bibit bebas virus",
      "Sanitasi alat pertanian",
      "Tanam varietas resisten virus",
    ],
  },
};

// Utility Functions
const toast = {
  success: (message: string) => console.log("Success:", message),
  error: (message: string) => console.error("Error:", message),
};

const convertImageToBase64 = async (imageUrl: string): Promise<string> => {
  if (imageUrl.startsWith("data:")) {
    return imageUrl.split(",")[1];
  }

  const response = await fetch(imageUrl);
  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const captureFromCamera = async (cameraIP: string): Promise<string> => {
  const response = await fetch(`http://${cameraIP}/capture`);
  if (!response.ok) throw new Error("Failed to capture image");

  const blob = await response.blob();
  return URL.createObjectURL(blob);
};

const analyzeImageWithRoboflow = async (
  imageUrl: string,
  roboflowApiKey: string,
  projectId: string,
  modelVersion: string
): Promise<AnalysisResult> => {
  const base64Image = await convertImageToBase64(imageUrl);
  const endpoint = `https://detect.roboflow.com/${projectId}/${modelVersion}`;

  const response = await fetch(
    `${endpoint}?api_key=${roboflowApiKey}&confidence=40&overlap=30`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: base64Image,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log("Full API Response:", result);

  // Transform predictions object to array format
  let predictionsArray = [];

  if (
    result.predictions &&
    typeof result.predictions === "object" &&
    !Array.isArray(result.predictions)
  ) {
    // Classification model - convert to array and sort by confidence
    predictionsArray = Object.entries(result.predictions)
      .map(([className, data]: [string, any]) => {
        const cleanClassName = className
          .replace(/^[^_]+___/, "")
          .replace(/_/g, " ");

        return {
          class: cleanClassName,
          confidence: data.confidence || data || 0,
          x: data.x || 0,
          y: data.y || 0,
          width: data.width || 0,
          height: data.height || 0,
        };
      })
      .filter((pred) => pred.confidence > 0.01) // Keep predictions > 1%
      .sort((a, b) => b.confidence - a.confidence); // Sort by confidence descending
  } else if (Array.isArray(result.predictions)) {
    predictionsArray = result.predictions;
  }

  result.predictions = predictionsArray;
  result.isClassification = predictionsArray.every(
    (p) => p.width === 0 && p.height === 0
  );
  console.log("Transformed predictions:", predictionsArray);
  console.log("Is Classification Model:", result.isClassification);

  return result;
};

interface AnalysisResult {
  predictions: DetectionResult[];
  time?: number;
  inference_time?: number;
  image?: {
    width: number;
    height: number;
  };
  isClassification?: boolean;
}

const drawBoundingBoxes = (
  canvas: HTMLCanvasElement,
  imageUrl: string,
  predictions: DetectionResult[]
) => {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const img = new Image();
  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    predictions.forEach((pred) => {
      if (!pred || !pred.class) return; // Skip invalid predictions

      const { x, y, width, height } = pred;
      const color = boundingBoxColors[pred.class.toLowerCase()] || "#3b82f6";

      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.strokeRect(x - width / 2, y - height / 2, width, height);

      ctx.fillStyle = color;
      ctx.font = "16px Arial";
      const label = `${pred.class} (${(pred.confidence * 100).toFixed(1)}%)`;
      const textWidth = ctx.measureText(label).width;

      ctx.fillRect(x - width / 2, y - height / 2 - 25, textWidth + 10, 25);
      ctx.fillStyle = "white";
      ctx.fillText(label, x - width / 2 + 5, y - height / 2 - 5);
    });
  };
  img.crossOrigin = "anonymous";
  img.src = imageUrl;
};

const getDiseaseStats = (
  predictions: DetectionResult[]
): Record<string, number> => {
  if (!Array.isArray(predictions)) {
    return {};
  }
  return predictions.reduce((acc, pred) => {
    if (pred && pred.class) {
      const className = pred.class.toLowerCase();
      acc[className] = (acc[className] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);
};

// Main Component
const PlantDiseaseDetection = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [roboflowApiKey, setRoboflowApiKey] = useState("");
  const [selectedModel, setSelectedModel] = useState("tomato");
  const [projectId, setProjectId] = useState("tomato-diseases");
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

      // Validasi predictions
      if (!result.predictions || !Array.isArray(result.predictions)) {
        result.predictions = [];
      }

      setAnalysisResults(result);

      const newDetections = result.predictions.map((pred) => ({
        ...pred,
        timestamp: new Date().toISOString(),
      }));
      setDetectionHistory((prev) => [...newDetections, ...prev].slice(0, 50));

      if (result.isClassification) {
        toast.success(
          `Classification complete! Found ${result.predictions.length} classes`
        );
      } else {
        toast.success(
          `Detection complete! Found ${result.predictions.length} detections`
        );

        // Only draw bounding boxes for detection models
        if (canvasRef.current && currentImage) {
          drawBoundingBoxes(
            canvasRef.current,
            currentImage,
            result.predictions
          );
        }
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

  const diseaseStats = analysisResults
    ? getDiseaseStats(analysisResults.predictions)
    : null;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Leaf className="h-8 w-8 text-green-600" />
            {currentPreset?.name} Detection
          </h1>
          <p className="text-muted-foreground">
            AI-powered plant disease detection from leaf images
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
                Capture from ESP32 CAM or upload a leaf image
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
                        alt="Leaf analysis"
                        className="w-full max-h-96 object-contain rounded-lg border"
                      />
                      {analysisResults && !analysisResults.isClassification && (
                        <canvas
                          ref={canvasRef}
                          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                        />
                      )}
                      {analysisResults && analysisResults.isClassification && (
                        <div className="absolute top-2 right-2 bg-blue-600 text-white px-3 py-1 rounded-lg text-sm">
                          Classification Model
                        </div>
                      )}
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
                          Analyze Disease
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 bg-muted rounded-lg border-2 border-dashed">
                    <Leaf className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-center">
                      Capture or upload a leaf image to start disease detection
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
                      <Activity className="h-5 w-5" />
                      Disease Detection Summary
                    </CardTitle>
                    <CardDescription>
                      Total {analysisResults.predictions.length} detection(s)
                      found
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {diseaseStats && (
                      <div className="grid grid-cols-2 gap-4">
                        {Object.entries(diseaseStats).map(
                          ([className, count]) => {
                            const colorScheme = colorSchemes[
                              className.toLowerCase()
                            ] || {
                              bg: "bg-blue-50",
                              border: "border-blue-200",
                              text: "text-blue-700",
                            };

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
                        Total Detections
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
                </CardHeader>
                <CardContent>
                  {analysisResults.predictions.length > 0 ? (
                    <div className="space-y-3">
                      {analysisResults.predictions
                        .sort((a, b) => b.confidence - a.confidence)
                        .map((pred, index) => {
                          const colorScheme = colorSchemes[
                            pred.class.toLowerCase()
                          ] || {
                            bg: "bg-blue-50",
                            border: "border-blue-200",
                            text: "text-blue-700",
                          };

                          const treatment =
                            diseaseTreatments[pred.class.toLowerCase()];

                          return (
                            <div
                              key={index}
                              className={`p-4 rounded-lg border-2 ${colorScheme.bg} ${colorScheme.border}`}
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className="text-sm font-medium text-muted-foreground">
                                    #{index + 1}
                                  </div>
                                  <Badge
                                    variant="outline"
                                    className={`capitalize ${colorScheme.text} border-current`}
                                  >
                                    {pred.class}
                                  </Badge>
                                  {pred.confidence >= 0.8 ? (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  ) : pred.confidence >= 0.6 ? (
                                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                                  ) : (
                                    <AlertCircle className="h-4 w-4 text-red-600" />
                                  )}
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

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-muted-foreground mb-3">
                                <div>
                                  <span className="font-medium">Center X:</span>{" "}
                                  {Math.round(pred.x)}px
                                </div>
                                <div>
                                  <span className="font-medium">Center Y:</span>{" "}
                                  {Math.round(pred.y)}px
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

                              {/* Treatment Suggestions Section */}
                              {treatment && (
                                <div className="mt-4 pt-4 border-t border-current/20">
                                  <h4
                                    className={`text-sm font-semibold mb-2 ${colorScheme.text}`}
                                  >
                                    📋 Deskripsi & Saran Penanganan
                                  </h4>
                                  <p className="text-sm text-muted-foreground mb-3">
                                    {treatment.description}
                                  </p>
                                  <div className="space-y-2">
                                    {treatment.treatments.map((tip, idx) => (
                                      <div
                                        key={idx}
                                        className="flex items-start gap-2 text-sm"
                                      >
                                        <span
                                          className={`${colorScheme.text} font-bold`}
                                        >
                                          {idx + 1}.
                                        </span>
                                        <span className="text-muted-foreground">
                                          {tip}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                      <Eye className="h-8 w-8 mb-2 opacity-50" />
                      <p>No diseases detected in the image</p>
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
                Recent disease detections ({detectionHistory.length}/50)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {detectionHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                  <BarChart3 className="h-16 w-16 mx-auto opacity-50" />
                  <h3 className="text-lg font-medium mt-3">
                    No Detection History
                  </h3>
                  <p className="text-sm">
                    Detection results will appear here after analysis
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {detectionHistory.map((detection, index) => {
                    const colorScheme = colorSchemes[
                      detection.class.toLowerCase()
                    ] || {
                      bg: "bg-blue-50",
                      border: "border-blue-200",
                      text: "text-blue-700",
                    };

                    return (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border-2 ${colorScheme.bg} ${colorScheme.border}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge
                              variant="outline"
                              className={`capitalize ${colorScheme.text} border-current`}
                            >
                              {detection.class}
                            </Badge>
                            <span
                              className={`text-sm font-medium ${colorScheme.text}`}
                            >
                              {(detection.confidence * 100).toFixed(1)}%
                              confident
                            </span>
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
                      </div>
                    );
                  })}
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
                  Configure your plant disease detection model
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="model-select">Select Plant Model</Label>
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
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project-id">Project ID</Label>
                  <Input
                    id="project-id"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    placeholder="tomato-diseases"
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
                    Current endpoint: https://serverless.roboflow.com/
                    {projectId}/{modelVersion}
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
              You'll need a Roboflow account with a trained plant disease
              detection model. Visit{" "}
              <a
                href="https://universe.roboflow.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Roboflow Universe
              </a>{" "}
              to find or train models.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PlantDiseaseDetection;
