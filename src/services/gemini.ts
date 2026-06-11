export interface EmotionAnalysis {
  emotion: string;
  sentiment: "positive" | "negative" | "neutral";
  intensity: number;
  transcription: string;
  feedback: string;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const sentimentMap: Record<string, "positive" | "negative" | "neutral"> = {
  Happy: "positive",
  Surprised: "positive",
  Neutral: "neutral",
  Sad: "negative",
  Angry: "negative",
  Fearful: "negative",
  Disgusted: "negative",
};

const feedbackMap: Record<string, string> = {
  Happy: "You sound great — keep that energy up!",
  Surprised: "Something caught you off guard — exciting or unexpected!",
  Sad: "It's okay to feel down. Take it one step at a time.",
  Angry: "Take a deep breath. Things will get better.",
  Fearful: "It's okay to feel nervous. You've got this.",
  Neutral: "You sound calm and composed.",
  Disgusted: "Something seems off. Try to focus on the positive.",
};

export async function analyzeVoiceEmotion(blob: Blob): Promise<EmotionAnalysis> {
  const formData = new FormData();
  // Always send as .wav — backend expects WAV (librosa readable)
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
    feedback: feedbackMap[emotion] ?? "Analysis complete.",
  };
}

export async function wakeUpBackend() {
  try {
    await fetch(`${BACKEND_URL}/`);
  } catch (_) {}
}
