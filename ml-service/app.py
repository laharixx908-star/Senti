from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os, io, json, re, tempfile
import httpx

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

GROQ_API_KEY = os.environ["GROQ_API_KEY"]

@app.post("/analyze")
async def analyze(file: UploadFile):
    try:
        contents = await file.read()

        # Step 1: Transcribe with Whisper via Groq
        async with httpx.AsyncClient(timeout=30) as client:
            transcription_res = await client.post(
                "https://api.groq.com/openai/v1/audio/transcriptions",
                headers={"Authorization": f"Bearer {GROQ_API_KEY}"},
                files={"file": ("recording.wav", contents, "audio/wav")},
                data={"model": "whisper-large-v3-turbo", "response_format": "text"},
            )
            if transcription_res.status_code != 200:
                raise Exception(f"Whisper error: {transcription_res.text}")
            transcription = transcription_res.text.strip()

        # Step 2: Detect emotion with Llama via Groq
        async with httpx.AsyncClient(timeout=30) as client:
            emotion_res = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "llama-3.1-8b-instant",
                    "max_tokens": 100,
                    "messages": [
                        {
                            "role": "system",
                            "content": (
                                "You are an emotion detector. Given a sentence, "
                                "pick the single best emotion from this list ONLY: "
                                "Angry, Disgusted, Fearful, Happy, Neutral, Sad, Surprised. "
                                "Reply with ONLY valid JSON, no markdown, no explanation. "
                                'Example: {"emotion": "Happy", "confidence": 0.91}'
                            ),
                        },
                        {
                            "role": "user",
                            "content": f'Detect the emotion in this text: "{transcription}"',
                        },
                    ],
                },
            )
            if emotion_res.status_code != 200:
                raise Exception(f"Llama error: {emotion_res.text}")

            raw = emotion_res.json()["choices"][0]["message"]["content"].strip()
            raw = re.sub(r"^```[a-z]*\n?|```$", "", raw, flags=re.MULTILINE).strip()
            result = json.loads(raw)

        return {
            "emotion": result.get("emotion", "Neutral"),
            "confidence": float(result.get("confidence", 0.75)),
            "transcription": transcription,
        }

    except Exception as e:
        print("ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))
