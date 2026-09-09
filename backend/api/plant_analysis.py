from __future__ import annotations

import io
import os
from typing import Any

from fastapi import APIRouter, File, HTTPException, UploadFile
from PIL import Image, UnidentifiedImageError

from backend.ai.health_analysis import calculate_health
from backend.ai.nutrient_analysis import analyze_nutrients
from backend.ai.papaya_disease_model import PAPAYA_LABELS, PapayaDiseaseModel, Prediction

router = APIRouter()
_model: PapayaDiseaseModel | None = None
_model_error: str | None = None
MIN_CONFIDENCE = float(os.getenv("MIN_CONFIDENCE", "0.60"))
SUPPORTED_TYPES = {"image/jpeg", "image/png", "image/webp"}


def set_model(model: PapayaDiseaseModel) -> None:
    global _model
    _model = model


def set_model_error(message: str) -> None:
    global _model_error
    _model_error = message


def model_error() -> HTTPException:
    return HTTPException(status_code=503, detail=_model_error or "The papaya AI model is unavailable. Check backend model configuration.")


def risk_for(label: str) -> str:
    if label == "Papaya_Healthy":
        return "LOW"
    if label in {"Papaya_Anthracnose", "Papaya_BacterialSpot", "Papaya_Mosaic", "Papaya_Ringspot"}:
        return "HIGH"
    return "MEDIUM"


def prediction_payload(prediction: Prediction) -> dict[str, Any]:
    return {
        "label": prediction.label,
        "display_name": prediction.display_name,
        "confidence": round(prediction.confidence, 4),
        "confidence_percent": round(prediction.confidence * 100, 1),
    }


@router.post("/api/analyze-plant")
async def analyze_plant(file: UploadFile = File(...)) -> dict[str, Any]:
    if file.content_type not in SUPPORTED_TYPES:
        raise HTTPException(status_code=415, detail="Unsupported image format. Use JPG, JPEG, PNG, or WEBP.")
    if _model is None:
        raise model_error()

    try:
        image = Image.open(io.BytesIO(await file.read())).convert("RGB")
    except (UnidentifiedImageError, OSError):
        raise HTTPException(status_code=400, detail="The uploaded image is corrupt or invalid.") from None

    try:
        predictions = _model.predict(image, top_k=3)
    except Exception:
        raise HTTPException(status_code=503, detail="The AI model could not analyze this image.") from None

    top = predictions[0] if predictions else None
    papaya_predictions = [item for item in predictions if item.label in PAPAYA_LABELS]
    if top is None or top.confidence < MIN_CONFIDENCE:
        return {
            "success": True,
            "image_type": "unknown",
            "model": {"name": _model.model_name, "architecture": "ResNet50"},
            "prediction": {"label": "Uncertain", "display_name": "Uncertain", "confidence": top.confidence if top else 0, "confidence_percent": round((top.confidence if top else 0) * 100, 1)},
            "risk": {"level": "LOW", "type": "AI-assisted risk assessment"},
            "health": {"score": 50, "status": "Uncertain", "type": "AI Visual Health Score"},
            "nutrient_analysis": analyze_nutrients(),
            "top_predictions": [prediction_payload(item) for item in predictions],
            "recommendations": ["The AI could not confidently classify this image.", "Capture a clear, well-lit papaya leaf image and try again."],
            "status": "INSUFFICIENT CONFIDENCE",
            "message": "The AI could not confidently classify this image.",
        }

    if top.label not in PAPAYA_LABELS:
        return {
            "success": True,
            "image_type": "unknown",
            "model": {"name": _model.model_name, "architecture": "ResNet50"},
            "prediction": {"label": "Non-papaya or unknown", "display_name": "Unrecognized papaya condition", "confidence": top.confidence, "confidence_percent": round(top.confidence * 100, 1)},
            "risk": {"level": "LOW", "type": "AI-assisted risk assessment"},
            "health": {"score": 0, "status": "Unassessable", "type": "AI Visual Health Score"},
            "nutrient_analysis": analyze_nutrients(),
            "top_predictions": [prediction_payload(item) for item in predictions],
            "recommendations": ["Image may not contain a recognizable papaya condition."],
            "status": "NON_PAPAYA_OR_UNKNOWN",
            "message": "Image may not contain a recognizable papaya condition.",
        }

    risk_level = risk_for(top.label)
    return {
        "success": True,
        "image_type": "leaf",
        "model": {"name": _model.model_name, "architecture": "ResNet50"},
        "prediction": prediction_payload(top),
        "risk": {"level": risk_level, "type": "AI-assisted risk assessment"},
        "health": calculate_health(top.label, top.confidence, risk_level),
        "nutrient_analysis": analyze_nutrients(),
        "top_predictions": [prediction_payload(item) for item in papaya_predictions],
        "recommendations": [
            "This is an AI prediction, not a confirmed diagnosis.",
            "Capture another image in good daylight and monitor the plant for changes.",
        ],
        "status": "COMPLETE",
    }
