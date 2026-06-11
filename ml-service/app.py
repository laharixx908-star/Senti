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

# Exhaustive nuance rules — one clear trigger per emotion to prevent misclassification
NUANCES = """
EMOTION DECISION RULES — follow strictly, top rules override bottom ones:

PHYSICAL STATE (body-based, never emotional diagnoses):
- Sleepy      → tired, drowsy, wants to sleep, yawning ("I'm so sleepy", "I wanna nap", "can't keep eyes open")
- Exhausted   → physically or mentally drained after effort ("I'm burnt out", "I've been working non-stop", "no energy left")

NEGATIVE EMOTIONS — use precise definitions, do NOT over-diagnose:
- Depressed   → ONLY genuine hopelessness, emptiness, loss of meaning ("nothing matters", "I don't see the point", "I feel empty inside"). NEVER for tiredness, sadness, or temporary low mood.
- Heartbroken → romantic loss or deep grief ("she left me", "I miss him so much it hurts", "I lost my dog")
- Sad         → general unhappiness, disappointment, loss ("I didn't get the job", "my friend moved away", "I feel blue")
- Crying      → actively crying or describing crying ("I've been crying all day", "I can't stop crying", tears in voice)
- Lonely      → feeling isolated or missing connection ("nobody talks to me", "I feel so alone", "I have no one")
- Anxious     → worry, nervousness, overthinking ("I'm worried about", "what if something goes wrong", "I can't stop thinking")
- Fearful     → specific fear or threat ("I'm scared of", "something bad will happen", "I'm terrified")
- Angry       → frustration that has escalated to anger ("I hate this", "this is so unfair", "they betrayed me")
- Frustrated  → irritation at obstacles, not yet anger ("this keeps happening", "why won't it work", "I'm so done with this")
- Disgusted   → revulsion at something specific ("that's gross", "I can't believe they did that", "it's disgusting")
- Embarrassed → social shame or awkwardness ("everyone was looking", "I made a fool of myself", "so embarrassing")
- Jealous     → envy of others ("they have everything", "why does she get all the attention", "I wish I had that")

NEUTRAL / AMBIGUOUS:
- Confused    → genuinely uncertain or puzzled ("I don't understand", "what's going on", "I'm lost")
- Bored       → lack of stimulation ("nothing to do", "this is so dull", "I'm bored out of my mind")
- Neutral     → factual, flat, no strong emotion. Use as LAST RESORT only.

POSITIVE EMOTIONS:
- Happy       → calm, content joy ("I'm doing well", "had a nice day", "feeling good")
- Excited     → high energy anticipation ("I can't wait!", "this is amazing!", "I'm so pumped")
- Loving      → affection for a person ("I love you", "I miss her so much", "she means everything to me")
- Grateful    → thankfulness ("thank you so much", "I'm so lucky", "I appreciate everything")
- Proud       → achievement or admiration ("I did it", "I'm so proud of my son", "we won")
- Confident   → self-assurance ("I've got this", "I know I can do it", "I'm ready")
- Relieved    → stress lifted ("thank god it's over", "I was so worried but it's fine", "finally done")
- Hopeful     → optimism about future ("things will get better", "I think it'll work out", "I'm looking forward to")
- Nostalgic   → longing for the past ("I miss those days", "reminds me of childhood", "those were the times")
- Surprised   → unexpected news, shock ("I can't believe it", "no way!", "I didn't expect that")
"""

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
                    "max_tokens": 150,
                    "messages": [
                        {
                            "role": "system",
                            "content": (
                                "You are a precise emotion classifier. Analyze the spoken text and pick the SINGLE most accurate emotion.\n\n"
                                "ALLOWED EMOTIONS: " + EMOTIONS + "\n\n"
                                + NUANCES +
                                "\nAlso write 1-2 sentences of warm, specific, human feedback that responds directly to what they said — not generic.\n"
                                "Reply ONLY with valid JSON, no markdown, no extra text.\n"
                                'Example: {"emotion": "Frustrated", "confidence": 0.87, "feedback": "Sounds like this has been going wrong for a while — that wears you down."}'
                            ),
                        },
                        {
                            "role": "user",
                            "content": f'Classify this spoken text: "{transcription}"',
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
