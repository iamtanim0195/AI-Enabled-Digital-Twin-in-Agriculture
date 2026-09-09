# PlantTwin Step 3 backend

This FastAPI service loads `Saon110/bd-crop-vegetable-plant-disease-model` once at startup and exposes `POST /api/analyze-plant`.

## Setup

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Set `HF_TOKEN` in `backend/.env`. The token must have access to the gated Hugging Face repository. Never put it in the Next.js app or commit it.

## Run

From the project root:

```powershell
python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

The model downloads the repository's actual `config.json`, `class_mapping.json`, and `crop_veg_plant_disease_model.pth` through `huggingface_hub`. It is cached and loaded once during startup. The endpoint returns low-confidence and non-papaya responses without forcing a disease label.
