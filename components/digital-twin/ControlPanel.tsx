"use client";

import { Focus, Eye, RotateCcw, CloudRain, Wind, Clock, Sun, Ruler, MapPin } from "lucide-react";
import { TimeOfDay, TIME_DISPLAY } from "@/lib/plant-state";
import { CameraView } from "./CameraControls";

interface ControlPanelProps {
  cameraView: CameraView;
  onCameraView: (view: CameraView) => void;
  timeOfDay: TimeOfDay;
  onTimeChange: (time: TimeOfDay) => void;
  rainActive: boolean;
  onRainToggle: () => void;
  windSpeed: number;
  onWindChange: (speed: number) => void;
  plantHeight: number;
  onPlantHeightChange: (height: number) => void;
  locationValue: string;
  onLocationValueChange: (value: string) => void;
  onLocationApply: () => void;
  onReset: () => void;
}

export function ControlPanel({
  cameraView,
  onCameraView,
  timeOfDay,
  onTimeChange,
  rainActive,
  onRainToggle,
  windSpeed,
  onWindChange,
  plantHeight,
  onPlantHeightChange,
  locationValue,
  onLocationValueChange,
  onLocationApply,
  onReset,
}: ControlPanelProps) {
  const timeOptions: TimeOfDay[] = ["sunrise", "morning", "noon", "afternoon", "sunset", "night"];

  return (
    <div className="glass-panel rounded-xl p-4 pointer-events-auto">
      <h3 className="text-xs font-semibold text-white/60 uppercase tracking-widest mb-3">Controls</h3>

      {/* Camera Controls */}
      <div className="mb-4">
        <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Camera</p>
        <div className="grid grid-cols-3 gap-1.5">
          <ControlButton
            active={cameraView === "plant"}
            onClick={() => onCameraView("plant")}
            icon={Focus}
            label="Focus Plant"
          />
          <ControlButton
            active={cameraView === "top"}
            onClick={() => onCameraView("top")}
            icon={Eye}
            label="Top View"
          />
          <ControlButton
            active={cameraView === "reset"}
            onClick={() => onCameraView("reset")}
            icon={RotateCcw}
            label="Reset View"
          />
        </div>
      </div>

      {/* Time of Day */}
      <div className="mb-4">
        <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Clock className="w-3 h-3" /> Time of Day
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {timeOptions.map((time) => (
            <button
              key={time}
              onClick={() => onTimeChange(time)}
              className={`px-2 py-1.5 rounded-md text-[10px] font-medium transition-all ${
                timeOfDay === time
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  : "bg-white/5 text-white/60 hover:bg-white/10 border border-transparent"
              }`}
            >
              {TIME_DISPLAY[time].label}
            </button>
          ))}
        </div>
      </div>

      {/* Rain Toggle */}
      <div className="mb-4">
        <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <CloudRain className="w-3 h-3" /> Rain
        </p>
        <button
          onClick={onRainToggle}
          className={`w-full py-2 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
            rainActive
              ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
              : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10"
          }`}
        >
          <CloudRain className="w-3.5 h-3.5" />
          {rainActive ? "Raining" : "Dry Weather"}
        </button>
      </div>

      {/* Wind Slider */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] text-white/40 uppercase tracking-wider flex items-center gap-1.5">
            <Wind className="w-3 h-3" /> Wind
          </p>
          <span className="text-[10px] font-mono font-semibold text-white/70">{windSpeed} km/h</span>
        </div>
        <input
          type="range"
          min={0}
          max={40}
          step={1}
          value={windSpeed}
          onChange={(e) => onWindChange(Number(e.target.value))}
          className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-cyan-400"
        />
      </div>

      {/* Crop Controls */}
      <div className="mb-4 space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] text-white/40 uppercase tracking-wider flex items-center gap-1.5">
              <Ruler className="w-3 h-3" /> Plant Height
            </p>
            <span className="text-[10px] font-mono font-semibold text-white/70">{plantHeight} cm</span>
          </div>
          <input
            type="range"
            min={10}
            max={100}
            step={1}
            value={plantHeight}
            onChange={(e) => onPlantHeightChange(Number(e.target.value))}
            className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-emerald-400"
          />
        </div>

      </div>

      {/* Location */}
      <div className="mb-4 pt-1">
        <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <MapPin className="w-3 h-3" /> Area Location
        </p>
        <div className="flex gap-2">
          <input
            value={locationValue}
            onChange={(e) => onLocationValueChange(e.target.value)}
            placeholder="City or area"
            className="flex-1 rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-[10px] text-white placeholder:text-white/30 outline-none focus:border-cyan-400/50"
          />
          <button
            onClick={onLocationApply}
            className="rounded-md bg-cyan-500/20 px-2 py-1.5 text-[10px] font-semibold text-cyan-200 border border-cyan-500/30 hover:bg-cyan-500/30 transition-colors"
          >
            Update
          </button>
        </div>
      </div>

      {/* Reset the plant and simulation state */}
      <button
        onClick={onReset}
        className="w-full py-2 rounded-md text-xs font-semibold bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center gap-2"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        Reset Plant State
      </button>
    </div>
  );
}

function ControlButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: any;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 py-2 px-1 rounded-md transition-all ${
        active
          ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
          : "bg-white/5 text-white/60 border border-transparent hover:bg-white/10"
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="text-[9px] font-medium leading-none">{label}</span>
    </button>
  );
}
