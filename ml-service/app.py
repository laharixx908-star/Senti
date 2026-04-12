from fastapi import FastAPI, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import requests
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

HF_TOKEN = os.environ.get("HF_TOKEN", "")
API_URL = "https://api-inference.huggingface.co/models/superb/wav2vec2-base-superb-er"

labels = {
    "hap": "Happy",
    "sad": "Sad",
    "ang": "Angry",
    "neu": "Neutral"
}

@app.post("/analyze")
async def analyze(file: UploadFile):
    contents = await file.read()

    headers = {"Authorization": f"Bearer {HF_TOKEN}"} if HF_TOKEN else {}
    response = requests.post(API_URL, headers=headers, data=contents)
    result = response.json()

    if isinstance(result, list):
        top = max(result, key=lambda x: x["score"])
        emotion = labels.get(top["label"], top["label"])
        confidence = round(top["score"], 2)
    else:
        emotion = "Neutral"
        confidence = 0.5

    return {"emotion": emotion, "confidence": confidence}
