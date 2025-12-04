import { text } from "stream/consumers";

export interface DetectionResult {
  confidence: number;
  class: string;
  x: number;
  y: number;
  width: number;
  height: number;
  timestamp?: string;
}

export interface AnalysisResult {
  predictions: DetectionResult[];
  time?: number;
  inference_time?: number;
  image?: {
    width: number;
    height: number;
  };
}

export interface ModelPreset {
  name: string;
  projectId: string;
  version: string;
  apiKey: string;
  classes: string[];
  description: string;
}

export const modelPresets: Record<string, ModelPreset> = {
  tomato: {
    name: "Tomato Ripeness",
    projectId: "tomato-oigp9",
    version: "1",
    apiKey: "q4UPgFhZpQTxmloM5WA9",
    classes: ["ripe", "unripe", "overripe", "damaged", "tomato"],
    description: "Deteksi kematangan tomat",
  },
  pineapple: {
    name: "Pineapple Maturity",
    projectId: "pineapple-maturity-project",
    version: "4",
    apiKey: "q4UPgFhZpQTxmloM5WA9",
    classes: ["ripe", "unripe", "overripe"],
    description: "Deteksi kematangan nanas",
  },
  banana: {
    name: "Banana Ripening",
    projectId: "banana-ripening-process",
    version: "2",
    apiKey: "q4UPgFhZpQTxmloM5WA9",
    classes: ["ripe", "unripe", "overripe"],
    description: "Deteksi kematangan pisang",
  },
  kurma: {
    name: "Date Palm Detection",
    projectId: "deteksi-jenis-kurma",
    version: "8",
    apiKey: "q4UPgFhZpQTxmloM5WA9",
    classes: ["Ajwa", "Amber", "Mazafati", "Medjol", "Rutab", "Sukari"], // Sesuaikan dengan kelas yang ada di model Anda
    description: "Deteksi jenis kurma",
  },

  mango: {
    name: "Mango Indramayu",
    projectId: "mangga-indramayu",
    version: "1",
    apiKey: "q4UPgFhZpQTxmloM5WA9",
    classes: ["Matang", "Mentah", "Busuk"],
    description: "Deteksi kematangan mangga Indramayu",
  },
};

// ✅ BENAR
export const colorSchemes: Record<
  string,
  { bg: string; border: string; text: string }
> = {
  ripe: {
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-700",
  },
  unripe: {
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    text: "text-yellow-700",
  },
  overripe: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
  },
  damaged: {
    bg: "bg-purple-50",
    border: "border-purple-200",
    text: "text-purple-700",
  },
  tomato: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
  },
  pineapple: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
  },
  banana: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
  },
  kurma: {
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-700",
  },
  ajwa: {
    bg: "bg-purple-50",
    border: "border-purple-200",
    text: "text-purple-700",
  },
  amber: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
  },
  mazafati: {
    bg: "bg-gray-50",
    border: "border-gray-200",
    text: "text-gray_700",
  },
  medjol: {
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-700",
  },
  rutab: {
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    text: "text-yellow-700",
  },
  sukari: {
    bg: "bg-rose-50",
    border: "border-rose-200",
    text: "text-rose-700",
  },

  mango: {
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-700",
  },

  matang: {
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-700",
  },

  mentah: {
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    text: "text-yellow-700",
  },

  busuk: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
  },
};

export const boundingBoxColors: Record<string, string> = {
  ripe: "#22c55e",
  unripe: "#f59e0b",
  overripe: "#ef4444",
  damaged: "#8b5cf6",
  tomato: "#3b82f6",
  pineapple: "#10b981",
  banana: "#f59e0b",
  kurma: "#fb923c",
  ajwa: "#9333ea",
  amber: "#f59e0b",
  mazafati: "#6b7280",
  medjol: "#fb923c",
  rutab: "#eab308",
  sukari: "#f43f5e",
  mango: "#fb923c",
  matang: "#22c55e",
  mentah: "#eab308",
  busuk: "#ef4444",
};

// Toast utility
export const toast = {
  success: (message: string) => console.log("Success:", message),
  error: (message: string) => console.error("Error:", message),
};

// Convert image to base64 string
export const convertImageToBase64 = async (
  imageUrl: string
): Promise<string> => {
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

// Capture image from ESP32 CAM
export const captureFromCamera = async (cameraIP: string): Promise<string> => {
  const response = await fetch(`http://${cameraIP}/capture`);
  if (!response.ok) throw new Error("Failed to capture image");

  const blob = await response.blob();
  return URL.createObjectURL(blob);
};

// Analyze image with Roboflow
export const analyzeImageWithRoboflow = async (
  imageUrl: string,
  roboflowApiKey: string,
  projectId: string,
  modelVersion: string
): Promise<AnalysisResult> => {
  const base64Image = await convertImageToBase64(imageUrl);
  const endpoint = `https://serverless.roboflow.com/${projectId}/${modelVersion}`;

  console.log("Sending request to:", endpoint);

  const response = await fetch(`${endpoint}?api_key=${roboflowApiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: base64Image,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("API Error Response:", errorText);
    throw new Error(`API Error: ${response.status} - ${errorText}`);
  }

  const result: AnalysisResult = await response.json();
  console.log("API Response:", result);

  return result;
};

// Draw bounding boxes on canvas
export const drawBoundingBoxes = (
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

// Get ripeness statistics
export const getRipenessStats = (
  predictions: DetectionResult[]
): Record<string, number> => {
  return predictions.reduce((acc, pred) => {
    const className = pred.class.toLowerCase();
    acc[className] = (acc[className] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
};
