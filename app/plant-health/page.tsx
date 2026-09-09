"use client";

import { ChangeEvent, DragEvent, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, ShieldAlert, Sparkles, Activity, FileImage, Leaf, Gauge, History, ArrowRight, BrainCircuit, Apple, Sprout, Trees, LocateFixed } from "lucide-react";
import { mockHistory } from "@/lib/ai/plant-analysis";
import { analyzeWithHuggingFace, HuggingFaceAnalysis } from "@/lib/ai/huggingface-prediction";
import { AnalysisMode, PlantAnalysisResult, PlantImageInput, PapayaImageType } from "@/types/plant-analysis";
import { applyAIAnalysis, setAIStatus } from "@/lib/store/plant-store";

const PROCESS_STEPS = [
  "Preparing image",
  "Checking image quality",
  "Detecting papaya part",
  "Running disease analysis",
  "Checking nutrient stress",
  "Calculating visual health",
  "Preparing report",
];

const MODES: { key: AnalysisMode; label: string }[] = [
  { key: "AUTO_DETECT", label: "AUTO DETECT" },
  { key: "LEAF", label: "LEAF" },
  { key: "FRUIT", label: "FRUIT" },
  { key: "STEM", label: "STEM" },
  { key: "WHOLE_PLANT", label: "WHOLE PLANT" },
];

const initialResult: PlantAnalysisResult = {
  imageType: "UNKNOWN",
  analysisMode: "AUTO_DETECT",
  diseaseAnalysis: {
    disease: "Awaiting analysis",
    confidence: 0,
    risk: "LOW",
    possibleSymptoms: [],
    visualEvidence: [],
    affectedArea: "Not available",
    recommendedAction: "Upload a papaya image to begin the AI assessment.",
    explanation: "AI analysis has not started yet.",
  },
  nutrientAnalysis: {
    nutrientStatus: "Awaiting analysis",
    possibleDeficiencies: [],
    confidence: 0,
    risk: "LOW",
    visualEvidence: [],
    explanation: "Nutrient stress analysis has not started yet.",
    recommendation: "Upload an image to start nutrient visual assessment.",
  },
  healthAnalysis: {
    score: 0,
    status: "Pending",
    diseaseRisk: "LOW",
    nutrientStress: "LOW",
    visibleDamage: "Not available",
    overallConfidence: 0,
    summary: "AI visual health assessment is pending.",
  },
  imageQuality: {
    isSufficient: false,
    issues: [],
    message: "No image selected.",
    details: "Please upload a papaya image to begin the assessment.",
  },
  recommendations: ["Upload a papaya image to begin the AI assessment."],
  analysisDate: new Date().toISOString(),
  fileName: "",
};

function mapBackendResult(analysis: HuggingFaceAnalysis, fileName: string): PlantAnalysisResult {
  const imageType = analysis.image_type === "leaf" ? "LEAF" : "UNKNOWN";
  const disease = analysis.prediction.display_name;
  const diseaseConfidence = analysis.prediction.confidence_percent;
  return {
    imageType: imageType as PapayaImageType,
    analysisMode: "LEAF",
    diseaseAnalysis: {
      disease,
      confidence: diseaseConfidence,
      risk: analysis.risk.level,
      possibleSymptoms: [analysis.message || "Visual evidence classified by the papaya disease model."],
      visualEvidence: analysis.top_predictions.map((item) => `${item.display_name}: ${item.confidence_percent.toFixed(1)}%`),
      affectedArea: "Visible plant image",
      recommendedAction: analysis.recommendations[0] || "Continue monitoring and seek agricultural confirmation.",
      explanation: "AI prediction from Saon110/bd-crop-vegetable-plant-disease-model. This is not a confirmed diagnosis.",
    },
    nutrientAnalysis: {
      nutrientStatus: analysis.nutrient_analysis.status === "NOT_AVAILABLE" ? "Not available" : analysis.nutrient_analysis.status,
      possibleDeficiencies: [],
      confidence: 0,
      risk: "LOW",
      visualEvidence: [analysis.nutrient_analysis.message],
      explanation: analysis.nutrient_analysis.message,
      recommendation: "Use a dedicated nutrient model or laboratory testing for nutrient assessment.",
    },
    healthAnalysis: {
      score: analysis.health.score,
      status: analysis.health.status,
      diseaseRisk: analysis.risk.level,
      nutrientStress: "NOT_AVAILABLE",
      visibleDamage: analysis.prediction.display_name,
      overallConfidence: diseaseConfidence,
      summary: analysis.health.type,
    },
    imageQuality: { isSufficient: true, issues: [], message: "Image processed by FastAPI.", details: "" },
    recommendations: analysis.recommendations,
    analysisDate: new Date().toISOString(),
    fileName,
  };
}

