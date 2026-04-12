from fastapi import FastAPI, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import requests
import os
import time

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

HF_TOKEN = os.environ.get("HF_TOKEN", "")
API_URL = "https://api-inference.huggingface.co/models/ehcalabres/wav2vec2-lg-xlsr-en-speech-emotion-recognition"

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

    print(f"Audio size: {len(contents)} bytes, type: {file.content_type}")

    for attempt in range(3):
        response = requests.post(API_URL, headers=headers, data=contents)
        print(f"HF status: {response.status_code}, response: {response.text[:300]}")

        if response.status_code == 200 and response.text.strip():
            result = response.json()
            if isinstance(result, list) and len(result) > 0:
                top = max(result, key=lambda x: x["score"])
                emotion = labels.get(top["label"], top["label"])
                print(f"Detected: {emotion}")
                return {"emotion": emotion, "confidence": round(top["score"], 2)}

        time.sleep(3)

    return {"emotion": "Neutral", "confidence": 0.5}
