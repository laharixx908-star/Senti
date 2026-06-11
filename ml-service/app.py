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
    "Confident, Embarrassed, Bored, Confused, Proud, Heartbroken, "
    "Sleepy, Exhausted, Frustrated, Relieved, Nostalgic, Jealous, Hopeful"
)

# Hard keyword rules — these override the LLM entirely to fix consistent misclassifications
KEYWORD_RULES = [
    ("Sleepy",     ["sleepy", "so sleepy", "feel sleepy", "very sleepy", "want to sleep",
                    "wanna sleep", "need to sleep", "take a nap", "power nap", "nap",
                    "drowsy", "yawn", "yawning", "falling asleep", "can't keep my eyes open",
                    "eyes are heavy", "dozing off"]),
    ("Exhausted",  ["exhausted", "burnt out", "burned out", "completely drained",
                    "no energy left", "worn out", "running on empty", "can't go on"]),
    ("Crying",     ["crying", "i'm crying", "i was crying", "been crying", "can't stop crying",
                    "tears", "sobbing", "i cried"]),
    ("Angry",      ["i hate", "so angry", "pissed off", "furious", "i'm enraged", "i want to scream"]),
    ("Frustrated", ["so frustrated", "keeps failing", "why won't it", "nothing works",
                    "i'm done with this", "fed up", "keeps going wrong"]),
    ("Loving",     ["i love you", "i love her", "i love him", "i love them",
                    "i miss you so much", "you mean everything"]),
    ("Anxious",    ["i'm anxious", "so anxious", "having anxiety", "panic attack",
                    "i keep worrying", "can't stop worrying"]),
    ("Depressed",  ["nothing matters", "feel empty", "don't want to go on",
                    "life has no meaning", "i feel hopeless", "no point anymore"]),
]

async def get_ai_feedback(transcription: str, emotion: str) -> str:
    """Get personalised feedback for a keyword-matched emotion."""
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            res = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
                json={
                    "model": "llama-3.3-70b-versatile",
                    "max_tokens": 80,
                    "messages": [
                        {
                            "role": "system",
                            "content": (
                                "Write 1-2 sentences of warm, specific, empathetic feedback "
                                "responding directly to what the person said. "
                                "No generic advice. Reply with ONLY the feedback text, no JSON, no quotes."
                            ),
                        },
                        {
                            "role": "user",
                            "content": f'The person said: "{transcription}". Detected emotion: {emotion}.',
                        },
                    ],
                },
            )
        if res.status_code == 200:
            return res.json()["choices"][0]["message"]["content"].strip()
    except Exception:
        pass
    return ""


@app.post("/analyze")
async def analyze(file: UploadFile):
    try:
        contents = await file.read()

        # Step 1: Transcribe
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

        t_lower = transcription.lower()

        # Step 2: Keyword pre-check — never trust LLM for obvious cases
        for emotion, keywords in KEYWORD_RULES:
            if any(kw in t_lower for kw in keywords):
                feedback = await get_ai_feedback(transcription, emotion)
                return {
                    "emotion": emotion,
                    "confidence": 0.95,
                    "transcription": transcription,
                    "feedback": feedback,
                }

        # Step 3: LLM classification for everything else
        async with httpx.AsyncClient(timeout=30) as client:
            emotion_res = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "llama-3.3-70b-versatile",
                    "max_tokens": 150,
                    "messages": [
                        {
                            "role": "system",
                            "content": (
                                "You are a precise emotion classifier. Pick the SINGLE most accurate emotion.\n\n"
                                "ALLOWED EMOTIONS: " + EMOTIONS + "\n\n"
                                "RULES:\n"
                                "- Neutral = absolute last resort. If any emotion fits even slightly, use it.\n"
                                "- Depressed = ONLY hopeless/empty/meaningless speech. Never tiredness.\n"
                                "- Frustrated = mild-to-medium irritation at obstacles. Angry = escalated rage.\n"
                                "- Excited = high-energy. Happy = calm contentment.\n"
                                "- Heartbroken = deep romantic/grief loss. Sad = general unhappiness.\n"
                                "- Loving = affection for a person. Grateful = thankfulness.\n\n"
                                "FEW-SHOT EXAMPLES:\n"
                                '{"input": "I\'m so happy today!", "emotion": "Happy"}\n'
                                '{"input": "I can\'t believe they did that to me", "emotion": "Angry"}\n'
                                '{"input": "I keep messing this up, why won\'t it work", "emotion": "Frustrated"}\n'
                                '{"input": "She left me and I don\'t know what to do", "emotion": "Heartbroken"}\n'
                                '{"input": "I\'m so nervous about the interview tomorrow", "emotion": "Anxious"}\n'
                                '{"input": "I just finished the project, thank god", "emotion": "Relieved"}\n\n'
                                "Also write 1-2 sentences of warm specific feedback responding to their exact words.\n"
                                "Reply ONLY with valid JSON.\n"
                                'Example: {"emotion": "Anxious", "confidence": 0.88, "feedback": "That interview pressure is real — trust your prep."}'
                            ),
                        },
                        {
                            "role": "user",
                            "content": f'Classify: "{transcription}"',
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
