import { GoogleGenAI } from "@google/genai";

export interface EmotionAnalysis {
  emotion: string;
  sentiment: "positive" | "negative" | "neutral";
  intensity: number;
  transcription: string;
  feedback: string;
}

export async function analyzeVoiceEmotion(
  base64data: string,
  mimeType: string
): Promise<EmotionAnalysis> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing VITE_GEMINI_API_KEY in .env");

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `You are an emotion analysis AI. Listen to this audio and respond ONLY with a valid JSON object — no markdown, no explanation, just raw JSON.

{
  "emotion": "one of: Happy, Sad, Angry, Fearful, Disgusted, Surprised, Neutral",
  "sentiment": "one of: positive, negative, neutral",
  "intensity": <number from 1 to 10>,
  "transcription": "<what the person said, or 'No speech detected'>",
  "feedback": "<one sentence of empathetic feedback based on the emotion>"
}`;

  const response = await ai.models.generateContent({
    model: "gemini-1.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType: mimeType as "audio/webm",
              data: base64data,
            },
          },
          { text: prompt },
        ],
      },
    ],
  });

  const text = response.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const clean = text.replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(clean) as EmotionAnalysis;
  } catch {
    throw new Error("Gemini returned invalid JSON: " + text);
  }
}
