import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface EmotionAnalysis {
  emotion: string;
  sentiment: "positive" | "negative" | "neutral";
  feedback: string;
  intensity: number; // 1-10
  transcription: string;
}

export async function analyzeVoiceEmotion(audioBase64: string, mimeType: string): Promise<EmotionAnalysis> {
  const model = "gemini-3-flash-preview";
  
  const prompt = `Analyze the audio with extreme precision (aiming for >97% accuracy in emotional detection). 
  1. Transcribe the spoken words exactly as they are heard.
  2. Analyze the emotional state focusing on tone, pitch, micro-tremors, and vocal energy.
  
  Provide the analysis in JSON format:
  - emotion: The primary emotion detected (e.g., Happy, Sad, Angry, Anxious, Calm).
  - sentiment: One of "positive", "negative", or "neutral".
  - feedback: A short, empathetic sentence providing feedback or a suggestion based on the emotion.
  - intensity: A number from 1 to 10 representing the emotional intensity.
  - transcription: The full text of what was said in the audio.`;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: audioBase64,
                mimeType: mimeType,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            emotion: { type: Type.STRING },
            sentiment: { type: Type.STRING, enum: ["positive", "negative", "neutral"] },
            feedback: { type: Type.STRING },
            intensity: { type: Type.NUMBER },
            transcription: { type: Type.STRING },
          },
          required: ["emotion", "sentiment", "feedback", "intensity", "transcription"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    
    return JSON.parse(text) as EmotionAnalysis;
  } catch (error) {
    console.error("Error analyzing voice emotion:", error);
    throw error;
  }
}