export default function PlantHealthPage() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<PlantAnalysisResult>(initialResult);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>("AUTO_DETECT");
  const [huggingFaceAnalysis, setHuggingFaceAnalysis] = useState<HuggingFaceAnalysis | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const isReady = Boolean(selectedFile && previewUrl);

  const displayName = useMemo(() => {
    if (!selectedFile) return "No image selected";
    return selectedFile.name;
  }, [selectedFile]);

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      alert("Only JPG, JPEG, PNG, and WEBP files are supported.");
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);

    const nextUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(nextUrl);
    setIsAnalyzing(false);
    setResult(initialResult);
    setHuggingFaceAnalysis(null);
    setAnalysisError(null);
  };

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFiles(event.target.files);
  };

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    handleFiles(event.dataTransfer.files);
  };

  const removeImage = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setSelectedFile(null);
    setResult(initialResult);
    setHuggingFaceAnalysis(null);
    setAnalysisError(null);
    setIsAnalyzing(false);
    setActiveStep(0);
    if (inputRef.current) inputRef.current.value = "";
  };

  const runAnalysis = async () => {
    if (!selectedFile) return;

    const imageData: PlantImageInput = {
      name: selectedFile.name,
      size: selectedFile.size,
      type: selectedFile.type,
      width: 0,
      height: 0,
    };

    const img = new window.Image();
    const objectUrl = URL.createObjectURL(selectedFile);
    img.onload = async () => {
      imageData.width = img.width;
      imageData.height = img.height;
      URL.revokeObjectURL(objectUrl);

      try {
        const canvas = document.createElement("canvas");
        const sampleWidth = 256;
        const sampleHeight = Math.max(1, Math.round((img.height / img.width) * sampleWidth));
        canvas.width = sampleWidth;
        canvas.height = sampleHeight;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) throw new Error("Unable to prepare image pixels for visual analysis.");

        context.drawImage(img, 0, 0, sampleWidth, sampleHeight);
        const pixels = context.getImageData(0, 0, sampleWidth, sampleHeight);
        imageData.visualData = {
          width: sampleWidth,
          height: sampleHeight,
          data: Array.from(pixels.data),
        };

        setIsAnalyzing(true);
        setAIStatus("analyzing");
        setActiveStep(0);
        const progressTimer = window.setInterval(() => {
          setActiveStep((prev) => Math.min(prev + 1, PROCESS_STEPS.length - 1));
        }, 900);

        const externalPrediction = await analyzeWithHuggingFace(selectedFile, analysisMode);
        window.clearInterval(progressTimer);
        setResult(mapBackendResult(externalPrediction, selectedFile.name));
        setHuggingFaceAnalysis(externalPrediction);
        applyAIAnalysis(externalPrediction);
        setAnalysisError(null);
      } catch (error) {
        console.error("Analysis failed:", error);
        setAIStatus("error", error instanceof Error ? error.message : "AI service is temporarily unavailable.");
        setAnalysisError(error instanceof Error ? error.message : "AI service is temporarily unavailable.");
      } finally {
        setIsAnalyzing(false);
        setActiveStep(PROCESS_STEPS.length - 1);
      }
    };

    img.src = objectUrl;
  };

  const imageTypeLabel = result.imageType.replace("_", " / ").replace("WHOLE_PLANT", "WHOLE PLANT").replace("MULTIPLE_PARTS", "MULTIPLE PARTS");

  return (
    <main className="min-h-screen w-full bg-[#07111f] text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-emerald-300/80">Papaya AI Lab</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white md:text-4xl">Papaya AI Diagnostic Laboratory</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/70">
              AI-powered visual analysis for papaya leaves, fruits, stems, whole plants, and multi-part plant observations.
            </p>
          </div>
          <div className="glass-panel rounded-lg px-3 py-2 text-right">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">Status</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-amber-300">Prototype Preview</span>
            </div>
          </div>
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          {MODES.map((mode) => (
            <button
              key={mode.key}
              onClick={() => setAnalysisMode(mode.key)}
              className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] transition ${
                analysisMode === mode.key
                  ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200"
                  : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <section className="glass-panel rounded-2xl p-4 md:p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Image Upload</p>
                <h2 className="mt-1 text-lg font-semibold text-white">Papaya Plant Image</h2>
              </div>
              {selectedFile && (
                <button
                  onClick={removeImage}
                  className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-white/75 hover:bg-white/10"
                >
                  <X className="h-3.5 w-3.5" /> Remove
                </button>
              )}
            </div>

            <label
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              className={`group flex min-h-[300px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed p-4 text-center transition-all ${
                isDragging ? "border-emerald-400 bg-emerald-500/10" : "border-white/15 bg-white/5 hover:border-emerald-400/70 hover:bg-white/10"
              }`}
            >
              <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={onInputChange} />

              {previewUrl ? (
                <div className="w-full space-y-3">
                  <div className="overflow-hidden rounded-xl border border-white/10 bg-black/20">
                    <img src={previewUrl} alt="Papaya plant preview" className="h-[260px] w-full object-cover" />
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-left">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-white/80">{displayName}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-white/50">{selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : ""}</p>
                    </div>
                    <FileImage className="h-5 w-5 text-emerald-300" />
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-300">
                    <Upload className="h-8 w-8" />
                  </div>
                  <p className="text-base font-semibold text-white">Drop papaya image here</p>
                  <p className="mt-2 text-xs text-white/55">JPG, JPEG, PNG, or WEBP</p>
                  <span className="mt-4 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-white/70">
                    Browse files
                  </span>
                </>
              )}
            </label>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">Format</p>
                <p className="mt-2 text-sm font-medium text-white">{selectedFile?.type.replace("image/", "")?.toUpperCase() || "—"}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">Image Type</p>
                <p className="mt-2 text-sm font-medium text-white">{result.imageType === "UNKNOWN" ? "Not detected" : imageTypeLabel}</p>
              </div>
            </div>

            <button
              onClick={runAnalysis}
              disabled={!isReady || isAnalyzing}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              {isAnalyzing ? "Analyzing" : "Analyze Plant"}
            </button>
          </section>

          <section className="space-y-6">
            <div className="glass-panel rounded-2xl p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">AI Analysis Summary</p>
                  <h2 className="mt-1 text-xl font-semibold text-white">Papaya Plant Overview</h2>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1.5">
                  <BrainCircuit className="h-3.5 w-3.5 text-emerald-300" />
                  <span className="text-[10px] uppercase tracking-[0.2em] text-emerald-200">AI-assisted</span>
                </div>
              </div>

              <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">Detected image type</p>
                    <p className="mt-1 text-lg font-semibold text-white">{result.imageType === "UNKNOWN" ? "UNDETERMINED" : imageTypeLabel}</p>
                  </div>
                  <div className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-200">
                    {result.analysisMode}
                  </div>
                </div>
              </div>

              <div className="mb-4 rounded-xl border border-cyan-400/20 bg-cyan-500/5 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-200/70">Hugging Face image model</p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {huggingFaceAnalysis?.model.name || "Not connected"}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                    huggingFaceAnalysis ? "bg-emerald-500/15 text-emerald-200" : "bg-amber-500/15 text-amber-200"
                  }`}>
                    {huggingFaceAnalysis ? "CONNECTED" : "FALLBACK"}
                  </span>
                </div>
                {huggingFaceAnalysis ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {huggingFaceAnalysis.top_predictions.map((prediction) => (
                      <span key={prediction.label} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/80">
                        {prediction.display_name} {prediction.confidence_percent.toFixed(1)}%
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-white/55">Start the FastAPI backend and configure its HF_TOKEN to enable real model predictions.</p>
                )}
              </div>

              <details className="mb-4 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/75">
                <summary className="cursor-pointer font-semibold text-white">About this AI model</summary>
                <div className="mt-3 grid gap-2 text-xs text-white/65">
                  <p><span className="text-white/40">Model:</span> Saon110/bd-crop-vegetable-plant-disease-model</p>
                  <p><span className="text-white/40">Architecture:</span> ResNet50</p>
                  <p><span className="text-white/40">Task:</span> Plant disease classification</p>
                  <p><span className="text-white/40">Papaya classes:</span> 8</p>
                  <p className="text-amber-200/80">The model author&apos;s evaluation accuracy is not the accuracy of this application. Results are AI predictions, not confirmed diagnoses.</p>
                  <p className="text-white/55">This checkpoint&apos;s papaya classes are primarily disease classes for papaya leaf imagery. Fruit, stem, and whole-plant predictions require dedicated validated models.</p>
                </div>
              </details>

              {analysisError && (
                <div className="mb-4 rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-100">
                  {analysisError}
                </div>
              )}

              {isAnalyzing ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-white/60">
                    <span>Processing</span>
                    <span>{PROCESS_STEPS[activeStep]}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all duration-500"
                      style={{ width: `${((activeStep + 1) / PROCESS_STEPS.length) * 100}%` }}
                    />
                  </div>
                  <div className="grid gap-2 md:grid-cols-7">
                    {PROCESS_STEPS.map((step, index) => (
                      <div key={step} className="flex items-center gap-2">
                        <span className={`flex h-2.5 w-2.5 rounded-full ${index <= activeStep ? "bg-emerald-400" : "bg-white/10"}`} />
                        <span className="hidden text-[10px] text-white/50 md:block">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">Disease</p>
                    <p className="mt-2 text-xl font-bold text-white">{result.diseaseAnalysis.disease}</p>
                    <p className="mt-2 text-sm text-emerald-300">{result.diseaseAnalysis.confidence || 0}% confidence</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">Nutrient Stress</p>
                    <p className="mt-2 text-xl font-bold text-white">{result.nutrientAnalysis.nutrientStatus}</p>
                    <p className="mt-2 text-sm text-cyan-300">{result.nutrientAnalysis.confidence || 0}% confidence</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">AI Visual Health Score</p>
                    <p className="mt-2 text-3xl font-bold text-white">{result.healthAnalysis.score || 0}<span className="text-lg text-white/60"> / 100</span></p>
                    <p className="mt-2 text-sm text-amber-300">{result.healthAnalysis.status}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="glass-panel rounded-2xl p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-lg bg-rose-500/10 p-2 text-rose-300">
                    <ShieldAlert className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Disease Analysis</p>
                    <h3 className="text-lg font-semibold text-white">Papaya Disease Check</h3>
                  </div>
                </div>

                {result.diseaseAnalysis.disease === "Awaiting analysis" ? (
                  <div className="rounded-xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-white/55">
                    Upload an image to start the papaya disease assessment.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">Disease</p>
                        <p className="mt-1 text-base font-semibold text-white">{result.diseaseAnalysis.disease}</p>
                      </div>
                      <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                        result.diseaseAnalysis.risk === "HIGH" ? "bg-rose-500/20 text-rose-200" : result.diseaseAnalysis.risk === "MEDIUM" ? "bg-amber-500/20 text-amber-200" : "bg-emerald-500/20 text-emerald-200"
                      }`}>
                        {result.diseaseAnalysis.risk}
                      </span>
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between text-xs text-white/60">
                        <span>Confidence</span>
                        <span>{result.diseaseAnalysis.confidence || 0}%</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-white/5">
                        <div className="h-full rounded-full bg-gradient-to-r from-rose-400 to-orange-400" style={{ width: `${result.diseaseAnalysis.confidence || 0}%` }} />
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">Symptoms</p>
                      <ul className="mt-2 space-y-1.5 text-sm text-white/80">
                        {(result.diseaseAnalysis.possibleSymptoms.length ? result.diseaseAnalysis.possibleSymptoms : ["Insufficient visual evidence"]).map((item) => (
                          <li key={item} className="flex gap-2">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-rose-400" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">Visual evidence</p>
                      <ul className="mt-2 space-y-1.5 text-sm text-white/80">
                        {(result.diseaseAnalysis.visualEvidence.length ? result.diseaseAnalysis.visualEvidence : ["Insufficient visual evidence"]).map((item) => (
                          <li key={item} className="flex gap-2">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-cyan-400" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              <div className="glass-panel rounded-2xl p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-lg bg-amber-500/10 p-2 text-amber-300">
                    <Leaf className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Nutrient Stress</p>
                    <h3 className="text-lg font-semibold text-white">Visual Nutrient Analysis</h3>
                  </div>
                </div>

                {result.nutrientAnalysis.nutrientStatus === "Awaiting analysis" ? (
                  <div className="rounded-xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-white/55">
                    Nutrient stress analysis will appear after the image is processed.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">Status</p>
                        <p className="mt-1 text-base font-semibold text-white">{result.nutrientAnalysis.nutrientStatus}</p>
                      </div>
                      <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                        result.nutrientAnalysis.risk === "HIGH" ? "bg-rose-500/20 text-rose-200" : result.nutrientAnalysis.risk === "MEDIUM" ? "bg-amber-500/20 text-amber-200" : "bg-emerald-500/20 text-emerald-200"
                      }`}>
                        {result.nutrientAnalysis.risk}
                      </span>
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between text-xs text-white/60">
                        <span>Confidence</span>
                        <span>{result.nutrientAnalysis.confidence || 0}%</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-white/5">
                        <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-400" style={{ width: `${result.nutrientAnalysis.confidence || 0}%` }} />
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">Possible deficiency</p>
                      <p className="mt-2 text-sm text-white/80">
                        {result.nutrientAnalysis.possibleDeficiencies.length ? result.nutrientAnalysis.possibleDeficiencies.join(", ") : "Insufficient visual evidence"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-amber-300/20 bg-amber-500/5 p-3 text-sm text-amber-100/90">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-amber-200/80">Visual indication only — laboratory/soil testing is required for nutrient confirmation.</p>
                      <ul className="mt-2 space-y-1.5">
                        {(result.nutrientAnalysis.visualEvidence.length ? result.nutrientAnalysis.visualEvidence : ["Insufficient visual evidence"]).map((item) => (
                          <li key={item} className="flex gap-2">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-400" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {result.fruitAnalysis && (
              <div className="glass-panel rounded-2xl p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-lg bg-red-500/10 p-2 text-red-300">
                    <Apple className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Papaya Fruit Analysis</p>
                    <h3 className="text-lg font-semibold text-white">Fruit Condition</h3>
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">Condition</p>
                  <p className="mt-2 text-xl font-bold text-white">{result.fruitAnalysis.condition}</p>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">Disease / Symptom</p>
                      <p className="mt-2 text-white/85">{result.fruitAnalysis.diseaseOrSymptom}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">Risk</p>
                      <p className="mt-2 text-white/85">{result.fruitAnalysis.risk}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between text-xs text-white/60">
                      <span>Confidence</span>
                      <span>{result.fruitAnalysis.confidence}%</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-white/5">
                      <div className="h-full rounded-full bg-gradient-to-r from-red-500 to-orange-400" style={{ width: `${result.fruitAnalysis.confidence}%` }} />
                    </div>
                  </div>
                  <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">Visual evidence</p>
                    <ul className="mt-2 space-y-1.5 text-sm text-white/80">
                      {result.fruitAnalysis.visualEvidence.map((item) => (
                        <li key={item} className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-red-400" /><span>{item}</span></li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/80">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">Recommendation</p>
                    <p className="mt-2">{result.fruitAnalysis.recommendation}</p>
                  </div>
                </div>
              </div>
            )}

            {result.stemAnalysis && (
              <div className="glass-panel rounded-2xl p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-lg bg-violet-500/10 p-2 text-violet-300">
                    <Sprout className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Stem / Petiole Analysis</p>
                    <h3 className="text-lg font-semibold text-white">Possible symptom</h3>
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xl font-bold text-white">{result.stemAnalysis.possibleSymptom}</p>
                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between text-xs text-white/60">
                      <span>Confidence</span>
                      <span>{result.stemAnalysis.confidence}%</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-white/5">
                      <div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-indigo-500" style={{ width: `${result.stemAnalysis.confidence}%` }} />
                    </div>
                  </div>
                  <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">Visual evidence</p>
                    <ul className="mt-2 space-y-1.5 text-sm text-white/80">
                      {result.stemAnalysis.visualEvidence.map((item) => (
                        <li key={item} className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-violet-400" /><span>{item}</span></li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/80">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">Recommendation</p>
                    <p className="mt-2">{result.stemAnalysis.recommendation}</p>
                  </div>
                </div>
              </div>
            )}

            {result.wholePlantAnalysis && (
              <div className="glass-panel rounded-2xl p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-300">
                    <Trees className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Whole Plant Analysis</p>
                    <h3 className="text-lg font-semibold text-white">Overall plant assessment</h3>
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">Overall Plant Health</p>
                  <p className="mt-2 text-xl font-bold text-white">{result.wholePlantAnalysis.overallHealth}</p>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">Disease Risk</p>
                      <p className="mt-2 text-white/85">{result.wholePlantAnalysis.diseaseRisk}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">Nutrient Stress Risk</p>
                      <p className="mt-2 text-white/85">{result.wholePlantAnalysis.nutrientStressRisk}</p>
                    </div>
                  </div>
                  <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">Visible symptoms</p>
                    <ul className="mt-2 space-y-1.5 text-sm text-white/80">
                      {result.wholePlantAnalysis.visibleSymptoms.map((item) => (
                        <li key={item} className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400" /><span>{item}</span></li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/80">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">Growth condition</p>
                    <p className="mt-2">{result.wholePlantAnalysis.growthCondition}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="glass-panel rounded-2xl p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-300">
                    <Gauge className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Plant Health</p>
                    <h3 className="text-lg font-semibold text-white">AI Visual Health Score</h3>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="mb-3 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">Score</p>
                      <p className="mt-2 text-4xl font-bold text-white">{result.healthAnalysis.score || 0}<span className="text-lg text-white/50"> / 100</span></p>
                    </div>
                    <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                      {result.healthAnalysis.status}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="mb-2 flex items-center justify-between text-xs text-white/60">
                        <span>Disease risk</span>
                        <span>{result.healthAnalysis.diseaseRisk}</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-white/5">
                        <div className="h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-400" style={{ width: `${result.healthAnalysis.score ? Math.max(15, result.healthAnalysis.score) : 0}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between text-xs text-white/60">
                        <span>Nutrient stress</span>
                        <span>{result.healthAnalysis.nutrientStress}</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-white/5">
                        <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-cyan-400" style={{ width: `${result.healthAnalysis.score ? Math.max(20, result.healthAnalysis.score) : 0}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between text-xs text-white/60">
                        <span>Overall confidence</span>
                        <span>{result.healthAnalysis.overallConfidence || 0}%</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-white/5">
                        <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-500" style={{ width: `${result.healthAnalysis.overallConfidence || 0}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-panel rounded-2xl p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-300">
                    <Activity className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Recommendations</p>
                    <h3 className="text-lg font-semibold text-white">AI Guidance</h3>
                  </div>
                </div>

                <div className="space-y-3">
                  {result.recommendations.map((item) => (
                    <div key={item} className="flex gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/80">
                      <div className="mt-0.5 rounded-full bg-emerald-500/10 p-1 text-emerald-300">
                        <ArrowRight className="h-3.5 w-3.5" />
                      </div>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                {huggingFaceAnalysis && (
                  <button
                    onClick={() => router.push("/digital-twin")}
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/15 px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/25"
                  >
                    <Trees className="h-4 w-4" />
                    View in Digital Twin
                  </button>
                )}
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-lg bg-violet-500/10 p-2 text-violet-300">
                  <History className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Analysis History</p>
                  <h3 className="text-lg font-semibold text-white">Recent assessments</h3>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-[10px] uppercase tracking-[0.2em] text-white/50">
                      <th className="pb-3 pr-4 font-medium">Date</th>
                      <th className="pb-3 pr-4 font-medium">Image</th>
                      <th className="pb-3 pr-4 font-medium">Disease</th>
                      <th className="pb-3 pr-4 font-medium">Disease Confidence</th>
                      <th className="pb-3 pr-4 font-medium">Nutrient Stress</th>
                      <th className="pb-3 pr-4 font-medium">Health Score</th>
                      <th className="pb-3 font-medium">Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockHistory.map((row) => (
                      <tr key={`${row.date}-${row.image}`} className="border-b border-white/5 text-white/75 last:border-b-0">
                        <td className="py-3 pr-4">{row.date}</td>
                        <td className="py-3 pr-4">{row.image}</td>
                        <td className="py-3 pr-4">{row.disease}</td>
                        <td className="py-3 pr-4">{row.diseaseConfidence}%</td>
                        <td className="py-3 pr-4">{row.nutrientStress}</td>
                        <td className="py-3 pr-4">{row.healthScore}</td>
                        <td className="py-3">
                          <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                            row.risk === "HIGH" ? "bg-rose-500/20 text-rose-200" : row.risk === "MEDIUM" ? "bg-amber-500/20 text-amber-200" : "bg-emerald-500/20 text-emerald-200"
                          }`}>
                            {row.risk}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
