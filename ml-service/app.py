from fastapi import FastAPI, UploadFile, File
import torch
import librosa
import numpy as np
from transformers import Wav2Vec2Processor, Wav2Vec2ForSequenceClassification

app = FastAPI()

model_name = "superb/wav2vec2-base-superb-er"
processor = Wav2Vec2Processor.from_pretrained(model_name)
model = Wav2Vec2ForSequenceClassification.from_pretrained(model_name)

labels = ["neutral", "happy", "sad", "angry"]

@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    audio_bytes = await file.read()

    # load audio
    y, sr = librosa.load(file.file, sr=16000)

    inputs = processor(y, sampling_rate=16000, return_tensors="pt", padding=True)

    with torch.no_grad():
        logits = model(**inputs).logits

    predicted_id = torch.argmax(logits, dim=-1).item()
    confidence = torch.softmax(logits, dim=-1)[0][predicted_id].item()

    return {
        "emotion": labels[predicted_id],
        "confidence": round(confidence * 100, 2)
    }
