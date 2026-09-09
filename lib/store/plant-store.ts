"use client";

import { useSyncExternalStore } from "react";
import { HuggingFaceAnalysis } from "@/lib/ai/huggingface-prediction";
import {
  EnvironmentState,
  PlantState,
  getCurrentTimeOfDay,
} from "@/lib/plant-state";
import { mockEnvironmentState, mockPlantState } from "@/lib/mock-data";

const STORAGE_KEY = "plant-twin-state";

export type LeafState = "healthy" | "stressed" | "diseased" | "dead";

export interface DiseaseState {
  name: string | null;
  confidence: number;
  risk: "LOW" | "MEDIUM" | "HIGH";
}

export interface PlantTwinState extends PlantState {
  species: "Papaya";
  healthStatus: string;
  disease: DiseaseState;
  visualSymptoms: string[];
  leafStates: LeafState[];
  lastAnalysis: string | null;
}

export interface PlantAIState {
  status: "idle" | "analyzing" | "complete" | "error";
  modelName: string | null;
  lastError: string | null;
}

export interface PlantStoreState {
  plant: PlantTwinState;
  ai: PlantAIState;
  weather: {
    locationName: string;
    lastUpdated: string | null;
  };
  environment: EnvironmentState;
  simulation: {
    selected: boolean;
    lastReset: string;
  };
}

const healthyPlant: PlantTwinState = {
  ...mockPlantState,
  species: "Papaya",
  healthStatus: "Healthy",
  disease: { name: null, confidence: 0, risk: "LOW" },
  visualSymptoms: [],
  leafStates: Array(8).fill("healthy"),
  lastAnalysis: null,
};

const defaultState: PlantStoreState = {
  plant: healthyPlant,
  ai: { status: "idle", modelName: null, lastError: null },
  weather: { locationName: "Bengaluru", lastUpdated: null },
  environment: mockEnvironmentState,
  simulation: { selected: false, lastReset: new Date().toISOString() },
};

let state = defaultState;
const listeners = new Set<() => void>();
let hydrated = false;

function emit() {
  listeners.forEach((listener) => listener());
}

function persist() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function updateState(next: PlantStoreState) {
  state = next;
  persist();
  emit();
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) return;

  try {
    const parsed = JSON.parse(stored) as Partial<PlantStoreState>;
    state = {
      ...defaultState,
      ...parsed,
      plant: { ...defaultState.plant, ...parsed.plant },
      ai: { ...defaultState.ai, ...parsed.ai },
      weather: { ...defaultState.weather, ...parsed.weather },
      environment: { ...defaultState.environment, ...parsed.environment },
      simulation: { ...defaultState.simulation, ...parsed.simulation },
    };
    emit();
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

export function usePlantStore() {
  return useSyncExternalStore(
    (listener) => {
      hydrate();
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state,
    () => defaultState,
  );
}

export function setAIStatus(status: PlantAIState["status"], error: string | null = null) {
  updateState({ ...state, ai: { ...state.ai, status, lastError: error } });
}

export function applyAIAnalysis(analysis: HuggingFaceAnalysis) {
  const label = analysis.prediction.label;
  const isHealthy = label === "Papaya_Healthy";
  const risk = analysis.risk.level;
  const healthScore = Math.round(analysis.health.score);
  const severity: LeafState = isHealthy ? "healthy" : risk === "HIGH" ? "diseased" : "stressed";
  const affectedLeaves = risk === "HIGH" ? 4 : risk === "MEDIUM" ? 2 : 0;
  const leafStates: LeafState[] = Array(8).fill("healthy");
  for (let index = 0; index < affectedLeaves; index += 1) leafStates[index] = severity;

  updateState({
    ...state,
    plant: {
      ...state.plant,
      healthScore,
      healthStatus: analysis.health.status,
      disease: {
        name: isHealthy ? null : analysis.prediction.display_name,
        confidence: analysis.prediction.confidence,
        risk,
      },
      diseaseRisk: risk === "HIGH" ? 85 : risk === "MEDIUM" ? 55 : 8,
      visualSymptoms: isHealthy ? [] : [analysis.message || "Visible discoloration detected"],
      leafStates,
      lastAnalysis: new Date().toISOString(),
    },
    ai: {
      status: "complete",
      modelName: analysis.model.name,
      lastError: null,
    },
  });
}

export function updatePlant(updates: Partial<PlantTwinState>) {
  updateState({ ...state, plant: { ...state.plant, ...updates } });
}

export function updateEnvironment(updates: Partial<EnvironmentState>) {
  updateState({ ...state, environment: { ...state.environment, ...updates } });
}

export function updateWeather(updates: Partial<PlantStoreState["weather"]>) {
  updateState({ ...state, weather: { ...state.weather, ...updates } });
}

export function resetPlantState() {
  updateState({
    ...defaultState,
    plant: { ...healthyPlant },
    environment: { ...defaultState.environment, timeOfDay: getCurrentTimeOfDay() },
    simulation: { selected: false, lastReset: new Date().toISOString() },
  });
}

export function selectPlant(selected: boolean) {
  updateState({ ...state, simulation: { ...state.simulation, selected } });
}
