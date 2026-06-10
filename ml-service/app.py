from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import librosa
import joblib
import io
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health():
    return {"status": "ok"}

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "emotion_model.pkl")
LE_PATH = os.path.join(BASE_DIR, "label_encoder.pkl")

model = joblib.load(MODEL_PATH)
le = joblib.load(LE_PATH)

def extract_features(audio_array, sr):
    audio = np.array(audio_array, dtype=np.float32)
    if len(audio.shape) > 1:
        audio = audio.mean(axis=0)
    mfcc = librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=40)
    chroma = librosa.feature.chroma_stft(y=audio, sr=sr)
    mel = librosa.feature.melspectrogram(y=audio, sr=sr)
    return np.hstack([
        np.mean(mfcc, axis=1),
        np.mean(chroma, axis=1),
        np.mean(mel, axis=1)
    ])

@app.post("/analyze")
async def analyze(file: UploadFile):
    try:
        contents = await file.read()
        audio_array, sr = librosa.load(io.BytesIO(contents), sr=22050, mono=True)
        features = extract_features(audio_array, sr).reshape(1, -1).astype(np.float32)

        pred_index = model.predict(features)[0]
        proba = model.predict_proba(features)[0]
        emotion = le.inverse_transform([pred_index])[0]
        confidence = float(np.max(proba))

        return {
            "emotion": emotion,
            "confidence": confidence
        }
    except Exception as e:
        print("ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))
