import { useState, useRef, useEffect } from "react";
import { Mic, Square, Loader2, Play, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { analyzeVoiceEmotion, EmotionAnalysis } from "../services/gemini";

interface AudioRecorderProps {
  onAnalysisComplete: (analysis: EmotionAnalysis) => void;
  onRecordingStart: () => void;
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

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // ✅ FIXED: CALL ANALYSIS HERE
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });

        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        await handleAnalysis(audioBlob);
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

  // ✅ CLEAN ANALYSIS FUNCTION
  const handleAnalysis = async (blob: Blob) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const analysis = await analyzeVoiceEmotion(blob);
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

      {error && <div className="text-red-500">{error}</div>}

      {audioUrl && (
        <button
          onClick={() => new Audio(audioUrl).play()}
          className="text-white underline"
        >
          Play Recording
        </button>
      )}
    </div>
  );
}
