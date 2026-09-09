import { analyzeDisease, analyzeFruitSymptoms, analyzeStemOrPetioleSymptoms, analyzeWholePlantSymptoms, checkImageQuality } from "@/lib/ai/disease-analysis";
import { analyzeNutrientStress } from "@/lib/ai/nutrient-analysis";
import { analyzePlantHealth } from "@/lib/ai/health-analysis";
import { AnalysisMode, PapayaImageType, PlantAnalysisResult, PlantImageInput, RiskLevel } from "@/types/plant-analysis";
import { predictVisualPlantImage } from "@/lib/ai/visual-prediction";

function modeFromImageType(imageType: PapayaImageType): AnalysisMode {
  if (imageType === "LEAF") return "LEAF";
  if (imageType === "FRUIT") return "FRUIT";
  if (imageType === "STEM_PETIOLE") return "STEM";
  if (imageType === "WHOLE_PLANT") return "WHOLE_PLANT";
  return "AUTO_DETECT";
}

export async function analyzePapayaPlant(
  image: PlantImageInput,
  mode: AnalysisMode = "AUTO_DETECT",
): Promise<PlantAnalysisResult> {
  const quality = checkImageQuality(image);
  const visualPrediction = predictVisualPlantImage(image, mode);
  const imageType = visualPrediction.imageType;
  const resolvedMode = mode === "AUTO_DETECT" ? modeFromImageType(imageType) : mode;

  if (!quality.isSufficient) {
    return {
      imageType,
      analysisMode: resolvedMode,
      diseaseAnalysis: {
        disease: "Unable to assess",
        confidence: 0,
        risk: "LOW",
        possibleSymptoms: [],
        visualEvidence: [],
        affectedArea: "Not available",
        recommendedAction: "Please upload a clear image of a papaya leaf, fruit, stem, or plant.",
        explanation: "The system could not reliably analyze the image due to poor clarity or insufficient visibility.",
      },
      nutrientAnalysis: {
        nutrientStatus: "Insufficient visual evidence",
        possibleDeficiencies: [],
        confidence: 0,
        risk: "LOW",
        visualEvidence: [],
        explanation: "The image does not provide enough visual evidence for a reliable nutrient stress assessment.",
        recommendation: "Please upload a clearer, well-lit papaya image.",
      },
      healthAnalysis: {
        score: 0,
        status: "Unassessable",
        diseaseRisk: "LOW",
        nutrientStress: "LOW",
        visibleDamage: "Not available",
        overallConfidence: 0,
        summary: "AI visual health assessment could not be completed because image quality was insufficient.",
      },
      imageQuality: quality,
      recommendations: [
        "Please upload a clear image of a papaya plant part.",
        "Capture the image in good daylight with a clean background.",
        "Ensure the relevant plant structure is fully visible and not blurred.",
      ],
      analysisDate: new Date().toISOString(),
      fileName: image.name,
    };
  }

  const diseaseAnalysis = analyzeDisease(image);
  const nutrientAnalysis = analyzeNutrientStress(image);
  const healthAnalysis = analyzePlantHealth(diseaseAnalysis, nutrientAnalysis);

  const fruitAnalysis = resolvedMode === "FRUIT" || imageType === "FRUIT" ? analyzeFruitSymptoms(image) : undefined;
  const stemAnalysis = resolvedMode === "STEM" || imageType === "STEM_PETIOLE" ? analyzeStemOrPetioleSymptoms(image) : undefined;
  const wholePlantAnalysis = resolvedMode === "WHOLE_PLANT" || imageType === "WHOLE_PLANT" ? analyzeWholePlantSymptoms(image) : undefined;

  const recommendations = [
    "Continue monitoring the papaya plant and capture another image in good daylight.",
    diseaseAnalysis.risk === "HIGH" ? "Prioritize observation of lesion spread and visible damage." : "Continue routine visual checks.",
    nutrientAnalysis.risk !== "LOW" ? "Consider checking soil or growing medium nutrition if yellowing persists." : "No major nutrient stress indicators were observed.",
    "This result is an AI decision-support tool and not a confirmed agricultural diagnosis.",
  ];

  return {
    imageType,
    analysisMode: resolvedMode,
    diseaseAnalysis,
    nutrientAnalysis,
    healthAnalysis,
    fruitAnalysis,
    stemAnalysis,
    wholePlantAnalysis,
    imageQuality: quality,
    recommendations,
    analysisDate: new Date().toISOString(),
    fileName: image.name,
  };
}

export const mockHistory = [
  {
    date: "09 Sep 2026",
    image: "Ring Spot sample",
    disease: "Ring Spot",
    diseaseConfidence: 92,
    nutrientStress: "Possible Nitrogen Stress",
    healthScore: 71,
    risk: "HIGH" as RiskLevel,
  },
  {
    date: "08 Sep 2026",
    image: "Healthy Leaf",
    disease: "No disease indicators",
    diseaseConfidence: 95,
    nutrientStress: "No significant stress",
    healthScore: 91,
    risk: "LOW" as RiskLevel,
  },
];
