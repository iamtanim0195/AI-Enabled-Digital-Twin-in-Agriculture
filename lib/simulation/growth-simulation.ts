export type GrowthCondition = "Excellent" | "Good" | "Moderate" | "Poor" | "Severely stressed";

export interface GrowthSimulationInput {
  ageDays: number;
  heightCm: number;
  healthScore: number;
  stress: number;
  temperature: number;
  light: number;
}

export interface GrowthSimulationResult {
  condition: GrowthCondition;
  dailyGrowthCm: number;
  estimatedHeightCm: number;
  stage: "Seedling" | "Vegetative" | "Flowering" | "Fruit Formation" | "Fruit Development" | "Mature";
}

export function simulateGrowth(input: GrowthSimulationInput): GrowthSimulationResult {
  const condition: GrowthCondition = input.stress > 75 ? "Severely stressed" : input.stress > 50 ? "Poor" : input.stress > 28 ? "Moderate" : input.healthScore > 85 ? "Excellent" : "Good";
  const ideality = Math.max(0, 1 - input.stress / 100);
  const dailyGrowthCm = Math.max(0.02, Number((0.35 * ideality * (input.light >= 600 ? 1 : 0.65) * (input.temperature >= 20 && input.temperature <= 34 ? 1 : 0.7)).toFixed(2)));
  const estimatedHeightCm = Number((input.heightCm + dailyGrowthCm * 30 * ideality).toFixed(1));
  const stage = input.ageDays < 45 ? "Seedling" : input.ageDays < 110 ? "Vegetative" : input.ageDays < 170 ? "Flowering" : input.ageDays < 260 ? "Fruit Formation" : input.ageDays < 365 ? "Fruit Development" : "Mature";
  return { condition, dailyGrowthCm, estimatedHeightCm, stage };
}