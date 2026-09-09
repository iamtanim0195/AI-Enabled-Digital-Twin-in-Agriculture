"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { Activity, AlertTriangle, Beaker, Check, ChevronDown, CloudRain, Droplets, Gauge, Leaf, RotateCcw, Scale, Wind } from "lucide-react";
import type { EnvironmentState, PlantState } from "@/lib/plant-state";
import { simulatePapayaPlant, getStressLabel, type PlantSimulationInput } from "@/lib/simulation/plant-simulation";

const PlantScene = dynamic(() => import("@/components/digital-twin/PlantScene").then((module) => module.PlantScene), { ssr: false, loading: () => <div className="flex h-full items-center justify-center text-sm text-white/50">Loading digital twin...</div> });

const DEFAULT_INPUT: PlantSimulationInput = {
  ph: 5.8, moisture: 54, nitrogen: 90, phosphorus: 45, potassium: 100, iron: 50, magnesium: 42, calcium: 75, organicMatter: 4.5, temperature: 26, airTemperature: 30, humidity: 68, light: 1100, windSpeed: 16, rainfall: 2, rainProbability: 25, ageDays: 140, heightCm: 85, growthStage: "Flowering",
};

const PRESETS: Record<string, PlantSimulationInput> = {
  "Optimal Conditions": DEFAULT_INPUT,
  "Nitrogen Deficiency": { ...DEFAULT_INPUT, nitrogen: 18 },
  "Phosphorus Deficiency": { ...DEFAULT_INPUT, phosphorus: 8 },
  "Potassium Deficiency": { ...DEFAULT_INPUT, potassium: 24 },
  "Iron Deficiency": { ...DEFAULT_INPUT, iron: 10 },
  "Low Soil Moisture": { ...DEFAULT_INPUT, moisture: 18, rainfall: 0 },
  "Waterlogged Soil": { ...DEFAULT_INPUT, moisture: 94, rainfall: 28, humidity: 88 },
  "High Soil pH": { ...DEFAULT_INPUT, ph: 8.4 },
  "Low Soil pH": { ...DEFAULT_INPUT, ph: 4.2 },
  "Heat Stress": { ...DEFAULT_INPUT, airTemperature: 44, temperature: 40, humidity: 35, moisture: 27 },
  "High Humidity": { ...DEFAULT_INPUT, humidity: 96, rainfall: 18, rainProbability: 85 },
  "Heavy Rain": { ...DEFAULT_INPUT, rainfall: 72, rainProbability: 100, moisture: 48, humidity: 90 },
  Drought: { ...DEFAULT_INPUT, moisture: 8, rainfall: 0, humidity: 25, airTemperature: 39, light: 1750 },
  "Healthy Papaya": { ...DEFAULT_INPUT, nitrogen: 105, phosphorus: 52, potassium: 125, moisture: 60, airTemperature: 28, humidity: 62, light: 1250 },
};

const SOIL_FIELDS = [
  ["ph", "Soil pH", 3, 10, 0.1, ""], ["moisture", "Soil Moisture", 0, 100, 1, "%"], ["nitrogen", "Nitrogen (N)", 0, 200, 1, ""], ["phosphorus", "Phosphorus (P)", 0, 100, 1, ""], ["potassium", "Potassium (K)", 0, 200, 1, ""], ["iron", "Iron", 0, 100, 1, ""], ["magnesium", "Magnesium", 0, 100, 1, ""], ["calcium", "Calcium", 0, 160, 1, ""], ["organicMatter", "Organic Matter", 0, 10, 0.1, "%"], ["temperature", "Soil Temperature", 10, 45, 1, "°C"],
] as const;

const ENVIRONMENT_FIELDS = [
  ["airTemperature", "Air Temperature", 10, 50, 1, "°C"], ["humidity", "Relative Humidity", 20, 100, 1, "%"], ["light", "Light Intensity", 0, 2000, 10, "lux"], ["windSpeed", "Wind Speed", 0, 60, 1, "km/h"], ["rainfall", "Rainfall", 0, 100, 1, "mm"], ["rainProbability", "Rain Probability", 0, 100, 1, "%"],
] as const;

