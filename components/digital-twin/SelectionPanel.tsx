"use client";

import { X, Sprout, Droplet, Waves } from "lucide-react";
import { PlantState } from "@/lib/plant-state";

export type SelectionType = "plant" | "soil" | "irrigation" | null;

interface SelectionPanelProps {
  type: SelectionType;
  plantState: PlantState;
  rainActive: boolean;
  onClose: () => void;
}

export function SelectionPanel({ type, plantState, rainActive, onClose }: SelectionPanelProps) {
  if (!type) return null;

  const config = {
    plant: {
      icon: Sprout,
      title: `${plantState.species} Plant ${plantState.plantId}`,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      rows: [
        { label: "Growth Stage", value: plantState.growthStage },
        { label: "Height", value: `${plantState.height} cm` },
        { label: "Health", value: `${plantState.healthScore}%` },
        { label: "Disease", value: plantState.disease.name || "None" },
        { label: "Confidence", value: plantState.disease.name ? `${Math.round(plantState.disease.confidence * 100)}%` : "—" },
        { label: "Risk", value: plantState.disease.risk },
        { label: "Last AI Analysis", value: plantState.lastAnalysis ? new Date(plantState.lastAnalysis).toLocaleString() : "Not analyzed" },
        { label: "Soil Moisture", value: `${plantState.soilMoisture}%` },
      ],
    },
    soil: {
      icon: Droplet,
      title: "Soil / Pot",
      color: "text-amber-600",
      bgColor: "bg-amber-500/10",
      rows: [
        { label: "Soil Moisture", value: `${plantState.soilMoisture}%` },
        { label: "Temperature", value: `${plantState.temperature.toFixed(1)}°C` },
        { label: "Condition", value: rainActive ? "Wet (Raining)" : plantState.soilMoisture > 50 ? "Moist" : "Dry" },
        { label: "Pot Type", value: "Terracotta 8\"" },
      ],
    },
    irrigation: {
      icon: Waves,
      title: "Irrigation System",
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/10",
      rows: [
        { label: "Status", value: rainActive ? "Suspended (Rain)" : plantState.irrigation ? "Active" : "Standby" },
        { label: "Type", value: "Drip Irrigation" },
        { label: "Source", value: "Water Reservoir" },
        { label: "Trigger", value: "Soil < 40% moisture" },
      ],
    },
  };

  const cfg = config[type];
  const Icon = cfg.icon;

  return (
    <div className="glass-panel rounded-xl p-4 w-[280px] pointer-events-auto">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg ${cfg.bgColor} flex items-center justify-center`}>
            <Icon className={`w-4 h-4 ${cfg.color}`} />
          </div>
          <h3 className="text-sm font-bold text-white">{cfg.title}</h3>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded-md hover:bg-white/10 flex items-center justify-center transition-colors"
        >
          <X className="w-3.5 h-3.5 text-white/60" />
        </button>
      </div>

      <div className="space-y-2">
        {cfg.rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between text-xs py-1 border-b border-white/5 last:border-0">
            <span className="text-white/50">{row.label}</span>
            <span className="font-mono font-semibold text-white/90">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
