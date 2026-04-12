from fastapi import FastAPI, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import librosa
import joblib
import io
import soundfile as sf

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = joblib.load("emotion_model.pkl")
le = joblib.load("label_encoder.pkl")

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
    contents = await file.read()
    audio_array, sr = sf.read(io.BytesIO(contents))
    features = extract_features(audio_array, sr)
    features = features.reshape(1, -1)
    prediction = model.predict(features)[0]
    confidence = max(model.predict_proba(features)[0])
    emotion = le.inverse_transform([prediction])[0]
    return {"emotion": emotion, "confidence": round(float(confidence), 2)}
