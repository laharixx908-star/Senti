import { useState, useRef, useEffect } from "react";
import { Mic, Square, Loader2, Pause, Play, AlertCircle } from "lucide-react";
import { analyzeVoiceEmotion, EmotionAnalysis } from "../services/gemini";

interface AudioRecorderProps {
  onAnalysisComplete: (analysis: EmotionAnalysis) => void;
  onRecordingStart: () => void;
}

async function blobToWav(blob: Blob): Promise<Blob> {
  const arrayBuffer = await blob.arrayBuffer();
  const audioCtx = new AudioContext({ sampleRate: 22050 });
  const decoded = await audioCtx.decodeAudioData(arrayBuffer);
  const samples = decoded.getChannelData(0);
  const numSamples = samples.length;
  const sampleRate = decoded.sampleRate;
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);
  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  const clamp = (v: number) => Math.max(-1, Math.min(1, v));
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + numSamples * 2, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
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
  const [isPlaying, setIsPlaying] = useState(false);
  // playProgress: 0–1 representing how far through playback we are
  const [playProgress, setPlayProgress] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playProgressRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (playProgressRef.current) cancelAnimationFrame(playProgressRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      setError(null);
      setAudioUrl(null);
      setPlayProgress(0);
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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

  const togglePlayback = () => {
    if (!audioUrl) return;

    if (isPlaying) {
      // Pause
      audioRef.current?.pause();
      setIsPlaying(false);
      if (playProgressRef.current) cancelAnimationFrame(playProgressRef.current);
      return;
    }

    // Play from beginning if ended, else resume
    const audio = audioRef.current ?? new Audio(audioUrl);
    audioRef.current = audio;

    if (audio.ended) {
      audio.currentTime = 0;
      setPlayProgress(0);
    }

    audio.onended = () => {
      setIsPlaying(false);
      setPlayProgress(1);
      if (playProgressRef.current) cancelAnimationFrame(playProgressRef.current);
    };

    audio.play();
    setIsPlaying(true);

    // Animate the SVG ring in real-time
    const tick = () => {
      if (audio.duration && !audio.paused) {
        setPlayProgress(audio.currentTime / audio.duration);
        playProgressRef.current = requestAnimationFrame(tick);
      }
    };
    playProgressRef.current = requestAnimationFrame(tick);
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  // SVG ring constants
  const R = 52;           // radius of the progress ring (mic button is w-24 = 96px, so r = 48 + padding)
  const CX = 60;          // center of SVG
  const CY = 60;
  const CIRCUMFERENCE = 2 * Math.PI * R;
  const dashOffset = CIRCUMFERENCE * (1 - playProgress);

  return (
    <div className="flex flex-col items-center gap-6 p-8 rounded-3xl bg-[#151619] border border-[#2A2B2F] w-full max-w-md mx-auto">
      <div className="text-white text-2xl font-mono">
        {formatTime(recordingTime)}
      </div>

      {/* Mic button with SVG progress ring overlay */}
      <div className="relative flex items-center justify-center" style={{ width: 120, height: 120 }}>
        {/* Background ring track — always visible when audio exists */}
        {audioUrl && !isRecording && (
          <svg
            width="120"
            height="120"
            className="absolute top-0 left-0 pointer-events-none"
            style={{ transform: "rotate(-90deg)" }}
          >
            {/* Dim grey track */}
            <circle
              cx={CX}
              cy={CY}
              r={R}
              fill="none"
              stroke="#2A2B2F"
              strokeWidth="3"
            />
            {/* Red animated progress arc */}
            <circle
              cx={CX}
              cy={CY}
              r={R}
              fill="none"
              stroke="#FF4444"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              style={{ transition: isPlaying ? "none" : "stroke-dashoffset 0.3s ease" }}
            />
          </svg>
        )}

        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isAnalyzing}
          className="w-24 h-24 rounded-full bg-[#2A2B2F] flex items-center justify-center z-10"
        >
          {isAnalyzing ? (
            <Loader2 className="animate-spin text-white" size={28} />
          ) : isRecording ? (
            <Square className="text-white" size={28} />
          ) : (
            <Mic className="text-white" size={28} />
          )}
        </button>
      </div>

      {error && (
        <div className="text-red-500 flex items-center gap-2 text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Play / Pause button */}
      {audioUrl && !isRecording && !isAnalyzing && (
        <button
          onClick={togglePlayback}
          className="text-white flex items-center gap-2 text-sm hover:text-[#FF4444] transition-colors"
        >
          {isPlaying ? (
            <>
              <Pause size={16} fill="currentColor" /> Pause Recording
            </>
          ) : (
            <>
              <Play size={16} fill="currentColor" /> Play Recording
            </>
          )}
        </button>
      )}
    </div>
  );
}
