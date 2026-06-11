import { motion } from "motion/react";
import { EmotionAnalysis } from "../services/gemini";

interface AnalysisResultProps {
  analysis: EmotionAnalysis;
}

const emotionColor: Record<string, string> = {
  Happy:       "#00FF00",
  Excited:     "#FFD700",
  Loving:      "#FF69B4",
  Grateful:    "#00FFCC",
  Confident:   "#00BFFF",
  Proud:       "#AA44FF",
  Surprised:   "#FF9500",
  Relieved:    "#44FFAA",
  Hopeful:     "#88DDFF",
  Nostalgic:   "#FFBB66",
  Neutral:     "#8E9299",
  Bored:       "#6B7280",
  Confused:    "#AAAAFF",
  Sleepy:      "#9988FF",
  Exhausted:   "#CC8866",
  Sad:         "#4488FF",
  Angry:       "#FF4444",
  Fearful:     "#FF8800",
  Disgusted:   "#88FF44",
  Crying:      "#66AAFF",
  Depressed:   "#7766AA",
  Anxious:     "#FFAA00",
  Lonely:      "#88AACC",
  Embarrassed: "#FF6688",
  Heartbroken: "#FF2255",
  Frustrated:  "#FF6622",
  Jealous:     "#AADD00",
};

const getSentimentColor = (sentiment: string) => {
  if (sentiment === "positive") return "#00FF00";
  if (sentiment === "negative") return "#FF4444";
  return "#8E9299";
};

