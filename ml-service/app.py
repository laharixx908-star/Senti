from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os, json, re
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

EMOTIONS = (
    "Happy, Sad, Angry, Fearful, Disgusted, Surprised, Neutral, "
    "Loving, Crying, Depressed, Anxious, Excited, Grateful, Lonely, "
    "Confident, Embarrassed, Bored, Confused, Proud, Heartbroken"
)

@app.post("/analyze")
async def analyze(file: UploadFile):
    try:
        contents = await file.read()

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

        async with httpx.AsyncClient(timeout=30) as client:
            emotion_res = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "llama-3.3-70b-versatile",
                    "max_tokens": 120,
                    "messages": [
                        {
                            "role": "system",
                            "content": (
                                "You are a precise emotion detector and empathetic coach that analyzes spoken text. "
                                "Pick the single most accurate emotion from this list ONLY: " + EMOTIONS + ". "
                                "Important nuances:\n"
                                "- If someone is crying while saying happy words, pick Crying over Happy.\n"
                                "- If someone expresses love or affection, pick Loving.\n"
                                "- If someone sounds drained or hopeless (not just sad), pick Depressed.\n"
                                "- If someone sounds worried or nervous, pick Anxious.\n"
                                "- Excited is high-energy positive, different from Happy which is calm positive.\n"
                                "- Heartbroken is deep grief, more intense than Sad.\n"
                                "Also write a short, specific, empathetic feedback (1-2 sentences max) that directly responds to what the person actually said — not generic advice. "
                                "Make it feel human, warm, and personal to their exact words.\n"
                                "Reply with ONLY valid JSON, no markdown, no explanation. "
                                'Example: {"emotion": "Anxious", "confidence": 0.88, "feedback": "Sounds like a lot is riding on this — trust that you\'ve prepared for it."}'
                            ),
                        },
                        {
                            "role": "user",
                            "content": f'Detect the emotion and give personal feedback for this spoken text: "{transcription}"',
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
            "feedback": result.get("feedback", ""),
        }

    except Exception as e:
        print("ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))
