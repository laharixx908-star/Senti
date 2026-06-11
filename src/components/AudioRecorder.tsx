import { useState, useRef, useEffect } from "react";
import { Mic, Square, Loader2, Play, AlertCircle } from "lucide-react";
import { analyzeVoiceEmotion, EmotionAnalysis } from "../services/gemini";

interface AudioRecorderProps {
  onAnalysisComplete: (analysis: EmotionAnalysis) => void;
  onRecordingStart: () => void;
}

// Convert any audio blob to WAV in the browser using Web Audio API
async function blobToWav(blob: Blob): Promise<Blob> {
  const arrayBuffer = await blob.arrayBuffer();
  const audioCtx = new AudioContext({ sampleRate: 22050 });
  const decoded = await audioCtx.decodeAudioData(arrayBuffer);

  const numChannels = 1; // mono
  const sampleRate = decoded.sampleRate;
  const samples = decoded.getChannelData(0); // take left/mono channel
  const numSamples = samples.length;

  // Build WAV file manually
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++)
      view.setUint8(offset + i, str.charCodeAt(i));
  };
  const clamp = (v: number) => Math.max(-1, Math.min(1, v));

  writeStr(0, "RIFF");
  view.setUint32(4, 36 + numSamples * 2, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, numSamples * 2, true);

  for (let i = 0; i < numSamples; i++) {
    view.setInt16(44 + i * 2, clamp(samples[i]) * 0x7fff, true);
  }

  await audioCtx.close();
  return new Blob([buffer], { type: "audio/wav" });
}

export default function AudioRecorder({
  onAnalysisComplete,
  onRecordingStart,
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      setError(null);
      setAudioUrl(null);
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Use the best supported format — we'll convert to WAV before sending
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/ogg";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const rawBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(rawBlob);
        setAudioUrl(url);
        await handleAnalysis(rawBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      onRecordingStart();

      setRecordingTime(0);
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error(err);
      setError("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleAnalysis = async (blob: Blob) => {
    setIsAnalyzing(true);
    setError(null);
    try {
      // Convert to WAV before sending — librosa can always read WAV
      const wavBlob = await blobToWav(blob);
      const analysis = await analyzeVoiceEmotion(wavBlob);
      onAnalysisComplete(analysis);
    } catch (err) {
      console.error(err);
      setError("Analysis failed. Try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="flex flex-col items-center gap-6 p-8 rounded-3xl bg-[#151619] border border-[#2A2B2F] w-full max-w-md mx-auto">
      <div className="text-white text-2xl font-mono">
        {formatTime(recordingTime)}
      </div>

      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isAnalyzing}
        className="w-24 h-24 rounded-full bg-[#2A2B2F] flex items-center justify-center"
      >
        {isAnalyzing ? (
          <Loader2 className="animate-spin text-white" />
        ) : isRecording ? (
          <Square className="text-white" />
        ) : (
          <Mic className="text-white" />
        )}
      </button>

      {error && (
        <div className="text-red-500 flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {audioUrl && !isRecording && !isAnalyzing && (
        <button
          onClick={() => new Audio(audioUrl).play()}
          className="text-white underline flex items-center gap-2"
        >
          <Play size={16} /> Play Recording
        </button>
      )}
    </div>
  );
}
