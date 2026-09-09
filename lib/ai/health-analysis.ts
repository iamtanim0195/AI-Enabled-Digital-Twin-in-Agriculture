import { HealthAnalysisResult, NutrientAnalysisResult, DiseaseAnalysisResult } from "@/types/plant-analysis";

export function analyzePlantHealth(
  diseaseAnalysis: DiseaseAnalysisResult,
  nutrientAnalysis: NutrientAnalysisResult,
): HealthAnalysisResult {
  const diseasePenalty = diseaseAnalysis.risk === "HIGH" ? 18 : diseaseAnalysis.risk === "MEDIUM" ? 10 : 4;
  const nutrientPenalty = nutrientAnalysis.risk === "HIGH" ? 15 : nutrientAnalysis.risk === "MEDIUM" ? 9 : 3;
  const confidence = Math.round((diseaseAnalysis.confidence + nutrientAnalysis.confidence) / 2);
  const score = Math.max(35, Math.min(96, 100 - diseasePenalty - nutrientPenalty + (confidence - 75) / 4));

  const status = score >= 80 ? "Healthy" : score >= 65 ? "Monitor Closely" : "Needs Attention";

  return {
    score: Math.round(score),
    status,
    diseaseRisk: diseaseAnalysis.risk,
    nutrientStress: nutrientAnalysis.risk,
    visibleDamage: diseaseAnalysis.risk === "HIGH" ? "Moderate to severe visible damage" : "Low to moderate visible damage",
    overallConfidence: confidence,
    summary: "AI-based visual health assessment based on disease indicators, nutrient symptom risk, and visible foliar condition.",
  };
}
