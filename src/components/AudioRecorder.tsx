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

export default function AudioRecorder({ onAnalysisComplete, onRecordingStart }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playProgress, setPlayProgress] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      setError(null);
      setAudioUrl(null);
      setPlayProgress(0);
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/ogg";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorder.onstop = async () => {
        const rawBlob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioUrl(URL.createObjectURL(rawBlob));
        await handleAnalysis(rawBlob);
      };
      mediaRecorder.start();
      setIsRecording(true);
      onRecordingStart();
      setRecordingTime(0);
      timerRef.current = window.setInterval(() => setRecordingTime((p) => p + 1), 1000);
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
    // Always create a fresh Audio object — never reuse a ref from a previous recording
    if (!audioRef.current) audioRef.current = new Audio(audioUrl);
    const audio = audioRef.current;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    if (audio.ended) { audio.currentTime = 0; setPlayProgress(0); }

    audio.onended = () => {
      setIsPlaying(false);
      setPlayProgress(1);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };

    audio.play();
    setIsPlaying(true);

    const tick = () => {
      if (audio.duration) setPlayProgress(audio.currentTime / audio.duration);
      if (!audio.paused && !audio.ended) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  // Ring geometry — wraps tightly around the 96px (w-24) button
  // Container is 112px, button is 96px, ring sits in the 8px gap on each side
  const SIZE = 112;
  const CX = SIZE / 2;
  const CY = SIZE / 2;
  const R = 52; // just outside the 48px button radius
  const CIRC = 2 * Math.PI * R;

  return (
    <div className="flex flex-col items-center gap-6 p-8 rounded-3xl bg-[#151619] border border-[#2A2B2F] w-full max-w-md mx-auto">
      <div className="text-white text-2xl font-mono">{formatTime(recordingTime)}</div>

      {/* Wrapper: SVG ring layered ON TOP of button via z-index */}
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        {/* Mic / Stop / Loading button — sits below the SVG ring */}
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isAnalyzing}
          style={{ width: 96, height: 96, top: 8, left: 8 }}
          className="absolute rounded-full bg-[#2A2B2F] flex items-center justify-center"
        >
          {isAnalyzing
            ? <Loader2 className="animate-spin text-white" size={28} />
            : isRecording
            ? <Square className="text-white" size={28} />
            : <Mic className="text-white" size={28} />}
        </button>

        {/* SVG ring — rendered ON TOP, pointer-events-none so clicks pass through */}
        <svg
          width={SIZE}
          height={SIZE}
          className="absolute top-0 left-0 pointer-events-none"
          style={{ transform: "rotate(-90deg)" }} // start arc from 12 o'clock
        >
          {/* Grey track — always shown when audio ready */}
          {audioUrl && !isRecording && (
            <circle cx={CX} cy={CY} r={R} fill="none" stroke="#3A3B3F" strokeWidth="4" />
          )}
          {/* Red progress arc */}
          {audioUrl && !isRecording && (
            <circle
              cx={CX}
              cy={CY}
              r={R}
              fill="none"
              stroke="#FF4444"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={CIRC * (1 - playProgress)}
            />
          )}
        </svg>
      </div>

      {error && (
        <div className="text-red-500 flex items-center gap-2 text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {audioUrl && !isRecording && !isAnalyzing && (
        <button
          onClick={togglePlayback}
          className="text-white flex items-center gap-2 text-sm hover:text-[#FF4444] transition-colors"
        >
          {isPlaying
            ? <><Pause size={16} fill="currentColor" /> Pause Recording</>
            : <><Play size={16} fill="currentColor" /> Play Recording</>}
        </button>
      )}
    </div>
  );
}