function toPlantState(input: PlantSimulationInput, result: ReturnType<typeof simulatePapayaPlant>): PlantState {
  const leafState = result.diseaseRisk > 70 ? "diseased" : result.overallStress > 45 ? "stressed" : "healthy";
  const mappedStage = result.growthStage === "Seedling" ? "Seedling" : result.growthStage === "Vegetative" ? "Vegetative" : result.growthStage === "Flowering" ? "Flowering" : "Fruiting";
  return { plantId: "simulation-papaya", species: "Papaya", height: result.growth.estimatedHeightCm, healthScore: result.healthScore, healthStatus: getStressLabel(100 - result.healthScore), disease: { name: null, confidence: 0, risk: result.diseaseRisk > 65 ? "HIGH" : result.diseaseRisk > 30 ? "MEDIUM" : "LOW" }, visualSymptoms: result.recommendations, leafStates: Array.from({ length: 12 }, () => leafState), lastAnalysis: null, soilMoisture: Math.min(100, input.moisture + input.rainfall * 0.45), temperature: input.airTemperature, humidity: input.humidity, light: input.light, diseaseRisk: result.diseaseRisk, growthStage: mappedStage, windSpeed: input.windSpeed, rainProbability: input.rainProbability, irrigation: result.waterRequirement !== "LOW" };
}

function SliderField({ field, value, onChange }: { field: readonly [string, string, number, number, number, string]; value: number; onChange: (value: number) => void }) {
  const [key, label, min, max, step, unit] = field;
  return <label className="block space-y-1.5" htmlFor={`sim-${key}`}><span className="flex items-center justify-between text-[11px] text-white/65"><span>{label}</span><strong className="font-mono text-white">{value}{unit ? ` ${unit}` : ""}</strong></span><input id={`sim-${key}`} type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} className="h-1.5 w-full cursor-pointer accent-emerald-400" /></label>;
}

