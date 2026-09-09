import { PlantState, EnvironmentState, TimeOfDay } from "./plant-state";

export const mockPlantState: PlantState = {
  plantId: "P001",
  species: "Papaya",
  height: 28,
  healthScore: 91,
  healthStatus: "Healthy",
  disease: { name: null, confidence: 0, risk: "LOW" },
  visualSymptoms: [],
  leafStates: Array(8).fill("healthy"),
  lastAnalysis: null,
  soilMoisture: 64,
  temperature: 28.4,
  humidity: 72,
  light: 680,
  diseaseRisk: 8,
  growthStage: "Vegetative",
  windSpeed: 12,
  rainProbability: 20,
  irrigation: false,
};

export const mockEnvironmentState: EnvironmentState = {
  timeOfDay: "noon" as TimeOfDay,
  rainActive: false,
  windSpeed: 12,
};

export const mockDate = "08 Sep 2026";
export const mockTime = "12:30 PM";
