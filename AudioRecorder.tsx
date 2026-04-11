import { useState, useRef, useEffect } from "react";
import { Mic, Square, Loader2, Play, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { analyzeVoiceEmotion, EmotionAnalysis } from "../services/gemini";

interface AudioRecorderProps {
  onAnalysisComplete: (analysis: EmotionAnalysis) => void;
  onRecordingStart: () => void;
}

export default function AudioRecorder({ onAnalysisComplete, onRecordingStart }: AudioRecorderProps) {
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

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        
        // Convert to base64 and analyze
        handleAnalysis(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      onRecordingStart();
      
      setRecordingTime(0);
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Error accessing microphone:", err);
      setError("Microphone access denied or not available.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleAnalysis = async (blob: Blob) => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64data = (reader.result as string).split(",")[1];
        const analysis = await analyzeVoiceEmotion(base64data, blob.type);
        onAnalysisComplete(analysis);
        setIsAnalyzing(false);
      };
    } catch (err) {
      console.error("Analysis failed:", err);
      setError("Analysis failed. Please try again.");
      setIsAnalyzing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col items-center gap-6 p-8 rounded-3xl bg-[#151619] border border-[#2A2B2F] shadow-2xl w-full max-w-md mx-auto overflow-hidden relative">
      {/* Hardware-like grid background */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

      <div className="flex flex-col items-center gap-2 z-10">
        <span className="text-[10px] font-mono uppercase tracking-[2px] text-[#8E9299]">
          {isRecording ? "Recording Active" : isAnalyzing ? "Processing Data" : "System Ready"}
        </span>
        <div className="text-3xl font-mono text-white tracking-tighter">
          {formatTime(recordingTime)}
        </div>
      </div>

      <div className="relative flex items-center justify-center z-10">
        {/* Visualizer rings */}
        <AnimatePresence>
          {isRecording && (
            <>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.1, 0.3] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute w-32 h-32 rounded-full border border-[#FF4444]/30"
              />
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: [1, 1.8, 1], opacity: [0.2, 0.05, 0.2] }}
                transition={{ repeat: Infinity, duration: 3, delay: 0.5 }}
                className="absolute w-32 h-32 rounded-full border border-[#FF4444]/20"
              />
            </>
          )}
        </AnimatePresence>

        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isAnalyzing}
          className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 group ${
            isRecording 
              ? "bg-[#FF4444] shadow-[0_0_30px_rgba(255,68,68,0.4)]" 
              : "bg-[#2A2B2F] hover:bg-[#3A3B3F]"
          } ${isAnalyzing ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        >
          {isAnalyzing ? (
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          ) : isRecording ? (
            <Square className="w-10 h-10 text-white fill-white" />
          ) : (
            <Mic className="w-10 h-10 text-white group-hover:scale-110 transition-transform" />
          )}
        </button>
      </div>

      <div className="flex flex-col items-center gap-4 w-full z-10">
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-[#FF4444] text-xs font-mono"
          >
            <AlertCircle className="w-4 h-4" />
            {error}
          </motion.div>
        )}

        {audioUrl && !isRecording && !isAnalyzing && (
          <div className="flex items-center gap-3 bg-[#2A2B2F] px-4 py-2 rounded-full">
            <Play className="w-4 h-4 text-[#8E9299]" />
            <span className="text-[10px] font-mono text-[#8E9299] uppercase tracking-wider">Playback Ready</span>
            <button 
              onClick={() => {
                const audio = new Audio(audioUrl);
                audio.play();
              }}
              className="text-[10px] font-mono text-white uppercase hover:underline cursor-pointer"
            >
              Listen
            </button>
          </div>
        )}

        <div className="w-full h-px bg-[#2A2B2F]" />
        
        <div className="flex justify-between w-full px-2">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-mono uppercase text-[#8E9299]">Sample Rate</span>
            <span className="text-[11px] font-mono text-white">44.1 kHz</span>
          </div>
          <div className="flex flex-col gap-1 items-end">
            <span className="text-[9px] font-mono uppercase text-[#8E9299]">Format</span>
            <span className="text-[11px] font-mono text-white">WebM / Opus</span>
          </div>
        </div>
      </div>
    </div>
  );
}