function StatusPill({ label, tone = "neutral" }: { label: string; tone?: "good" | "warn" | "bad" | "neutral" }) {
  const tones = { good: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300", warn: "border-amber-400/20 bg-amber-400/10 text-amber-300", bad: "border-rose-400/20 bg-rose-400/10 text-rose-300", neutral: "border-white/10 bg-white/5 text-white/65" };
  return <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${tones[tone]}`}>{label}</span>;
}

function ResultMetric({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return <div className="border-l border-white/10 pl-3"><p className="text-[10px] uppercase tracking-wider text-white/40">{label}</p><p className="mt-1 text-lg font-semibold text-white">{value}</p>{detail && <p className="text-[10px] text-white/45">{detail}</p>}</div>;
}

export default function SimulationLab() {
  const [input, setInput] = useState<PlantSimulationInput>(DEFAULT_INPUT);
  const [selectedPreset, setSelectedPreset] = useState("Optimal Conditions");
  const [comparePreset, setComparePreset] = useState("Nitrogen Deficiency");
  const [compareOpen, setCompareOpen] = useState(false);
  const [mobileControls, setMobileControls] = useState(false);
  const result = useMemo(() => simulatePapayaPlant(input), [input]);
  const compareResult = useMemo(() => simulatePapayaPlant(PRESETS[comparePreset]), [comparePreset]);
  const plantState = useMemo(() => toPlantState(input, result), [input, result]);
  const envState: EnvironmentState = useMemo(() => ({ timeOfDay: "noon", rainActive: input.rainfall > 4 || input.rainProbability > 75, windSpeed: input.windSpeed }), [input.rainProbability, input.rainfall, input.windSpeed]);

  const updateValue = (key: string, value: number) => setInput((current) => ({ ...current, [key]: value }));
  const applyPreset = (name: string) => { setSelectedPreset(name); setInput({ ...PRESETS[name] }); };
  return <main className="min-h-screen w-full overflow-x-hidden overflow-y-auto bg-[#081410] text-white">
    <div className="grid min-h-screen lg:grid-cols-[350px_1fr]">
      <aside className={`${mobileControls ? "fixed inset-0 z-40" : "hidden"} border-r border-white/10 bg-[#0b1c16] lg:relative lg:block`}>
        <div className="flex h-full max-h-screen flex-col overflow-y-auto p-4 sm:p-5">
          <div className="mb-5 flex items-start justify-between"><div><div className="flex items-center gap-2 text-emerald-300"><Beaker className="h-4 w-4" /><span className="text-[10px] font-bold uppercase tracking-[0.22em]">Simulation Lab</span></div><h1 className="mt-2 text-2xl font-semibold tracking-tight">Papaya what-if model</h1><p className="mt-1 text-xs leading-5 text-white/45">A deterministic, rule-based agricultural simulation.</p></div><button className="rounded-md p-2 text-white/50 hover:bg-white/10 lg:hidden" onClick={() => setMobileControls(false)} aria-label="Close controls">×</button></div>
          <div className="mb-5 rounded-lg border border-amber-300/20 bg-amber-200/5 p-3"><div className="flex items-center gap-2 text-amber-200"><Gauge className="h-4 w-4" /><span className="text-[10px] font-bold uppercase tracking-widest">Simulation mode</span></div><p className="mt-2 text-[11px] leading-4 text-white/55">These values are simulated and do not represent real sensor measurements or laboratory results.</p></div>
          <div className="mb-5"><label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">Scenario preset</label><div className="grid grid-cols-2 gap-1.5">{Object.keys(PRESETS).map((name) => <button key={name} onClick={() => applyPreset(name)} className={`rounded-md border px-2 py-2 text-left text-[10px] transition ${selectedPreset === name ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-200" : "border-white/8 bg-white/5 text-white/55 hover:bg-white/10"}`}>{selectedPreset === name && <Check className="mr-1 inline h-3 w-3" />}{name}</button>)}</div></div>
          <section className="space-y-4"><SectionTitle icon={<Droplets className="h-3.5 w-3.5" />} title="Soil inputs" />{SOIL_FIELDS.map((field) => <SliderField key={field[0]} field={field} value={input[field[0] as keyof PlantSimulationInput] as number} onChange={(value) => updateValue(field[0], value)} />)}</section>
          <section className="mt-6 space-y-4"><SectionTitle icon={<CloudRain className="h-3.5 w-3.5" />} title="Environment inputs" />{ENVIRONMENT_FIELDS.map((field) => <SliderField key={field[0]} field={field} value={input[field[0] as keyof PlantSimulationInput] as number} onChange={(value) => updateValue(field[0], value)} />)}</section>
          <section className="mt-6 space-y-4"><SectionTitle icon={<Leaf className="h-3.5 w-3.5" />} title="Plant inputs" /><SliderField field={["ageDays", "Plant Age", 1, 730, 1, " days"]} value={input.ageDays} onChange={(value) => updateValue("ageDays", value)} /><SliderField field={["heightCm", "Plant Height", 10, 600, 1, " cm"]} value={input.heightCm} onChange={(value) => updateValue("heightCm", value)} /><label className="block text-[11px] text-white/65">Growth Stage<select value={input.growthStage} onChange={(event) => setInput((current) => ({ ...current, growthStage: event.target.value as PlantSimulationInput["growthStage"] }))} className="mt-1.5 w-full rounded-md border border-white/10 bg-white/5 px-2 py-2 text-xs text-white outline-none"><option>Seedling</option><option>Vegetative</option><option>Flowering</option><option>Fruit Formation</option><option>Fruit Development</option><option>Mature</option></select></label></section>
          <button onClick={() => { setInput({ ...DEFAULT_INPUT }); setSelectedPreset("Optimal Conditions"); }} className="mt-7 flex items-center justify-center gap-2 rounded-md border border-white/10 bg-white/5 py-2.5 text-xs font-semibold text-white/70 hover:bg-white/10"><RotateCcw className="h-3.5 w-3.5" /> Reset simulation</button>
        </div>
      </aside>

      <section className="relative flex min-h-screen min-w-0 flex-col bg-[#0b1714]">
        <header className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between border-b border-white/10 bg-[#0b1714]/80 px-4 py-3 backdrop-blur-xl sm:px-6"><div className="flex items-center gap-3"><div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-400/15 text-emerald-300"><Activity className="h-4 w-4" /></div><div><p className="text-sm font-semibold">Papaya Digital Twin</p><p className="text-[10px] uppercase tracking-wider text-white/35">Simulation view · derived visual response</p></div></div><button onClick={() => setMobileControls(true)} className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-white/65 lg:hidden">Controls</button><div className="hidden items-center gap-2 sm:flex"><StatusPill label="SIMULATION ONLY" tone="warn" /><span className="text-[10px] text-white/40">Manual inputs · no sensor writes</span></div></header>
        <div className="relative min-h-[360px] flex-1 pt-14 sm:min-h-[480px]"><PlantScene plantState={plantState} envState={envState} cameraView="default" onCameraViewCompleted={() => undefined} onSelect={() => undefined} selection={null} singlePlant /><div className="pointer-events-none absolute bottom-4 left-3 right-3 flex flex-col gap-2 sm:left-4 sm:right-4 sm:flex-row sm:justify-between sm:gap-3"><div className="glass-panel rounded-lg px-3 py-2"><p className="text-[10px] uppercase tracking-wider text-white/40">Visual response</p><p className="mt-1 text-xs text-white/75">{result.growth.condition} · {result.environmentalStatus.windStatus.toLowerCase()} movement</p></div><div className="glass-panel rounded-lg px-3 py-2 sm:text-right"><p className="text-[10px] uppercase tracking-wider text-white/40">Current scenario</p><p className="mt-1 break-words text-xs text-emerald-200">{selectedPreset}</p></div></div></div>
        <section className="border-t border-white/10 bg-[#0b1c16] px-4 py-4 sm:px-6"><div className="mb-4 flex items-center justify-between"><div><div className="flex items-center gap-2"><Scale className="h-4 w-4 text-emerald-300" /><h2 className="text-sm font-semibold">Simulation results</h2></div><p className="mt-1 text-[10px] text-white/40">Rule-based agricultural simulation · not scientifically validated</p></div><button onClick={() => setCompareOpen((open) => !open)} className="flex items-center gap-2 rounded-md border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-emerald-200"><Scale className="h-3.5 w-3.5" /> Compare scenarios <ChevronDown className={`h-3 w-3 transition ${compareOpen ? "rotate-180" : ""}`} /></button></div>
          <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 sm:grid-cols-4 xl:grid-cols-8"><ResultMetric label="Health" value={`${result.healthScore} / 100`} detail="Simulation Health Score" /><ResultMetric label="Stress" value={getStressLabel(result.overallStress)} detail={`${result.overallStress}% overall`} /><ResultMetric label="Water" value={result.waterRequirement} detail={input.rainfall > 10 ? "Rainfall contributing" : "Relative need"} /><ResultMetric label="Disease risk" value={`${result.diseaseRisk}%`} detail="Environmental indicator" /><ResultMetric label="Growth" value={result.growth.condition} detail={`${result.growthRate} cm/day estimate`} /><ResultMetric label="pH" value={result.soilStatus.phStatus} detail={`Stress ${result.soilStatus.phStress}`} /><ResultMetric label="Moisture" value={result.soilStatus.moistureStatus} detail={`${Math.round(plantState.soilMoisture)}% effective`} /><ResultMetric label="Temperature" value={result.environmentalStatus.temperatureStatus} detail={`${input.airTemperature}°C air`} /></div>
          {compareOpen && <div className="mt-5 rounded-lg border border-white/10 bg-black/10 p-4"><div className="flex flex-wrap items-center gap-3"><p className="text-xs font-semibold">Compare current scenario against</p><select value={comparePreset} onChange={(event) => setComparePreset(event.target.value)} className="rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white outline-none">{Object.keys(PRESETS).map((name) => <option key={name}>{name}</option>)}</select><span className="text-[10px] text-white/35">A: {selectedPreset} vs B: {comparePreset}</span></div><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5"><CompareMetric label="Health" a={`${result.healthScore}`} b={`${compareResult.healthScore}`} /><CompareMetric label="Growth" a={result.growth.condition} b={compareResult.growth.condition} /><CompareMetric label="Water" a={result.waterRequirement} b={compareResult.waterRequirement} /><CompareMetric label="Stress" a={`${result.overallStress}%`} b={`${compareResult.overallStress}%`} /><CompareMetric label="Disease risk" a={`${result.diseaseRisk}%`} b={`${compareResult.diseaseRisk}%`} /></div></div>}
          <div className="mt-4 grid gap-3 lg:grid-cols-[1.15fr_1fr]"> <div className="rounded-lg border border-white/10 bg-black/10 p-3"><div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-white/45"><AlertTriangle className="h-3.5 w-3.5" /> Recommendations</div><div className="space-y-1.5">{result.recommendations.slice(0, 3).map((recommendation) => <p key={recommendation} className="text-[11px] leading-4 text-white/65">• {recommendation}</p>)}</div></div><div className="rounded-lg border border-white/10 bg-black/10 p-3"><div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-white/45"><Leaf className="h-3.5 w-3.5" /> Nutrient simulation values</div><div className="grid grid-cols-3 gap-2">{([["N", result.nutrientStatus.nitrogen], ["P", result.nutrientStatus.phosphorus], ["K", result.nutrientStatus.potassium], ["Fe", result.nutrientStatus.iron], ["Mg", result.nutrientStatus.magnesium], ["Ca", result.nutrientStatus.calcium]] as const).map(([name, status]) => <div key={name} className="flex items-center justify-between text-[10px] text-white/65"><span>{name}</span><StatusPill label={status} tone={status === "OPTIMAL" ? "good" : status === "LOW" ? "warn" : "bad"} /></div>)}</div></div></div>
        </section>
      </section>
    </div>
  </main>;
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) { return <div className="flex items-center gap-2 border-b border-white/10 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">{icon}{title}</div>; }
function CompareMetric({ label, a, b }: { label: string; a: string; b: string }) { return <div className="rounded-md border border-white/8 bg-white/[0.03] p-2"><p className="text-[10px] uppercase tracking-wider text-white/35">{label}</p><div className="mt-2 flex items-center justify-between gap-2 text-xs"><span className="text-emerald-200">{a}</span><span className="text-white/25">vs</span><span className="text-amber-200">{b}</span></div></div>; }