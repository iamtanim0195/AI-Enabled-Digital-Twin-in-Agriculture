"use client";

import { useEffect, useState } from "react";
import { Sun, CloudRain, CloudSun, Cloud, Wind, Droplets } from "lucide-react";
import { PlantState, EnvironmentState, getWeatherCondition } from "@/lib/plant-state";

interface WeatherHUDProps {
  plantState: PlantState;
  envState: EnvironmentState;
  locationName: string;
}

export function WeatherHUD({ plantState, envState, locationName }: WeatherHUDProps) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const intervalId = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  const condition = getWeatherCondition(envState.rainActive, plantState.rainProbability);

  const WeatherIcon = envState.rainActive
    ? CloudRain
    : plantState.rainProbability > 60
    ? Cloud
    : plantState.rainProbability > 30
    ? CloudSun
    : Sun;

  const formattedDate = now?.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const formattedTime = now?.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="glass-panel rounded-xl p-4 w-[240px] pointer-events-auto">
      <h3 className="text-xs font-semibold text-white/60 uppercase tracking-widest mb-3">Weather</h3>

      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
          <WeatherIcon className="w-5 h-5 text-amber-300" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{condition}</p>
          <p className="text-xs text-white/50">{plantState.temperature.toFixed(1)}°C</p>
        </div>
      </div>

      <div className="mb-3 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5">
        <p className="text-[9px] uppercase tracking-[0.2em] text-white/45">Location</p>
        <p className="mt-1 text-xs font-medium text-white/90">{locationName}</p>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/50 flex items-center gap-1.5">
            <Droplets className="w-3 h-3" /> Humidity
          </span>
          <span className="font-mono font-semibold text-white/90">{plantState.humidity}%</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/50 flex items-center gap-1.5">
            <Wind className="w-3 h-3" /> Wind
          </span>
          <span className="font-mono font-semibold text-white/90">{envState.windSpeed} km/h</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/50 flex items-center gap-1.5">
            <CloudRain className="w-3 h-3" /> Rain Prob.
          </span>
          <span className="font-mono font-semibold text-white/90">{plantState.rainProbability}%</span>
        </div>
      </div>

      <div className="border-t border-white/10 mt-3 pt-3">
        <p className="text-xs text-white/60 font-medium">{formattedDate || "—"}</p>
        <p className="text-lg font-bold text-white font-mono">{formattedTime || "--:--:--"}</p>
      </div>
    </div>
  );
}
