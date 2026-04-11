from fastapi import FastAPI, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from transformers import pipeline
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

classifier = pipeline(
    "audio-classification",
    model="superb/wav2vec2-base-superb-er"
)

@app.post("/analyze")
async def analyze(file: UploadFile):
    contents = await file.read()

    with open("temp.mp3", "wb") as f:
        f.write(contents)

    tmp_path = os.path.abspath("temp.mp3")
    result = classifier(tmp_path)

    labels = {
        "hap": "Happy",
        "sad": "Sad",
        "ang": "Angry",
        "neu": "Neutral"
    }

    top = max(result, key=lambda x: x["score"])

    return {
        "emotion": labels.get(top["label"], top["label"]),
        "confidence": round(top["score"], 2)
    }
