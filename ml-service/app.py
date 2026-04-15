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

# ✅ Robust download + validation
def download_file(url, path, min_size=1000000):  # 1MB default
    if not os.path.exists(path):
        print(f"Downloading {path}...")
        gdown.download(url, path, quiet=False, fuzzy=True)

    if not os.path.exists(path):
        raise Exception(f"{path} was not downloaded")

    size = os.path.getsize(path)
    print(f"{path} size: {size} bytes")

    if size < min_size:
        raise Exception(f"{path} is corrupted or too small")
# ✅ DELETE old corrupted model (ADD THIS)
if os.path.exists(MODEL_PATH):
    print("Removing old model file...")
    os.remove(MODEL_PATH)

# ✅ Download files safely
download_file(
    "https://drive.google.com/uc?id=1dU2hW-ym402VFkhJ-_Dz2l49llE5-6Un",
    MODEL_PATH
)

download_file(
    "https://drive.google.com/uc?id=13BcuF5SEdXAIdML7DMMGm0pRWPaD5iGd",
    LE_PATH,
    min_size=1000  # smaller file
)

# ✅ Safe model loading
try:
    print("Loading ONNX model...")
    model = rt.InferenceSession(MODEL_PATH)
    print("Model loaded successfully ✅")
except Exception as e:
    print("Model loading failed ❌:", e)
    raise

# ✅ Load label encoder
try:
    le = joblib.load(LE_PATH)
    print("Label encoder loaded ✅")
except Exception as e:
    print("Label encoder loading failed ❌:", e)
    raise


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

    # ⚠️ Ensure input name matches your ONNX model
    input_name = model.get_inputs()[0].name
    pred = model.run(None, {input_name: features})[0]

    emotion = le.inverse_transform(pred)[0]

    return {
        "emotion": emotion,
        "confidence": 0.9
    }
