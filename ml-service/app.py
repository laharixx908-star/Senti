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

    # Retry up to 3 times (model may be loading)
    for attempt in range(3):
        response = requests.post(API_URL, headers=headers, data=contents)
        
        if response.status_code == 200 and response.text.strip():
            result = response.json()
            if isinstance(result, list) and len(result) > 0:
                top = max(result, key=lambda x: x["score"])
                emotion = labels.get(top["label"], top["label"])
                return {"emotion": emotion, "confidence": round(top["score"], 2)}
        
        # Model loading - wait and retry
        time.sleep(3)

    return {"emotion": "Neutral", "confidence": 0.5}