function NeonEmoji({ emotion, color: s }: { emotion: string; color: string }) {
  const glow = `drop-shadow(0 0 6px ${s}) drop-shadow(0 0 12px ${s})`;

  const face = (mouth: React.ReactNode, extras?: React.ReactNode) => (
    <svg viewBox="0 0 48 48" width="36" height="36" style={{ filter: glow }} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="20" stroke={s} strokeWidth="2.5" />
      <circle cx="17" cy="19" r="2" fill={s} />
      <circle cx="31" cy="19" r="2" fill={s} />
      {extras}
      {mouth}
    </svg>
  );

  switch (emotion) {
    case "Happy":
      return face(<path d="M16 28 Q24 36 32 28" stroke={s} strokeWidth="2.5" strokeLinecap="round" />);

    case "Excited":
      return face(
        <path d="M14 28 Q24 38 34 28" stroke={s} strokeWidth="2.5" strokeLinecap="round" />,
        <><line x1="6" y1="8" x2="6" y2="13" stroke={s} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="3.5" y1="10.5" x2="8.5" y2="10.5" stroke={s} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="41" y1="6" x2="41" y2="11" stroke={s} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="38.5" y1="8.5" x2="43.5" y2="8.5" stroke={s} strokeWidth="1.5" strokeLinecap="round"/></>
      );

    case "Loving":
      return face(
        <path d="M16 28 Q24 36 32 28" stroke={s} strokeWidth="2.5" strokeLinecap="round" />,
        <path d="M21 10 C21 8 19 6 17 8 C15 10 17 13 21 15 C25 13 27 10 25 8 C23 6 21 8 21 10Z" fill={s} />
      );

    case "Grateful":
      return face(
        <path d="M17 28 Q24 34 31 28" stroke={s} strokeWidth="2.5" strokeLinecap="round" />,
        <>
          <path d="M14 19 Q17 17 20 19" stroke={s} strokeWidth="2" strokeLinecap="round" />
          <path d="M28 19 Q31 17 34 19" stroke={s} strokeWidth="2" strokeLinecap="round" />
          <circle cx="17" cy="19" r="2" fill="transparent" />
          <circle cx="31" cy="19" r="2" fill="transparent" />
        </>
      );

    case "Confident":
      return face(<path d="M19 29 Q26 34 33 29" stroke={s} strokeWidth="2.5" strokeLinecap="round" />);

    case "Proud":
      return face(
        <path d="M17 28 Q24 35 31 28" stroke={s} strokeWidth="2.5" strokeLinecap="round" />,
        <polyline points="10,14 14,8 19,12 24,6 29,12 34,8 38,14" stroke={s} strokeWidth="2" strokeLinejoin="round" fill="none"/>
      );

    case "Surprised":
      return face(
        <ellipse cx="24" cy="31" rx="5" ry="5" stroke={s} strokeWidth="2.5" />,
        <>
          <path d="M13 15 Q17 12 21 15" stroke={s} strokeWidth="2" strokeLinecap="round" />
          <path d="M27 15 Q31 12 35 15" stroke={s} strokeWidth="2" strokeLinecap="round" />
          <circle cx="17" cy="19" r="2" fill="transparent" />
          <circle cx="31" cy="19" r="2" fill="transparent" />
        </>
      );

    case "Relieved":
      return face(
        <path d="M16 28 Q24 34 32 28" stroke={s} strokeWidth="2.5" strokeLinecap="round" />,
        // sweat wiped away
        <path d="M36 10 Q34 14 36 16 Q38 14 36 10Z" fill={s} opacity="0.5" />
      );

    case "Hopeful":
      return face(
        <path d="M16 28 Q24 35 32 28" stroke={s} strokeWidth="2.5" strokeLinecap="round" />,
        // star
        <polygon points="24,3 25.5,7.5 30,7.5 26.5,10 28,14.5 24,12 20,14.5 21.5,10 18,7.5 22.5,7.5" fill={s} opacity="0.8" />
      );

    case "Nostalgic":
      return face(
        <path d="M16 28 Q24 33 32 28" stroke={s} strokeWidth="2.5" strokeLinecap="round" />,
        // clock hands suggesting time passing
        <>
          <circle cx="40" cy="10" r="5" stroke={s} strokeWidth="1.5" />
          <line x1="40" y1="7" x2="40" y2="10" stroke={s} strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="40" y1="10" x2="43" y2="10" stroke={s} strokeWidth="1.5" strokeLinecap="round"/>
        </>
      );

    case "Neutral":
      return face(<line x1="17" y1="30" x2="31" y2="30" stroke={s} strokeWidth="2.5" strokeLinecap="round" />);

    case "Bored":
      return face(
        <path d="M17 31 Q24 28 31 31" stroke={s} strokeWidth="2.5" strokeLinecap="round" />,
        <path d="M13 17 Q17 20 21 17" stroke={s} strokeWidth="2" strokeLinecap="round" />
      );

    case "Confused":
      return face(
        <path d="M16 30 Q19 27 22 30 Q25 33 28 30 Q31 27 34 30" stroke={s} strokeWidth="2.5" strokeLinecap="round" fill="none" />,
        <text x="38" y="12" fontSize="10" fill={s} fontWeight="bold">?</text>
      );

    case "Sleepy":
      return face(
        <path d="M17 29 Q24 33 31 29" stroke={s} strokeWidth="2.5" strokeLinecap="round" />,
        <>
          <path d="M13 19 Q17 22 21 19" stroke={s} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M27 19 Q31 22 35 19" stroke={s} strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="17" cy="19" r="2" fill="transparent" />
          <circle cx="31" cy="19" r="2" fill="transparent" />
          <text x="36" y="11" fontSize="9" fill={s} fontWeight="bold">z</text>
          <text x="39" y="7" fontSize="7" fill={s} fontWeight="bold">z</text>
        </>
      );

    case "Exhausted":
      return face(
        <line x1="17" y1="31" x2="31" y2="31" stroke={s} strokeWidth="2.5" strokeLinecap="round" />,
        <>
          <path d="M13 20 Q17 24 21 20" stroke={s} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M27 20 Q31 24 35 20" stroke={s} strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="17" cy="19" r="2" fill="transparent" />
          <circle cx="31" cy="19" r="2" fill="transparent" />
          <path d="M37 12 Q35 16 37 18 Q39 16 37 12Z" fill={s} />
        </>
      );

    case "Sad":
      return face(<path d="M16 32 Q24 26 32 32" stroke={s} strokeWidth="2.5" strokeLinecap="round" />);

    case "Angry":
      return face(
        <path d="M16 32 Q24 26 32 32" stroke={s} strokeWidth="2.5" strokeLinecap="round" />,
        <>
          <path d="M13 15 Q17 18 21 15" stroke={s} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M27 15 Q31 18 35 15" stroke={s} strokeWidth="2.5" strokeLinecap="round" />
        </>
      );

    case "Fearful":
      return face(
        <ellipse cx="24" cy="32" rx="5" ry="3" stroke={s} strokeWidth="2.5" />,
        <>
          <path d="M13 16 Q17 13 21 16" stroke={s} strokeWidth="2" strokeLinecap="round" />
          <path d="M27 16 Q31 13 35 16" stroke={s} strokeWidth="2" strokeLinecap="round" />
        </>
      );

    case "Disgusted":
      return face(
        <path d="M16 32 Q20 28 24 31 Q28 34 32 29" stroke={s} strokeWidth="2.5" strokeLinecap="round" fill="none" />,
        <path d="M13 15 Q17 18 21 16" stroke={s} strokeWidth="2" strokeLinecap="round" />
      );

    case "Crying":
      return face(
        <path d="M16 32 Q24 26 32 32" stroke={s} strokeWidth="2.5" strokeLinecap="round" />,
        <>
          <path d="M15 24 Q13 28 15 30 Q17 28 15 24Z" fill={s} />
          <path d="M33 24 Q31 28 33 30 Q35 28 33 24Z" fill={s} />
        </>
      );

    case "Depressed":
      return face(
        <path d="M14 34 Q24 24 34 34" stroke={s} strokeWidth="2.5" strokeLinecap="round" />,
        <>
          <path d="M13 21 Q17 18 21 21" stroke={s} strokeWidth="2" strokeLinecap="round" />
          <path d="M27 21 Q31 18 35 21" stroke={s} strokeWidth="2" strokeLinecap="round" />
        </>
      );

    case "Anxious":
      return face(
        <path d="M16 31 Q19 28 22 31 Q25 34 28 31 Q31 28 34 31" stroke={s} strokeWidth="2.5" strokeLinecap="round" fill="none" />,
        <path d="M37 10 Q35 14 37 16 Q39 14 37 10Z" fill={s} />
      );

    case "Lonely":
      return face(
        <path d="M17 31 Q24 27 31 31" stroke={s} strokeWidth="2.5" strokeLinecap="round" />,
        <path d="M15 25 Q13 29 15 31 Q17 29 15 25Z" fill={s} />
      );

    case "Embarrassed":
      return face(
        <path d="M17 29 Q24 34 31 29" stroke={s} strokeWidth="2.5" strokeLinecap="round" />,
        <>
          <circle cx="12" cy="24" r="4" fill={s} opacity="0.35" />
          <circle cx="36" cy="24" r="4" fill={s} opacity="0.35" />
        </>
      );

    case "Heartbroken":
      return face(
        <path d="M16 32 Q24 26 32 32" stroke={s} strokeWidth="2.5" strokeLinecap="round" />,
        <path d="M21 8 C21 6 19 4 17 6 C15 8 17 11 21 13 L24 11 M24 11 C28 9 30 6 28 4 C26 2 24 4 24 6" stroke={s} strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      );

    case "Frustrated":
      return face(
        <path d="M16 32 Q24 27 32 32" stroke={s} strokeWidth="2.5" strokeLinecap="round" />,
        <>
          {/* one raised angry brow, one flat */}
          <path d="M13 15 Q17 17 21 14" stroke={s} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="27" y1="15" x2="35" y2="15" stroke={s} strokeWidth="2.5" strokeLinecap="round" />
          {/* steam lines */}
          <line x1="38" y1="8" x2="38" y2="13" stroke={s} strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="41" y1="6" x2="41" y2="11" stroke={s} strokeWidth="1.5" strokeLinecap="round"/>
        </>
      );

    case "Jealous":
      return face(
        <path d="M17 30 Q24 26 31 30" stroke={s} strokeWidth="2.5" strokeLinecap="round" />,
        <>
          {/* side-eye: pupils shifted to corners */}
          <circle cx="17" cy="19" r="2" fill="transparent" />
          <circle cx="31" cy="19" r="2" fill="transparent" />
          <circle cx="15" cy="19" r="2" fill={s} />
          <circle cx="29" cy="19" r="2" fill={s} />
          {/* green tinge dots on cheeks */}
          <circle cx="10" cy="25" r="3" fill={s} opacity="0.3" />
          <circle cx="38" cy="25" r="3" fill={s} opacity="0.3" />
        </>
      );

    default:
      return face(<line x1="17" y1="30" x2="31" y2="30" stroke={s} strokeWidth="2.5" strokeLinecap="round" />);
  }
}

