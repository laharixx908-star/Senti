import { motion } from "motion/react";
import { EmotionAnalysis } from "../services/gemini";
import { Smile, Frown, Meh, AlertTriangle, Zap, Info } from "lucide-react";

interface AnalysisResultProps {
  analysis: EmotionAnalysis;
}

export default function AnalysisResult({ analysis }: AnalysisResultProps) {
  const getIcon = () => {
    switch (analysis.sentiment) {
      case "positive": return <Smile className="w-8 h-8 text-[#00FF00]" />;
      case "negative": return <Frown className="w-8 h-8 text-[#FF4444]" />;
      case "neutral": return <Meh className="w-8 h-8 text-[#8E9299]" />;
      default: return <Info className="w-8 h-8 text-[#8E9299]" />;
    }
  };

  const getSentimentColor = () => {
    switch (analysis.sentiment) {
      case "positive": return "text-[#00FF00]";
      case "negative": return "text-[#FF4444]";
      case "neutral": return "text-[#8E9299]";
      default: return "text-white";
    }
  };

  return (
    <div className="flex flex-col gap-6 p-8 rounded-3xl bg-[#151619] border border-[#2A2B2F] shadow-2xl w-full max-w-md mx-auto relative overflow-hidden">
      {/* Hardware grid background */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

      <div className="flex items-center justify-between z-10">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-mono uppercase tracking-[2px] text-[#8E9299]">Analysis Result</span>
          <h2 className={`text-3xl font-mono uppercase tracking-tighter ${getSentimentColor()}`}>
            {analysis.emotion}
          </h2>
        </div>
        <div className="p-3 rounded-2xl bg-[#2A2B2F] border border-[#3A3B3F]">
          {getIcon()}
        </div>
      </div>

      <div className="flex flex-col gap-4 z-10">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-wider text-[#8E9299]">
            <span>Intensity</span>
            <span>{analysis.intensity}/10</span>
          </div>
          <div className="h-2 bg-[#2A2B2F] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${analysis.intensity * 10}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-full ${getSentimentColor().replace('text-', 'bg-')}`}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 p-4 rounded-2xl bg-[#2A2B2F]/30 border border-[#2A2B2F]">
          <span className="text-[9px] font-mono uppercase text-[#8E9299] tracking-widest">Transcription</span>
          <p className="text-sm text-white font-medium leading-relaxed">
            {analysis.transcription}
          </p>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-[#2A2B2F]/50 border border-[#2A2B2F] z-10">
        <p className="text-sm text-[#8E9299] leading-relaxed italic">
          "{analysis.feedback}"
        </p>
      </div>

      <div className="w-full h-px bg-[#2A2B2F] z-10" />

      <div className="flex justify-between w-full px-2 z-10">
        <div className="flex flex-col gap-1">
          <span className="text-[9px] font-mono uppercase text-[#8E9299]">Sentiment</span>
          <span className={`text-[11px] font-mono uppercase ${getSentimentColor()}`}>
            {analysis.sentiment}
          </span>
        </div>
        <div className="flex flex-col gap-1 items-end">
          <span className="text-[9px] font-mono uppercase text-[#8E9299]">Status</span>
          <span className="text-[11px] font-mono text-[#00FF00] uppercase">Verified</span>
        </div>
      </div>
    </div>
  );
}
