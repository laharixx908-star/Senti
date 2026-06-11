export interface EmotionAnalysis {
  emotion: string;
  sentiment: "positive" | "negative" | "neutral";
  intensity: number;
  transcription: string;
  feedback: string;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const sentimentMap: Record<string, "positive" | "negative" | "neutral"> = {
  Happy:       "positive",
  Excited:     "positive",
  Loving:      "positive",
  Grateful:    "positive",
  Confident:   "positive",
  Proud:       "positive",
  Surprised:   "positive",
  Neutral:     "neutral",
  Bored:       "neutral",
  Confused:    "neutral",
  Sad:         "negative",
  Angry:       "negative",
  Fearful:     "negative",
  Disgusted:   "negative",
  Crying:      "negative",
  Depressed:   "negative",
  Anxious:     "negative",
  Lonely:      "negative",
  Embarrassed: "negative",
  Heartbroken: "negative",
};

const feedbackMap: Record<string, string> = {
  Happy:       "You sound genuinely happy — hold onto that feeling!",
  Excited:     "That energy is contagious — something great must be happening!",
  Loving:      "So much warmth in your voice. Love looks good on you.",
  Grateful:    "Gratitude is a superpower. You're doing great.",
  Confident:   "You sound sure of yourself — own it!",
  Proud:       "You've earned that pride. Well done.",
  Surprised:   "Something caught you off guard — exciting or unexpected!",
  Neutral:     "You sound calm and composed.",
  Bored:       "Sounds like you need something to spark your interest.",
  Confused:    "It's okay to not have all the answers right now.",
  Sad:         "It's okay to feel down. Take it one step at a time.",
  Angry:       "Take a deep breath. Let it pass — you've got this.",
  Fearful:     "It's okay to feel nervous. You're stronger than you think.",
  Disgusted:   "Something clearly rubbed you the wrong way. That's valid.",
  Crying:      "Let it out. Crying takes courage. Things will get better.",
  Depressed:   "You don't have to carry this alone. One small step at a time.",
  Anxious:     "Breathe slowly. You're safe. Take it moment by moment.",
  Lonely:      "You're not as alone as you feel. Reach out to someone you trust.",
  Embarrassed: "Everyone has those moments. It passes faster than you think.",
  Heartbroken: "Heartbreak is real pain. Be gentle with yourself right now.",
};

export async function analyzeVoiceEmotion(blob: Blob): Promise<EmotionAnalysis> {
  const formData = new FormData();
  formData.append("file", blob, "recording.wav");

  const res = await fetch(`${BACKEND_URL}/analyze`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Backend error: ${res.status} — ${detail}`);
  }

  const data = await res.json();
  const emotion: string = data.emotion ?? "Neutral";

  return {
    emotion,
    sentiment: sentimentMap[emotion] ?? "neutral",
    intensity: Math.round((data.confidence ?? 0.5) * 10),
    transcription: data.transcription ?? "",
    feedback: data.feedback ?? feedbackMap[emotion] ?? "Analysis complete.",
  };
}

export async function wakeUpBackend() {
  try {
    await fetch(`${BACKEND_URL}/`);
  } catch (_) {}
}
