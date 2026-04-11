export interface EmotionAnalysis {
  emotion: string;
  confidence: number;
  // add whatever fields your backend returns
}

export async function analyzeVoiceEmotion(
  base64data: string,
  mimeType: string
): Promise<EmotionAnalysis> {
  // Convert base64 back to blob
  const byteString = atob(base64data);
  const byteArray = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    byteArray[i] = byteString.charCodeAt(i);
  }
  const audioBlob = new Blob([byteArray], { type: mimeType });

  const formData = new FormData();
  formData.append("file", audioBlob);

  const res = await fetch("http://localhost:8000/analyze", {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  return data as EmotionAnalysis;
}
