import { simulateEnvironment, stressLabel, type EnvironmentSimulationInput, type EnvironmentSimulationResult } from "./environment-simulation";
import { simulateGrowth, type GrowthSimulationResult } from "./growth-simulation";
import { simulateNutrients, type NutrientSimulationInput, type NutrientSimulationResult } from "./nutrient-simulation";
import { simulateSoil, type SoilSimulationInput, type SoilSimulationResult } from "./soil-simulation";

export interface PlantSimulationInput extends SoilSimulationInput, NutrientSimulationInput, EnvironmentSimulationInput {
  ageDays: number;
  heightCm: number;
  growthStage: "Seedling" | "Vegetative" | "Flowering" | "Fruit Formation" | "Fruit Development" | "Mature";
}

export interface PlantSimulationResult {
  soilStatus: SoilSimulationResult;
  nutrientStatus: NutrientSimulationResult;
  environmentalStatus: EnvironmentSimulationResult;
  growth: GrowthSimulationResult;
  waterRequirement: "LOW" | "MEDIUM" | "HIGH";
  diseaseRisk: number;
  nutrientStress: number;
  waterStress: number;
  heatStress: number;
  overallStress: number;
  healthScore: number;
  growthRate: number;
  growthStage: PlantSimulationInput["growthStage"];
  recommendations: string[];
}

export function simulatePapayaPlant(input: PlantSimulationInput): PlantSimulationResult {
  const soilStatus = simulateSoil(input);
  const nutrientStatus = simulateNutrients(input);
  const environmentalStatus = simulateEnvironment(input);
  const rainEffect = Math.min(25, input.rainfall * 0.45);
  const effectiveMoisture = Math.min(100, input.moisture + rainEffect);
  const waterStress = soilStatus.moistureStatus === "Waterlogged" ? 65 : effectiveMoisture < 20 ? 85 : effectiveMoisture < 40 ? 48 : effectiveMoisture > 85 ? 52 : 0;
  const waterRequirement = effectiveMoisture < 25 || (input.airTemperature > 35 && input.humidity < 55) ? "HIGH" : effectiveMoisture < 45 ? "MEDIUM" : "LOW";
  const overallStress = Math.round(Math.min(100, (soilStatus.phStress === "HIGH" ? 22 : soilStatus.phStress === "MEDIUM" ? 10 : 0) + nutrientStatus.stress * 0.34 + waterStress * 0.28 + environmentalStatus.environmentalStress * 0.2 + environmentalStatus.diseaseRisk * 0.16));
  const healthScore = Math.max(0, Math.min(100, Math.round(100 - overallStress)));
  const growth = simulateGrowth({ ageDays: input.ageDays, heightCm: input.heightCm, healthScore, stress: overallStress, temperature: input.airTemperature, light: input.light });
  const recommendations: string[] = [];
  if (soilStatus.phStress !== "LOW") recommendations.push("Review soil pH: extreme pH can reduce nutrient availability.");
  if (nutrientStatus.nitrogen === "LOW") recommendations.push("Simulation suggests nitrogen deficiency may slow growth and increase leaf yellowing.");
  if (nutrientStatus.phosphorus === "LOW") recommendations.push("Simulation suggests phosphorus support for root and growth development.");
  if (nutrientStatus.potassium === "LOW") recommendations.push("Simulation suggests potassium support for resilience and leaf-edge health.");
  if (waterRequirement === "HIGH") recommendations.push(input.rainfall > 10 ? "Rainfall is providing some water, but the simulated plant still needs close monitoring." : "Simulation recommends irrigation.");
  if (soilStatus.moistureStatus === "Waterlogged") recommendations.push("DO NOT IRRIGATE: simulated soil is waterlogged and root oxygen stress is elevated.");
  if (environmentalStatus.diseaseRisk > 55) recommendations.push("Environmental disease risk is elevated; this is not a disease diagnosis.");
  if (environmentalStatus.windStatus === "EXTREME WIND") recommendations.push("Extreme wind creates a simulated physical damage risk.");
  if (!recommendations.length) recommendations.push("Conditions are within the simulated target range for steady growth.");
  return { soilStatus, nutrientStatus, environmentalStatus, growth, waterRequirement, diseaseRisk: environmentalStatus.diseaseRisk, nutrientStress: nutrientStatus.stress, waterStress, heatStress: environmentalStatus.heatStress, overallStress, healthScore, growthRate: growth.dailyGrowthCm, growthStage: input.growthStage, recommendations };
}

export function getStressLabel(value: number) {
  return stressLabel(value);
}