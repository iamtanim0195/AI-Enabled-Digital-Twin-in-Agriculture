import type { StressLevel } from "./soil-simulation";

export interface EnvironmentSimulationInput {
  airTemperature: number;
  humidity: number;
  light: number;
  windSpeed: number;
  rainfall: number;
  rainProbability: number;
}

export interface EnvironmentSimulationResult {
  temperatureStatus: "COLD STRESS" | "OPTIMAL" | "HEAT STRESS";
  humidityStatus: "LOW" | "OPTIMAL" | "HIGH";
  lightStatus: "Very Low" | "Low" | "Optimal" | "High" | "Extreme";
  windStatus: "CALM" | "BREEZY" | "HIGH WIND" | "EXTREME WIND";
  heatStress: number;
  humidityStress: number;
  lightStress: number;
  diseaseRisk: number;
  environmentalStress: number;
  leafMovement: number;
}

export function simulateEnvironment(input: EnvironmentSimulationInput): EnvironmentSimulationResult {
  const temperatureStatus = input.airTemperature < 18 ? "COLD STRESS" : input.airTemperature > 36 ? "HEAT STRESS" : "OPTIMAL";
  const heatStress = input.airTemperature > 32 ? Math.min(100, (input.airTemperature - 32) * 7) : input.airTemperature < 18 ? Math.min(100, (18 - input.airTemperature) * 5) : 0;
  const humidityStatus = input.humidity < 40 ? "LOW" : input.humidity > 80 ? "HIGH" : "OPTIMAL";
  const humidityStress = input.humidity < 40 ? (40 - input.humidity) * 1.4 : input.humidity > 85 ? (input.humidity - 85) * 1.3 : 0;
  const lightStatus = input.light < 250 ? "Very Low" : input.light < 600 ? "Low" : input.light <= 1500 ? "Optimal" : input.light <= 1850 ? "High" : "Extreme";
  const lightStress = input.light < 600 ? (600 - input.light) / 6 : input.light > 1850 ? (input.light - 1850) / 1.5 : 0;
  const windStatus = input.windSpeed < 10 ? "CALM" : input.windSpeed < 30 ? "BREEZY" : input.windSpeed < 48 ? "HIGH WIND" : "EXTREME WIND";
  const diseaseRisk = Math.min(100, (input.humidity > 80 ? 28 : 0) + (input.rainfall > 15 ? 28 : input.rainfall > 3 ? 10 : 0) + (input.airTemperature >= 24 && input.airTemperature <= 34 ? 28 : 0) + (input.rainProbability > 65 ? 10 : 0));
  return { temperatureStatus, humidityStatus, lightStatus, windStatus, heatStress: Math.round(heatStress), humidityStress: Math.round(Math.min(100, humidityStress)), lightStress: Math.round(Math.min(100, lightStress)), diseaseRisk: Math.round(diseaseRisk), environmentalStress: Math.round(Math.min(100, heatStress * 0.45 + humidityStress * 0.25 + lightStress * 0.3)), leafMovement: Math.min(1, input.windSpeed / 60) };
}

export function stressLabel(value: number): StressLevel {
  return value > 60 ? "HIGH" : value > 25 ? "MEDIUM" : "LOW";
}