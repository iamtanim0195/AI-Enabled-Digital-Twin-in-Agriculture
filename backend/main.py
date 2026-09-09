from __future__ import annotations

import os
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv(Path(__file__).with_name(".env"))

from backend.ai.papaya_disease_model import PapayaDiseaseModel
from backend.api.plant_analysis import router, set_model, set_model_error


@asynccontextmanager
async def lifespan(_: FastAPI):
    try:
        set_model(PapayaDiseaseModel())
    except Exception as error:
        message = str(error)
        error_name = type(error).__name__
        if "403" in message or "gated" in message.lower() or "authorized list" in message.lower() or "GatedRepo" in error_name:
            set_model_error("Hugging Face access is not authorized for this model. Accept the model access terms and use a token from an authorized account.")
        else:
            set_model_error("The papaya AI model could not be loaded. Check backend configuration and model access.")
    yield


app = FastAPI(title="PlantTwin Papaya AI", version="3.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in os.getenv("FRONTEND_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")
        if origin.strip()
    ],
    allow_credentials=False,
    allow_methods=["POST", "GET"],
    allow_headers=["Content-Type"],
)
app.include_router(router)


@app.get("/health")
def health() -> dict[str, str | bool]:
    from backend.api.plant_analysis import _model, _model_error

    return {
        "status": "ok" if _model is not None else "degraded",
        "model_loaded": _model is not None,
        "message": _model_error or "Papaya AI model is ready.",
    }
