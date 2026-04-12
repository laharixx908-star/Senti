from fastapi import FastAPI, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import librosa
import joblib
import io
import os
import soundfile as sf
import onnxruntime as rt
import gdown

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "emotion_model.onnx")
LE_PATH = os.path.join(BASE_DIR, "label_encoder.pkl")

# Download from Google Drive if not present
if not os.path.exists(MODEL_PATH):
    gdown.download(f"https://drive.google.com/uc?id=1dU2hW-ym402VFkhJ-_Dz2l49llE5-6Un", MODEL_PATH, quiet=False)

if not os.path.exists(LE_PATH):
    gdown.download(f"https://drive.google.com/uc?id=13BcuF5SEdXAIdML7DMMGm0pRWPaD5iGd", LE_PATH, quiet=False)

model = rt.InferenceSession(MODEL_PATH)
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
    contents = await file.read()
    audio_array, sr = sf.read(io.BytesIO(contents))
    features = extract_features(audio_array, sr).reshape(1, -1).astype(np.float32)
    pred = model.run(
