"use client";

import { PlantState } from "@/lib/plant-state";

interface PlantHUDProps {
  plantState: PlantState;
  rainActive: boolean;
}

export function PlantHUD({ plantState, rainActive }: PlantHUDProps) {
  const rows: { label: string; value: string; color?: string }[] = [
    { label: "Health", value: `${plantState.healthScore}%`, color: getHealthColor(plantState.healthScore) },
    { label: "Status", value: plantState.healthStatus, color: getHealthColor(plantState.healthScore) },
    { label: "Disease", value: plantState.disease.name || "None" },
    { label: "Confidence", value: plantState.disease.name ? `${Math.round(plantState.disease.confidence * 100)}%` : "—" },
    { label: "Risk", value: plantState.disease.risk, color: getRiskColor(plantState.disease.risk) },
    { label: "Height", value: `${plantState.height} cm` },
    { label: "Growth", value: plantState.growthStage },
    { label: "Soil", value: `${plantState.soilMoisture}%`, color: getMoistureColor(plantState.soilMoisture) },
    { label: "Temperature", value: `${plantState.temperature.toFixed(1)}°C` },
    { label: "Humidity", value: `${plantState.humidity}%` },
    { label: "Light", value: `${plantState.light} lux` },
    { label: "Disease Risk", value: `${plantState.diseaseRisk}%`, color: getDiseaseColor(plantState.diseaseRisk) },
    { label: "Wind", value: `${plantState.windSpeed} km/h` },
    { label: "Rain", value: `${plantState.rainProbability}%` },
    {
      label: "Irrigation",
      value: rainActive ? "OFF (Raining)" : plantState.irrigation ? "ON" : "OFF",
      color: rainActive ? "#FFB74D" : plantState.irrigation ? "#00E676" : "#78909C",
    },
  ];

  return (
    <div className="glass-panel rounded-xl p-4 w-[260px] pointer-events-auto">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-xs font-semibold text-white/60 uppercase tracking-widest">Plant Twin</h3>
          <p className="text-sm font-bold text-white mt-0.5">{plantState.plantId}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          <span className="text-[10px] font-medium text-emerald-400 uppercase tracking-wider">Live</span>
        </div>
      </div>

      <div className="space-y-1.5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between text-xs py-0.5">
            <span className="text-white/50">{row.label}</span>
            <span
              className="font-mono font-semibold"
              style={{ color: row.color || "rgba(255,255,255,0.9)" }}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function getHealthColor(score: number): string {
  if (score >= 80) return "#66BB6A";
  if (score >= 60) return "#FFB74D";
  return "#EF5350";
}

function getMoistureColor(moisture: number): string {
  if (moisture >= 60) return "#42A5F5";
  if (moisture >= 30) return "#FFB74D";
  return "#EF5350";
}

function getDiseaseColor(risk: number): string {
  if (risk < 20) return "#66BB6A";
  if (risk < 50) return "#FFB74D";
  return "#EF5350";
}

function getRiskColor(risk: "LOW" | "MEDIUM" | "HIGH"): string {
  if (risk === "HIGH") return "#EF5350";
  if (risk === "MEDIUM") return "#FFB74D";
  return "#66BB6A";
}