export default function AnalysisResult({ analysis }: AnalysisResultProps) {
  const color = emotionColor[analysis.emotion] ?? "#8E9299";
  const sentimentColor = getSentimentColor(analysis.sentiment);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-6 p-8 rounded-3xl bg-[#151619] border border-[#2A2B2F] shadow-2xl w-full max-w-md mx-auto relative overflow-hidden"
    >
      <div className="absolute inset-0 opacity-5 pointer-events-none"
        style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "20px 20px" }} />

      <div className="flex items-center justify-between z-10">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-mono uppercase tracking-[2px] text-[#8E9299]">Analysis Result</span>
          <h2 className="text-3xl font-mono uppercase tracking-tighter" style={{ color }}>
            {analysis.emotion}
          </h2>
        </div>
        <div className="p-3 rounded-2xl bg-[#2A2B2F] border border-[#3A3B3F]">
          <NeonEmoji emotion={analysis.emotion} color={color} />
        </div>
      </div>

      <div className="flex flex-col gap-2 p-4 rounded-2xl bg-[#2A2B2F]/30 border border-[#2A2B2F] z-10">
        <span className="text-[9px] font-mono uppercase text-[#8E9299] tracking-widest">Transcription</span>
        <p className="text-sm text-white font-medium leading-relaxed">
          {analysis.transcription || <span className="text-[#8E9299] italic">No speech detected</span>}
        </p>
      </div>

      {analysis.feedback && (
        <div className="p-4 rounded-2xl bg-[#2A2B2F]/50 border border-[#2A2B2F] z-10">
          <p className="text-sm text-[#8E9299] leading-relaxed italic">"{analysis.feedback}"</p>
        </div>
      )}

      <div className="w-full h-px bg-[#2A2B2F] z-10" />

      <div className="flex justify-between w-full px-2 z-10">
        <div className="flex flex-col gap-1">
          <span className="text-[9px] font-mono uppercase text-[#8E9299]">Sentiment</span>
          <span className="text-[11px] font-mono uppercase" style={{ color: sentimentColor }}>
            {analysis.sentiment}
          </span>
        </div>
        <div className="flex flex-col gap-1 items-end">
          <span className="text-[9px] font-mono uppercase text-[#8E9299]">Status</span>
          <span className="text-[11px] font-mono text-[#00FF00] uppercase">Verified</span>
        </div>
      </div>
    </motion.div>
  );
}
