import { AnalysisMode } from "@/types/plant-analysis";

export interface HuggingFacePrediction {
  label: string;
  display_name: string;
  confidence: number;
  confidence_percent: number;
}

export interface HuggingFaceAnalysis {
  success: boolean;
  image_type: string;
  model: { name: string; architecture: string };
  prediction: {
    label: string;
    display_name: string;
    confidence: number;
    confidence_percent: number;
  };
  risk: { level: "LOW" | "MEDIUM" | "HIGH"; type: string };
  health: { score: number; status: string; type: string };
  nutrient_analysis: { status: string; message: string };
  top_predictions: HuggingFacePrediction[];
  recommendations: string[];
  status: string;
  message?: string;
  mode?: AnalysisMode;
}

export async function analyzeWithHuggingFace(file: File, mode: AnalysisMode): Promise<HuggingFaceAnalysis> {
  const body = new FormData();
  body.append("file", file);
  body.append("mode", mode);

  let response: Response;
  try {
    response = await fetch(`${process.env.NEXT_PUBLIC_AI_API_URL || "http://127.0.0.1:8000"}/api/analyze-plant`, {
      method: "POST",
      body,
      signal: AbortSignal.timeout(120000),
    });
  } catch {
    throw new Error("AI service is unavailable. Start FastAPI on http://127.0.0.1:8000 and try again.");
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(typeof payload?.detail === "string" ? payload.detail : "AI service is temporarily unavailable.");
  }
  return response.json() as Promise<HuggingFaceAnalysis>;
}