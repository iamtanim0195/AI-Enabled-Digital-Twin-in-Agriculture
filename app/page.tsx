"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { TimeOfDay, getCurrentTimeOfDay } from "@/lib/plant-state";
import { usePlantStore, resetPlantState, updateEnvironment, updatePlant, updateWeather } from "@/lib/store/plant-store";
import { PlantHUD } from "@/components/digital-twin/PlantHUD";
import { WeatherHUD } from "@/components/digital-twin/WeatherHUD";
import { ControlPanel } from "@/components/digital-twin/ControlPanel";
import { SelectionPanel, SelectionType } from "@/components/digital-twin/SelectionPanel";
import { CameraView } from "@/components/digital-twin/CameraControls";
import { Activity, Wifi } from "lucide-react";

const PlantScene = dynamic(
  () => import("@/components/digital-twin/PlantScene").then((m) => m.PlantScene),
  { ssr: false, loading: () => <SceneLoader /> }
);

const OPENWEATHER_API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || "4af85ecedfdb73c8414fcd33f081ff51";
const DEFAULT_LOCATION = { latitude: 12.9716, longitude: 77.5946 };

async function fetchLiveWeather(locationQuery?: string) {
  let location = DEFAULT_LOCATION;
  let resolvedName = "Current Location";

  if (locationQuery && locationQuery.trim()) {
    const geoRes = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(locationQuery.trim())}&limit=1&appid=${OPENWEATHER_API_KEY}`
    );

    if (geoRes.ok) {
      const geocoded = await geoRes.json();
      const firstResult = geocoded?.[0];

      if (firstResult) {
        location = { latitude: firstResult.lat, longitude: firstResult.lon };
        resolvedName = [firstResult.name, firstResult.state, firstResult.country]
          .filter(Boolean)
          .join(", ");
      }
    }
  } else {
    const position = await new Promise<{ latitude: number; longitude: number }>((resolve) => {
      if (typeof navigator !== "undefined" && "geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }),
          () => resolve(DEFAULT_LOCATION),
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 300000 }
        );
        return;
      }

      resolve(DEFAULT_LOCATION);
    });

    location = position;
  }

  const [currentRes, forecastRes] = await Promise.all([
    fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${location.latitude}&lon=${location.longitude}&units=metric&appid=${OPENWEATHER_API_KEY}`
    ),
    fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${location.latitude}&lon=${location.longitude}&units=metric&cnt=3&appid=${OPENWEATHER_API_KEY}`
    ),
  ]);

  if (!currentRes.ok || !forecastRes.ok) {
    throw new Error("Failed to fetch live weather data");
  }

  const current = await currentRes.json();
  const forecast = await forecastRes.json();

  const weather = current.weather?.[0] ?? {};
  const nextRainProb = Math.round((forecast.list?.[0]?.pop ?? 0) * 100);
  const rainActive = Boolean(
    current.rain ||
      current.snow ||
      /rain|storm|drizzle/i.test(weather.main || "") ||
      nextRainProb >= 50
  );

  return {
    temperature: current.main?.temp ?? 0,
    humidity: current.main?.humidity ?? 0,
    windSpeed: current.wind?.speed ?? 0,
    rainProbability: nextRainProb,
    rainActive,
    weatherLabel: weather.main || "Clear",
    locationName: current.name ? `${current.name}${current.sys?.country ? `, ${current.sys.country}` : ""}` : resolvedName,
  };
}

export default function DigitalTwinPage() {
  const store = usePlantStore();
  const plantState = store.plant;
  const envState = store.environment;
  const [cameraView, setCameraView] = useState<CameraView>("default");
  const [selection, setSelection] = useState<SelectionType>(null);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const [locationName, setLocationName] = useState("Bengaluru");
  const [locationInput, setLocationInput] = useState("Bengaluru");

  const handleCameraView = useCallback((view: CameraView) => {
    setCameraView(view);
  }, []);

  const handleCameraViewCompleted = useCallback(() => {
    setCameraView("default");
  }, []);

  const handleTimeChange = useCallback((time: TimeOfDay) => {
    updateEnvironment({ timeOfDay: time });
  }, []);

  const handleRainToggle = useCallback(() => {
    updateEnvironment({ rainActive: !envState.rainActive });
  }, [envState.rainActive]);

  const handleWindChange = useCallback((speed: number) => {
    updateEnvironment({ windSpeed: speed });
    updatePlant({ windSpeed: speed });
  }, []);

  const handlePlantHeightChange = useCallback((height: number) => {
    updatePlant({ height });
  }, []);

  const handleReset = useCallback(() => {
    resetPlantState();
    setSelection(null);
    setCameraView("reset");
  }, []);

  const refreshWeather = useCallback(async (query?: string) => {
    try {
      const liveWeather = await fetchLiveWeather(query);
      setLocationName(liveWeather.locationName);
      setLocationInput(liveWeather.locationName);
      updateWeather({ locationName: liveWeather.locationName, lastUpdated: new Date().toISOString() });

      updatePlant({
        temperature: liveWeather.temperature,
        humidity: liveWeather.humidity,
        windSpeed: liveWeather.windSpeed,
        rainProbability: liveWeather.rainProbability,
      });

      updateEnvironment({
        windSpeed: liveWeather.windSpeed,
        rainActive: liveWeather.rainActive,
        timeOfDay: getCurrentTimeOfDay(),
      });
    } catch (error) {
      console.error("Unable to load live weather:", error);
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    const syncWeather = async () => {
      if (!isActive) return;
      await refreshWeather();
    };

    syncWeather();
    const intervalId = window.setInterval(syncWeather, 5 * 60 * 1000);

    const timeIntervalId = window.setInterval(() => {
      updateEnvironment({ timeOfDay: getCurrentTimeOfDay() });
    }, 60000);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
      window.clearInterval(timeIntervalId);
    };
  }, [refreshWeather]);

  const weatherStatus = envState.rainActive
    ? "Live • Raining"
    : plantState.rainProbability > 60
      ? "Live • Cloudy"
      : plantState.rainProbability > 30
        ? "Live • Partly Cloudy"
        : "Live • Clear";

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0A0E1A]">
      {/* 3D Scene - full screen background */}
      <div className="absolute inset-0">
        <PlantScene
          plantState={plantState}
          envState={envState}
          cameraView={cameraView}
          onCameraViewCompleted={handleCameraViewCompleted}
          onSelect={setSelection}
          selection={selection}
        />
      </div>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none">
        <div className="flex items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-3 pointer-events-auto">
            <div className="glass-panel rounded-lg px-4 py-2 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-white leading-tight">PlantTwin AI</h1>
                <p className="text-[10px] text-white/50 leading-tight">Digital Twin Control Center</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            <div className="glass-panel rounded-lg px-3 py-1.5 flex items-center gap-2">
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] font-medium text-emerald-400 uppercase tracking-wider">Connected</span>
            </div>
            <div className="glass-panel rounded-lg px-3 py-1.5 hidden sm:flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span className="text-[10px] font-medium text-emerald-400 uppercase tracking-wider">{weatherStatus}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Left HUD - Plant Data */}
      <div className="absolute top-16 left-4 z-10 pointer-events-none hidden md:block">
        <PlantHUD plantState={plantState} rainActive={envState.rainActive} />
      </div>

      {/* Right HUD - Weather + Controls */}
      <div className="absolute top-16 right-4 z-10 pointer-events-none hidden md:flex flex-col gap-3 items-end">
        <WeatherHUD plantState={plantState} envState={envState} locationName={locationName} />
        <ControlPanel
          cameraView={cameraView}
          onCameraView={handleCameraView}
          timeOfDay={envState.timeOfDay}
          onTimeChange={handleTimeChange}
          rainActive={envState.rainActive}
          onRainToggle={handleRainToggle}
          windSpeed={envState.windSpeed}
          onWindChange={handleWindChange}
          plantHeight={plantState.height}
          onPlantHeightChange={handlePlantHeightChange}
          locationValue={locationInput}
          onLocationValueChange={setLocationInput}
          onLocationApply={() => refreshWeather(locationInput)}
          onReset={handleReset}
        />
      </div>

      {/* Selection Panel - bottom left */}
      {selection && (
        <div className="absolute bottom-4 left-4 z-20 hidden md:block">
          <SelectionPanel
            type={selection}
            plantState={plantState}
            rainActive={envState.rainActive}
            onClose={() => setSelection(null)}
          />
        </div>
      )}

      {/* Mobile bottom sheet toggle */}
      <button
        onClick={() => setMobilePanelOpen(!mobilePanelOpen)}
        className="md:hidden absolute bottom-4 right-4 z-20 glass-panel rounded-full w-12 h-12 flex items-center justify-center pointer-events-auto"
      >
        <div className="flex flex-col gap-1">
          <span className="w-5 h-0.5 bg-white" />
          <span className="w-5 h-0.5 bg-white" />
          <span className="w-5 h-0.5 bg-white" />
        </div>
      </button>

      {/* Mobile panels */}
      {mobilePanelOpen && (
        <div className="md:hidden absolute inset-0 z-30 bg-black/40 backdrop-blur-sm" onClick={() => setMobilePanelOpen(false)}>
          <div
            className="absolute bottom-0 left-0 right-0 max-h-[70vh] overflow-y-auto glass-panel-dark rounded-t-2xl p-4 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-white/30 rounded-full mx-auto mb-3" />
            <PlantHUD plantState={plantState} rainActive={envState.rainActive} />
            <WeatherHUD plantState={plantState} envState={envState} locationName={locationName} />
            <ControlPanel
              cameraView={cameraView}
              onCameraView={handleCameraView}
              timeOfDay={envState.timeOfDay}
              onTimeChange={handleTimeChange}
              rainActive={envState.rainActive}
              onRainToggle={handleRainToggle}
              windSpeed={envState.windSpeed}
              onWindChange={handleWindChange}
              plantHeight={plantState.height}
              onPlantHeightChange={handlePlantHeightChange}
              locationValue={locationInput}
              onLocationValueChange={setLocationInput}
              onLocationApply={() => refreshWeather(locationInput)}
              onReset={handleReset}
            />
            {selection && (
              <SelectionPanel
                type={selection}
                plantState={plantState}
                rainActive={envState.rainActive}
                onClose={() => setSelection(null)}
              />
            )}
          </div>
        </div>
      )}

      {/* Mobile selection panel (when not in menu) */}
      {selection && !mobilePanelOpen && (
        <div className="md:hidden absolute bottom-20 left-4 right-16 z-20">
          <SelectionPanel
            type={selection}
            plantState={plantState}
            rainActive={envState.rainActive}
            onClose={() => setSelection(null)}
          />
        </div>
      )}

      {/* Click hint */}
      {!selection && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none hidden lg:block">
          <div className="glass-panel rounded-full px-4 py-2">
            <p className="text-[10px] text-white/50 text-center">
              Click the plant, soil, or irrigation pipe to inspect &middot; Drag to orbit &middot; Scroll to zoom
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function SceneLoader() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#0A0E1A]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-sm text-white/50">Initializing Digital Twin...</p>
      </div>
    </div>
  );
}
