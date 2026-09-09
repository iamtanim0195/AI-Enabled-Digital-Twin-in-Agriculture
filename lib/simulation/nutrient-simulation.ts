export type NutrientStatus = "LOW" | "OPTIMAL" | "HIGH";

export interface NutrientSimulationInput {
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  iron: number;
  magnesium: number;
  calcium: number;
}

export interface NutrientSimulationResult {
  nitrogen: NutrientStatus;
  phosphorus: NutrientStatus;
  potassium: NutrientStatus;
  iron: NutrientStatus;
  magnesium: NutrientStatus;
  calcium: NutrientStatus;
  stress: number;
  yellowing: number;
  chlorosis: number;
  leafEdgeStress: number;
}

function classify(value: number, low: number, high: number): NutrientStatus {
  return value < low ? "LOW" : value > high ? "HIGH" : "OPTIMAL";
}

export function simulateNutrients(input: NutrientSimulationInput): NutrientSimulationResult {
  const statuses = { nitrogen: classify(input.nitrogen, 45, 140), phosphorus: classify(input.phosphorus, 20, 75), potassium: classify(input.potassium, 45, 150), iron: classify(input.iron, 25, 80), magnesium: classify(input.magnesium, 20, 75), calcium: classify(input.calcium, 35, 130) };
  const lowCount = Object.values(statuses).filter((status) => status === "LOW").length;
  const highCount = Object.values(statuses).filter((status) => status === "HIGH").length;
  return { ...statuses, stress: Math.min(100, lowCount * 17 + highCount * 5), yellowing: Math.min(100, (statuses.nitrogen === "LOW" ? 38 : 0) + (statuses.iron === "LOW" ? 30 : 0) + (statuses.magnesium === "LOW" ? 25 : 0)), chlorosis: Math.min(100, (statuses.iron === "LOW" ? 48 : 0) + (statuses.magnesium === "LOW" ? 42 : 0)), leafEdgeStress: statuses.potassium === "LOW" ? 58 : statuses.potassium === "HIGH" ? 12 : 0 };
}