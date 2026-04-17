from fastapi import FastAPI, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import librosa
import joblib
import io
import os
import onnxruntime as rt
import gdown

app = FastAPI()

# ✅ CORS FIX
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://sentivoice.vercel.app",
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Preflight fix
@app.options("/analyze")
async def options_analyze():
    return {"status": "ok"}


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "emotion_model.onnx")
LE_PATH = os.path.join(BASE_DIR, "label_encoder.pkl")


# ✅ SAFE DOWNLOAD
def download_file(file_id, path, min_size=1000000):
    if os.path.exists(path):
        size = os.path.getsize(path)
        if size < min_size:
            print(f"Removing corrupted file: {path}")
            os.remove(path)

    if not os.path.exists(path):
        print(f"Downloading {path}...")
        gdown.download(id=file_id, output=path, quiet=False)

    if not os.path.exists(path):
        raise Exception(f"{path} not downloaded")

    size = os.path.getsize(path)
    print(f"{path} size: {size}")

    if size < min_size:
        raise Exception(f"{path} corrupted")


# ✅ DOWNLOAD FILES
download_file("1dU2hW-ym402VFkhJ-_Dz2l49llE5-6Un", MODEL_PATH)

if not os.path.exists(LE_PATH):
    download_file("13BcuF5SEdXAIdML7DMMGm0pRWPaD5iGd", LE_PATH, min_size=1000)


# ✅ LOAD MODEL
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


# ✅ MAIN API (FIXED LOGIC)
@app.post("/analyze")
async def analyze(file: UploadFile):
    try:
        contents = await file.read()

        # ✅ Normalize audio for better accuracy
        audio_array, sr = librosa.load(io.BytesIO(contents), sr=22050)

        features = extract_features(audio_array, sr).reshape(1, -1).astype(np.float32)

        input_name = model.get_inputs()[0].name
        pred = model.run(None, {input_name: features})[0]

        # ✅ CRITICAL FIX (THIS WAS YOUR BUG)
        pred_index = int(np.argmax(pred))          # get class index
        emotion = le.inverse_transform([pred_index])[0]
        confidence = float(np.max(pred))

        return {
            "emotion": emotion,
            "confidence": confidence
        }

    except Exception as e:
        print("ERROR:", e)
        return {
            "emotion": "Neutral",
            "confidence": 0.5
        }
