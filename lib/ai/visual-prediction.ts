import { AnalysisMode, PapayaImageType, PlantImageInput, RiskLevel } from "@/types/plant-analysis";

interface VisualFeatures {
  brightness: number;
  greenRatio: number;
  yellowRatio: number;
  redRatio: number;
  darkRatio: number;
  colorVariance: number;
  edgeContrast: number;
  aspectRatio: number;
}

export interface VisualPrediction {
  imageType: PapayaImageType;
  confidence: number;
  risk: RiskLevel;
  features: VisualFeatures;
  disease: string;
  symptoms: string[];
  evidence: string[];
  nutrientStatus: string;
  nutrientRisk: RiskLevel;
  deficiencies: string[];
}

function getVisualFeatures(image: PlantImageInput): VisualFeatures {
  const visualData = image.visualData;
  if (!visualData || visualData.data.length < 4) {
    return {
      brightness: 0.5,
      greenRatio: 0,
      yellowRatio: 0,
      redRatio: 0,
      darkRatio: 0,
      colorVariance: 0,
      edgeContrast: 0,
      aspectRatio: (image.width || 1) / (image.height || 1),
    };
  }

  const { data, width, height } = visualData;
  let brightness = 0;
  let greenRatio = 0;
  let yellowRatio = 0;
  let redRatio = 0;
  let darkRatio = 0;
  let colorVariance = 0;
  let edgeContrast = 0;
  let samples = 0;

  for (let index = 0; index < data.length; index += 4) {
    const red = data[index] / 255;
    const green = data[index + 1] / 255;
    const blue = data[index + 2] / 255;
    const value = (red + green + blue) / 3;
    const saturation = Math.max(red, green, blue) - Math.min(red, green, blue);

    brightness += value;
    colorVariance += saturation;
    greenRatio += green > red * 1.08 && green > blue * 1.08 ? 1 : 0;
    yellowRatio += red > blue * 1.25 && green > blue * 1.2 && red > 0.35 ? 1 : 0;
    redRatio += red > green * 1.18 && red > blue * 1.2 && red > 0.3 ? 1 : 0;
    darkRatio += value < 0.2 ? 1 : 0;

    if (index >= 4) {
      const previousBrightness = (data[index - 4] + data[index - 3] + data[index - 2]) / (255 * 3);
      edgeContrast += Math.abs(value - previousBrightness);
    }
    samples += 1;
  }

  return {
    brightness: brightness / samples,
    greenRatio: greenRatio / samples,
    yellowRatio: yellowRatio / samples,
    redRatio: redRatio / samples,
    darkRatio: darkRatio / samples,
    colorVariance: colorVariance / samples,
    edgeContrast: edgeContrast / samples,
    aspectRatio: width / Math.max(height, 1),
  };
}

function detectType(features: VisualFeatures, image: PlantImageInput, mode: AnalysisMode): PapayaImageType {
  if (mode === "LEAF") return "LEAF";
  if (mode === "FRUIT") return "FRUIT";
  if (mode === "STEM") return "STEM_PETIOLE";
  if (mode === "WHOLE_PLANT") return "WHOLE_PLANT";

  if (!image.visualData?.data.length) {
    const name = image.name.toLowerCase();
    if (/leaf|foliage|leaflet/.test(name)) return "LEAF";
    if (/fruit|papaya|melon|ripe|pulp|pod/.test(name)) return "FRUIT";
    if (/stem|petiole|trunk|branch|bark/.test(name)) return "STEM_PETIOLE";
    if (/plant|whole|tree|bush|full/.test(name)) return "WHOLE_PLANT";
  }

  if (features.redRatio > 0.16 || features.yellowRatio > 0.34) return "FRUIT";
  if (features.greenRatio > 0.22 && features.aspectRatio > 0.55 && features.aspectRatio < 1.8) return "LEAF";
  if (features.aspectRatio < 0.45 || features.aspectRatio > 2.4) return "STEM_PETIOLE";
  if (features.greenRatio > 0.12 && features.colorVariance > 0.28) return "WHOLE_PLANT";
  return "MULTIPLE_PARTS";
}

export function predictVisualPlantImage(image: PlantImageInput, mode: AnalysisMode): VisualPrediction {
  const features = getVisualFeatures(image);
  const imageType = detectType(features, image, mode);
  const hasVisualData = Boolean(image.visualData?.data.length);
  const confidence = hasVisualData ? Math.round(Math.min(96, 55 + features.greenRatio * 35 + features.colorVariance * 12)) : 20;
  const highTexture = features.edgeContrast > 0.12;
  const yellowing = features.yellowRatio > 0.18;
  const redOrBrown = features.redRatio > 0.1;

  let disease = "No clear disease pattern detected";
  let risk: RiskLevel = "LOW";
  let symptoms = ["No strong visual symptom pattern detected"];
  let evidence = ["Color distribution is broadly consistent with a plant image"];

  if (redOrBrown && highTexture) {
    disease = imageType === "FRUIT" ? "Possible fruit lesion pattern" : "Possible fungal or lesion pattern";
    risk = "HIGH";
    symptoms = ["Localized discoloration", "Irregular surface or lesion contrast"];
    evidence = ["Elevated red/brown pixel regions", "Increased local contrast suggests visible texture variation"];
  } else if (yellowing) {
    disease = "Possible chlorosis or visual stress";
    risk = "MEDIUM";
    symptoms = ["Yellowing or chlorosis", "Reduced green pigmentation"];
    evidence = ["Elevated yellow pixel regions", "Lower green-to-red separation"];
  } else if (features.darkRatio > 0.35) {
    disease = "Insufficient visible evidence";
    symptoms = ["Image contains substantial dark or occluded regions"];
    evidence = ["Low-light or obstructed pixels reduce model confidence"];
  }

  const nutrientStatus = yellowing ? "Possible Nitrogen or Magnesium Stress" : "No strong nutrient stress pattern detected";
  const nutrientRisk: RiskLevel = yellowing ? "MEDIUM" : "LOW";

  return {
    imageType,
    confidence,
    risk,
    features,
    disease,
    symptoms,
    evidence,
    nutrientStatus,
    nutrientRisk,
    deficiencies: yellowing ? ["Nitrogen", "Magnesium"] : [],
  };
}