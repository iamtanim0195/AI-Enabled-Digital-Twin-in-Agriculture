export type GrowthStage = "Seedling" | "Vegetative" | "Flowering" | "Fruiting";

export interface PlantState {
  plantId: string;
  species: "Papaya";
  height: number;
  healthScore: number;
  healthStatus: string;
  disease: {
    name: string | null;
    confidence: number;
    risk: "LOW" | "MEDIUM" | "HIGH";
  };
  visualSymptoms: string[];
  leafStates: ("healthy" | "stressed" | "diseased" | "dead")[];
  lastAnalysis: string | null;
  soilMoisture: number;
  temperature: number;
  humidity: number;
  light: number;
  diseaseRisk: number;
  growthStage: GrowthStage;
  windSpeed: number;
  rainProbability: number;
  irrigation: boolean;
}

export type TimeOfDay = "sunrise" | "morning" | "noon" | "afternoon" | "sunset" | "night";

export interface EnvironmentState {
  timeOfDay: TimeOfDay;
  rainActive: boolean;
  windSpeed: number;
}

export const TIME_LABELS: Record<TimeOfDay, string> = {
  sunrise: "06:00",
  morning: "09:00",
  noon: "12:00",
  afternoon: "15:00",
  sunset: "18:00",
  night: "00:00",
};

export const TIME_DISPLAY: Record<TimeOfDay, { label: string; hour: number }> = {
  sunrise: { label: "Sunrise", hour: 6 },
  morning: { label: "Morning", hour: 9 },
  noon: { label: "Noon", hour: 12 },
  afternoon: { label: "Afternoon", hour: 15 },
  sunset: { label: "Sunset", hour: 18 },
  night: { label: "Night", hour: 0 },
};

export function getTimeOfDayFromHour(hour: number): TimeOfDay {
  if (hour >= 5 && hour < 8) return "sunrise";
  if (hour >= 8 && hour < 12) return "morning";
  if (hour >= 12 && hour < 15) return "noon";
  if (hour >= 15 && hour < 18) return "afternoon";
  if (hour >= 18 && hour < 21) return "sunset";
  return "night";
}

export function getCurrentTimeOfDay(): TimeOfDay {
  return getTimeOfDayFromHour(new Date().getHours());
}

export function getSunPosition(timeOfDay: TimeOfDay): [number, number, number] {
  const hour = TIME_DISPLAY[timeOfDay].hour;
  const angle = ((hour - 6) / 12) * Math.PI;
  const elevation = Math.sin(angle);
  const azimuth = Math.cos(angle);
  const distance = 20;
  const x = azimuth * distance * 0.7;
  const y = Math.max(elevation * distance, -5);
  const z = -distance * 0.5;
  return [x, y, z];
}

export function getSkyColors(timeOfDay: TimeOfDay): {
  top: string;
  bottom: string;
  fog: string;
  sunIntensity: number;
  ambientIntensity: number;
} {
  switch (timeOfDay) {
    case "sunrise":
      return {
        top: "#FF8C5A",
        bottom: "#FFD4A3",
        fog: "#F5C8A0",
        sunIntensity: 0.8,
        ambientIntensity: 0.35,
      };
    case "morning":
      return {
        top: "#4A90D9",
        bottom: "#A5D0F0",
        fog: "#C8DEF0",
        sunIntensity: 1.2,
        ambientIntensity: 0.45,
      };
    case "noon":
      return {
        top: "#2E6FB5",
        bottom: "#8AC4F0",
        fog: "#B5D5EE",
        sunIntensity: 1.6,
        ambientIntensity: 0.5,
      };
    case "afternoon":
      return {
        top: "#3B7DC4",
        bottom: "#9FD0F5",
        fog: "#C5DCEC",
        sunIntensity: 1.3,
        ambientIntensity: 0.45,
      };
    case "sunset":
      return {
        top: "#C44E3E",
        bottom: "#FFA570",
        fog: "#E8A080",
        sunIntensity: 0.7,
        ambientIntensity: 0.3,
      };
    case "night":
      return {
        top: "#0A0E27",
        bottom: "#1A1F3A",
        fog: "#151930",
        sunIntensity: 0.05,
        ambientIntensity: 0.15,
      };
  }
}

export function getWeatherCondition(rainActive: boolean, rainProbability: number): string {
  if (rainActive) return "Raining";
  if (rainProbability > 60) return "Cloudy";
  if (rainProbability > 30) return "Partly Cloudy";
  return "Sunny";
}
