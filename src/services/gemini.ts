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
  Sad: "negative",
  Angry: "negative",
  Fearful: "negative",
  Neutral: "neutral",
};

const feedbackMap: Record<string, string> = {
  Happy: "You sound great — keep that energy up!",
  Sad: "It's okay to feel down. Take it one step at a time.",
  Angry: "Take a deep breath. Things will get better.",
  Fearful: "It's okay to feel nervous. You've got this.",
  Neutral: "You sound calm and composed.",
};

export async function analyzeVoiceEmotion(blob: Blob): Promise<EmotionAnalysis> {
  const formData = new FormData();
  formData.append("file", blob, "recording.webm");

  const res = await fetch(`${BACKEND_URL}/analyze`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Backend error: ${res.status}`);
  }

  const data = await res.json();
  const emotion: string = data.emotion ?? "Neutral";

  return {
    emotion,
    sentiment: sentimentMap[emotion] ?? "neutral",
    intensity: Math.round((data.confidence ?? 0.5) * 10),
    transcription: "No speech detected",
    feedback: feedbackMap[emotion] ?? "Analysis complete.",
  };
}
