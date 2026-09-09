from __future__ import annotations


def calculate_health(prediction_label: str, confidence: float, risk_level: str) -> dict[str, object]:
    if prediction_label == "Papaya_Healthy":
        score = round(80 + confidence * 20)
        status = "Healthy"
    elif risk_level == "HIGH":
        score = round(45 - confidence * 15)
        status = "Stressed"
    elif risk_level == "MEDIUM":
        score = round(65 - confidence * 10)
        status = "Potential stress"
    else:
        score = 50
        status = "Uncertain"

    return {
        "score": max(0, min(100, score)),
        "status": status,
        "type": "AI Visual Health Score",
    }
