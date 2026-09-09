from __future__ import annotations

import json
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import torch
from huggingface_hub import hf_hub_download
from PIL import Image
from torch import Tensor, nn
from torchvision import models, transforms

MODEL_REPO = os.getenv("HF_MODEL_REPO", "Saon110/bd-crop-vegetable-plant-disease-model")
CHECKPOINT_FILENAME = "crop_veg_plant_disease_model.pth"
CONFIG_FILENAME = "config.json"
MAPPING_FILENAME = "class_mapping.json"
PAPAYA_LABELS = {
    "Papaya_Anthracnose",
    "Papaya_BacterialSpot",
    "Papaya_Curl",
    "Papaya_Healthy",
    "Papaya_Mealybug",
    "Papaya_Mite_disease",
    "Papaya_Mosaic",
    "Papaya_Ringspot",
}
DISPLAY_NAMES = {
    "Papaya_Anthracnose": "Papaya Anthracnose",
    "Papaya_BacterialSpot": "Papaya Bacterial Spot",
    "Papaya_Curl": "Papaya Leaf Curl",
    "Papaya_Healthy": "Healthy Papaya Leaf",
    "Papaya_Mealybug": "Papaya Mealybug Damage",
    "Papaya_Mite_disease": "Papaya Mite Disease",
    "Papaya_Mosaic": "Papaya Mosaic",
    "Papaya_Ringspot": "Papaya Ringspot",
}


@dataclass(frozen=True)
class Prediction:
    label: str
    display_name: str
    confidence: float
    is_papaya: bool


class PapayaDiseaseModel:
    def __init__(self) -> None:
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        token = os.getenv("HF_TOKEN")
        if not token:
            raise RuntimeError("HF_TOKEN is not configured on the backend.")

        cache_dir = os.getenv("HF_CACHE_DIR")
        download_kwargs: dict[str, Any] = {"repo_id": MODEL_REPO, "token": token}
        if cache_dir:
            download_kwargs["cache_dir"] = cache_dir

        checkpoint_path = hf_hub_download(filename=CHECKPOINT_FILENAME, **download_kwargs)
        config_path = hf_hub_download(filename=CONFIG_FILENAME, **download_kwargs)
        mapping_path = hf_hub_download(filename=MAPPING_FILENAME, **download_kwargs)

        self.config = json.loads(Path(config_path).read_text(encoding="utf-8"))
        self.id_to_label = self._load_mapping(mapping_path)
        self.model = self._load_resnet(checkpoint_path)
        self.model.to(self.device)
        self.model.eval()
        self.transform = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
        ])

    @staticmethod
    def _load_mapping(path: str) -> dict[int, str]:
        raw = json.loads(Path(path).read_text(encoding="utf-8"))
        if isinstance(raw, list):
            return {index: str(label) for index, label in enumerate(raw)}
        if isinstance(raw, dict):
            mapping = raw.get("id2label", raw)
            return {int(index): str(label) for index, label in mapping.items()}
        raise RuntimeError("The model class_mapping.json has an unsupported format.")

    def _load_resnet(self, checkpoint_path: str) -> nn.Module:
        class_count = len(self.id_to_label)
        config_count = self.config.get("num_labels")
        if isinstance(config_count, int):
            class_count = config_count

        model = models.resnet50(weights=None)
        model.fc = nn.Sequential(
            nn.Linear(model.fc.in_features, 512),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(512, class_count),
        )
        checkpoint = torch.load(checkpoint_path, map_location="cpu")
        state_dict = checkpoint.get("state_dict", checkpoint) if isinstance(checkpoint, dict) else checkpoint
        if isinstance(state_dict, dict) and "model_state_dict" in state_dict:
            state_dict = state_dict["model_state_dict"]
        if not isinstance(state_dict, dict):
            raise RuntimeError("The checkpoint does not contain a supported PyTorch state dict.")
        state_dict = {key.removeprefix("module."): value for key, value in state_dict.items()}
        model.load_state_dict(state_dict, strict=True)
        return model

    @property
    def model_name(self) -> str:
        return MODEL_REPO

    def predict(self, image: Image.Image, top_k: int = 3) -> list[Prediction]:
        tensor = self.transform(image.convert("RGB")).unsqueeze(0).to(self.device)
        with torch.inference_mode():
            probabilities = torch.softmax(self.model(tensor), dim=1)[0]
            scores, indices = torch.topk(probabilities, k=min(top_k, probabilities.shape[0]))

        predictions: list[Prediction] = []
        for score, index in zip(scores.tolist(), indices.tolist()):
            label = self.id_to_label.get(index, f"class_{index}")
            predictions.append(Prediction(
                label=label,
                display_name=DISPLAY_NAMES.get(label, label.replace("_", " ")),
                confidence=float(score),
                is_papaya=label in PAPAYA_LABELS,
            ))
        return predictions
