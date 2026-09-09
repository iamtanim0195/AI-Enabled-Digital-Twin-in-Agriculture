export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export type PapayaImageType =
  | "LEAF"
  | "FRUIT"
  | "STEM_PETIOLE"
  | "WHOLE_PLANT"
  | "MULTIPLE_PARTS"
  | "UNKNOWN";

export type AnalysisMode = "AUTO_DETECT" | "LEAF" | "FRUIT" | "STEM" | "WHOLE_PLANT";

export interface ImageQualityResult {
  isSufficient: boolean;
  issues: string[];
  message: string;
  details: string;
}

export interface DiseaseAnalysisResult {
  disease: string;
  confidence: number;
  risk: RiskLevel;
  possibleSymptoms: string[];
  visualEvidence: string[];
  affectedArea: string;
  recommendedAction: string;
  explanation: string;
}

export interface FruitAnalysisResult {
  condition: string;
  diseaseOrSymptom: string;
  confidence: number;
  risk: RiskLevel;
  visualEvidence: string[];
  recommendation: string;
}

export interface StemAnalysisResult {
  possibleSymptom: string;
  confidence: number;
  risk: RiskLevel;
  visualEvidence: string[];
  recommendation: string;
}

export interface WholePlantAnalysisResult {
  overallHealth: string;
  diseaseRisk: RiskLevel;
  nutrientStressRisk: RiskLevel;
  visibleSymptoms: string[];
  growthCondition: string;
  recommendations: string[];
}

export interface NutrientAnalysisResult {
  nutrientStatus: string;
  possibleDeficiencies: string[];
  confidence: number;
  risk: RiskLevel;
  visualEvidence: string[];
  explanation: string;
  recommendation: string;
}

export interface HealthAnalysisResult {
  score: number;
  status: string;
  diseaseRisk: string;
  nutrientStress: string;
  visibleDamage: string;
  overallConfidence: number;
  summary: string;
}

export interface PlantAnalysisResult {
  imageType: PapayaImageType;
  analysisMode: AnalysisMode;
  diseaseAnalysis: DiseaseAnalysisResult;
  nutrientAnalysis: NutrientAnalysisResult;
  healthAnalysis: HealthAnalysisResult;
  fruitAnalysis?: FruitAnalysisResult;
  stemAnalysis?: StemAnalysisResult;
  wholePlantAnalysis?: WholePlantAnalysisResult;
  imageQuality: ImageQualityResult;
  recommendations: string[];
  analysisDate: string;
  fileName: string;
}

export interface AnalysisHistoryItem {
  date: string;
  image: string;
  disease: string;
  diseaseConfidence: number;
  nutrientStress: string;
  healthScore: number;
  risk: RiskLevel;
}

export interface PlantImageInput {
  name: string;
  size: number;
  type: string;
  width?: number;
  height?: number;
  visualData?: VisualImageData;
}

export interface VisualImageData {
  width: number;
  height: number;
  data: number[];
}

export const PAPAYA_DISEASE_MODEL_CONFIG = {
  note: "Papaya-specific leaf disease support should use a verified papaya model adapter. No fake model ID is claimed.",
  supportedLeafClasses: [
    "Anthracnose",
    "Bacterial Spot",
    "Healthy Leaf",
    "Leaf Curl",
    "Mealybug",
    "Mite Disease",
    "Mosaic",
    "Ring Spot",
  ],
  architecture: "replaceable-model-adapter",
};

export const PAPAYA_NUTRIENT_MODEL_CONFIG = {
  mode: "visual-symptom-adapter",
  supported: [
    "Healthy",
    "Possible Nitrogen Deficiency",
    "Possible Phosphorus Deficiency",
    "Possible Potassium Deficiency",
    "Possible Iron Deficiency / Chlorosis",
    "Possible Magnesium Deficiency",
    "General Nutrient Stress",
    "Unknown / Insufficient Visual Evidence",
  ],
  notes: "Visual indication only — laboratory/soil testing is required for nutrient confirmation.",
};
