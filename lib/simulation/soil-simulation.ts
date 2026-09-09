export type SoilMoistureStatus = "Very Dry" | "Dry" | "Optimal" | "Wet" | "Waterlogged";
export type PhStatus = "ACIDIC" | "SLIGHTLY ACIDIC" | "OPTIMAL" | "HIGH" | "ALKALINE";
export type StressLevel = "LOW" | "MEDIUM" | "HIGH";

export interface SoilSimulationInput {
  ph: number;
  moisture: number;
  temperature: number;
  organicMatter: number;
}

export interface SoilSimulationResult {
  phStatus: PhStatus;
  phStress: StressLevel;
  moistureStatus: SoilMoistureStatus;
  moistureStress: StressLevel;
  soilTemperatureStatus: "COOL" | "OPTIMAL" | "HOT";
  organicMatterStatus: "LOW" | "ADEQUATE" | "HIGH";
}

export const PAPAYA_PH_TARGET = { min: 5.5, max: 6.8 };
export const MOISTURE_THRESHOLDS = { veryDry: 20, dry: 40, optimal: 70, wet: 85 };

export function simulateSoil(input: SoilSimulationInput): SoilSimulationResult {
  const phStatus: PhStatus = input.ph < 4.5 ? "ACIDIC" : input.ph < PAPAYA_PH_TARGET.min ? "SLIGHTLY ACIDIC" : input.ph <= PAPAYA_PH_TARGET.max ? "OPTIMAL" : input.ph <= 8 ? "HIGH" : "ALKALINE";
  const phDistance = input.ph < PAPAYA_PH_TARGET.min ? PAPAYA_PH_TARGET.min - input.ph : Math.max(0, input.ph - PAPAYA_PH_TARGET.max);
  const phStress: StressLevel = phDistance > 1.5 ? "HIGH" : phDistance > 0 ? "MEDIUM" : "LOW";
  const moistureStatus: SoilMoistureStatus = input.moisture < 20 ? "Very Dry" : input.moisture < 40 ? "Dry" : input.moisture <= 70 ? "Optimal" : input.moisture <= 85 ? "Wet" : "Waterlogged";
  const moistureStress: StressLevel = moistureStatus === "Very Dry" || moistureStatus === "Waterlogged" ? "HIGH" : moistureStatus === "Dry" || moistureStatus === "Wet" ? "MEDIUM" : "LOW";
  return { phStatus, phStress, moistureStatus, moistureStress, soilTemperatureStatus: input.temperature < 18 ? "COOL" : input.temperature > 35 ? "HOT" : "OPTIMAL", organicMatterStatus: input.organicMatter < 2 ? "LOW" : input.organicMatter > 7 ? "HIGH" : "ADEQUATE" };
}