import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mic2, Activity, ShieldCheck, Info } from "lucide-react";
import AudioRecorder from "./components/AudioRecorder";
import AnalysisResult from "./components/AnalysisResult";
import { EmotionAnalysis } from "./services/gemini";

export default function App() {
  const [analysis, setAnalysis] = useState<EmotionAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalysisComplete = (data: EmotionAnalysis) => {
    setAnalysis(data);
    setIsAnalyzing(false);
  };

  const handleRecordingStart = () => {
    setAnalysis(null);
    setIsAnalyzing(false);
  };

  return (
    <div className="min-h-screen bg-[#E6E6E6] text-[#151619] font-sans selection:bg-[#FF4444] selection:text-white">
      {/* Top Navigation / Header */}
      <header className="border-b border-[#151619]/10 py-6 px-8 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#151619] rounded-xl flex items-center justify-center shadow-lg">
            <Mic2 className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tighter uppercase">Sentivoice</h1>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#8E9299]">Emotion Analysis</span>
          </div>
        </div>
        
        <div className="hidden md:flex items-center gap-8">
          <button className="p-2 hover:bg-[#151619]/5 rounded-full transition-colors">
            <Info className="w-5 h-5 text-[#8E9299]" />
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Left Column: Recording Controls */}
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <h2 className="text-4xl font-bold tracking-tighter leading-none">
              Detect emotion through <br />
              <span className="text-[#FF4444]">vocal analysis.</span>
            </h2>
            <p className="text-[#8E9299] max-w-md leading-relaxed">
              Our AI analyzes pitch, tone, and vocal inflections to provide 
              real-time emotional feedback. Simply record a short clip to begin.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#151619]/5 text-[11px] font-mono uppercase tracking-wider text-[#8E9299]">
              <Activity className="w-3.5 h-3.5" />
              Real-time Processing
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#151619]/5 text-[11px] font-mono uppercase tracking-wider text-[#8E9299]">
              <ShieldCheck className="w-3.5 h-3.5" />
              Privacy Secured
            </div>
          </div>

          <div className="mt-4">
            <AudioRecorder 
              onAnalysisComplete={handleAnalysisComplete}
              onRecordingStart={handleRecordingStart}
            />
          </div>
        </div>

        {/* Right Column: Analysis Results */}
        <div className="flex flex-col gap-6 min-h-[400px]">
          <AnimatePresence mode="wait">
            {analysis ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full"
              >
                <AnalysisResult analysis={analysis} />
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center p-12 rounded-3xl border-2 border-dashed border-[#151619]/10 h-full min-h-[400px] text-center gap-4"
              >
                <div className="w-16 h-16 rounded-full bg-[#151619]/5 flex items-center justify-center">
                  <Activity className="w-8 h-8 text-[#8E9299]" />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="text-lg font-bold tracking-tight">No Data Detected</h3>
                  <p className="text-sm text-[#8E9299] max-w-[240px]">
                    Analysis results will appear here once you complete a recording.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Technical Specs Footer Removed */}
        </div>
      </main>

      {/* Background Decorative Elements */}
      <div className="fixed bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-white/50 to-transparent pointer-events-none -z-10" />
    </div>
  );
}
