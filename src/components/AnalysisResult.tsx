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
      {extras}
      {mouth}
    </svg>
  );

  const eyes = <><circle cx="17" cy="19" r="2" fill={s} /><circle cx="31" cy="19" r="2" fill={s} /></>;
  const bigEyes = <><circle cx="17" cy="20" r="2.5" fill={s} /><circle cx="31" cy="20" r="2.5" fill={s} /></>;
  const angryBrows = <><path d="M13 16 Q17 19 21 16" stroke={s} strokeWidth="2.5" strokeLinecap="round"/><path d="M27 16 Q31 19 35 16" stroke={s} strokeWidth="2.5" strokeLinecap="round"/></>;
  const raisedBrows = <><path d="M13 15 Q17 12 21 15" stroke={s} strokeWidth="2" strokeLinecap="round"/><path d="M27 15 Q31 12 35 15" stroke={s} strokeWidth="2" strokeLinecap="round"/></>;
  const worriedBrows = <><path d="M13 17 Q17 14 21 17" stroke={s} strokeWidth="2" strokeLinecap="round"/><path d="M27 17 Q31 14 35 17" stroke={s} strokeWidth="2" strokeLinecap="round"/></>;
  const droopyLids = <><path d="M13 19 Q17 22 21 19" stroke={s} strokeWidth="2.5" strokeLinecap="round"/><path d="M27 19 Q31 22 35 19" stroke={s} strokeWidth="2.5" strokeLinecap="round"/></>;
  const tears = <><path d="M15 23 Q12 28 15 31 Q18 28 15 23Z" fill={s}/><path d="M33 23 Q30 28 33 31 Q36 28 33 23Z" fill={s}/></>;
  const smileBig = <path d="M13 27 Q24 40 35 27" stroke={s} strokeWidth="2.5" strokeLinecap="round" fill="none"/>;
  const smileMed = <path d="M15 27 Q24 37 33 27" stroke={s} strokeWidth="2.5" strokeLinecap="round" fill="none"/>;
  const smileSmall = <path d="M16 28 Q24 34 32 28" stroke={s} strokeWidth="2.5" strokeLinecap="round" fill="none"/>;
  const frownBig = <path d="M13 35 Q24 22 35 35" stroke={s} strokeWidth="2.5" strokeLinecap="round" fill="none"/>;
  const frownMed = <path d="M15 33 Q24 25 33 33" stroke={s} strokeWidth="2.5" strokeLinecap="round" fill="none"/>;
  const frownSmall = <path d="M16 32 Q24 26 32 32" stroke={s} strokeWidth="2.5" strokeLinecap="round" fill="none"/>;

  switch (emotion) {

    case "Happy":
      return face(smileMed, eyes);

    case "Excited":
      return face(smileBig,
        <>{eyes}
        <line x1="5" y1="7" x2="5" y2="13" stroke={s} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="2" y1="10" x2="8" y2="10" stroke={s} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="43" y1="5" x2="43" y2="11" stroke={s} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="40" y1="8" x2="46" y2="8" stroke={s} strokeWidth="1.5" strokeLinecap="round"/></>
      );

    case "Loving":
      // Big smile + heart above with slightly closed eyes from joy
      return face(smileMed,
        <><path d="M13 18 Q17 15 21 18" stroke={s} strokeWidth="2" strokeLinecap="round"/>
        <path d="M27 18 Q31 15 35 18" stroke={s} strokeWidth="2" strokeLinecap="round"/>
        <path d="M24 13 C24 11 22 8 19 10 C16 12 18 16 24 19 C30 16 32 12 29 10 C26 8 24 11 24 13Z" fill={s}/></>
      );

    case "Grateful":
      // Gentle smile + soft closed eyes + subtle sparkle
      return face(smileSmall,
        <><path d="M13 18 Q17 15 21 18" stroke={s} strokeWidth="2" strokeLinecap="round"/>
        <path d="M27 18 Q31 15 35 18" stroke={s} strokeWidth="2" strokeLinecap="round"/>
        <line x1="5" y1="10" x2="7" y2="12" stroke={s} strokeWidth="1.2" strokeLinecap="round"/>
        <line x1="7" y1="8" x2="5" y2="12" stroke={s} strokeWidth="1.2" strokeLinecap="round"/>
        <line x1="41" y1="10" x2="43" y2="12" stroke={s} strokeWidth="1.2" strokeLinecap="round"/>
        <line x1="43" y1="8" x2="41" y2="12" stroke={s} strokeWidth="1.2" strokeLinecap="round"/></>
      );

    case "Confident":
      // Asymmetric smirk + steady eyes
      return face(
        <path d="M18 30 Q26 37 35 29" stroke={s} strokeWidth="2.5" strokeLinecap="round" fill="none"/>,
        <>{eyes}</>
      );

    case "Proud":
      // Big smile + crown
      return face(smileMed,
        <>{eyes}<polyline points="9,15 13,8 19,13 24,5 29,13 35,8 39,15" stroke={s} strokeWidth="2" strokeLinejoin="round" fill="none"/></>
      );

    case "Surprised":
      // Wide O mouth + raised brows + big eyes
      return face(
        <ellipse cx="24" cy="32" rx="5" ry="5" stroke={s} strokeWidth="2.5"/>,
        <>{raisedBrows}{bigEyes}</>
      );

    case "Relieved":
      // Happy smile + sweat drop = stress gone
      return face(smileMed,
        <>{eyes}<path d="M37 9 Q35 14 37 17 Q39 14 37 9Z" fill={s} opacity="0.7"/></>
      );

    case "Hopeful":
      // Warm smile + star
      return face(smileSmall,
        <>{eyes}<polygon points="24,2 25.8,7.5 31.5,7.5 27,11 28.8,16.5 24,13 19.2,16.5 21,11 16.5,7.5 22.2,7.5" fill={s} opacity="0.85"/></>
      );

    case "Nostalgic":
      // Soft smile + small clock
      return face(smileSmall,
        <>{eyes}
        <circle cx="40" cy="9" r="5" stroke={s} strokeWidth="1.5"/>
        <line x1="40" y1="6" x2="40" y2="9" stroke={s} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="40" y1="9" x2="43" y2="9" stroke={s} strokeWidth="1.5" strokeLinecap="round"/></>
      );

    case "Neutral":
      // Flat line + normal eyes
      return face(
        <line x1="17" y1="30" x2="31" y2="30" stroke={s} strokeWidth="2.5" strokeLinecap="round"/>,
        <>{eyes}</>
      );

    case "Bored":
      // Flat/slight frown + one droopy eye + yawn lines
      return face(
        <path d="M17 31 Q24 27 31 31" stroke={s} strokeWidth="2.5" strokeLinecap="round" fill="none"/>,
        <>{eyes}
        <path d="M13 17 Q17 20 21 17" stroke={s} strokeWidth="2" strokeLinecap="round"/>
        <ellipse cx="7" cy="30" rx="3" ry="5" stroke={s} strokeWidth="1.2" opacity="0.5"/></>
      );

    case "Confused":
      // Wavy mouth + question mark eyebrow
      return face(
        <path d="M16 30 Q19 27 22 30 Q25 33 28 30 Q31 27 34 30" stroke={s} strokeWidth="2.5" strokeLinecap="round" fill="none"/>,
        <>{eyes}
        <path d="M27 12 Q29 9 31 12 Q31 14 29 14 L29 16" stroke={s} strokeWidth="1.8" strokeLinecap="round" fill="none"/>
        <circle cx="29" cy="18" r="1" fill={s}/></>
      );

    case "Sleepy":
      // Small smile + droopy lids + Zzz
      return face(
        <path d="M17 30 Q24 34 31 30" stroke={s} strokeWidth="2.5" strokeLinecap="round" fill="none"/>,
        <>{droopyLids}
        <text x="36" y="12" fontSize="9" fill={s} fontWeight="bold" fontFamily="monospace">z</text>
        <text x="40" y="7" fontSize="7" fill={s} fontWeight="bold" fontFamily="monospace">z</text></>
      );

    case "Exhausted":
      // Flat mouth + very heavy droopy lids + sweat
      return face(
        <line x1="16" y1="31" x2="32" y2="31" stroke={s} strokeWidth="2.5" strokeLinecap="round"/>,
        <>{droopyLids}<path d="M38 11 Q36 16 38 18 Q40 16 38 11Z" fill={s}/></>
      );

    case "Sad":
      // Clear frown + normal eyes
      return face(frownMed, eyes);

    case "Angry":
      // Deep frown + sharp inward brows + eyes lower
      return face(frownMed,
        <>{angryBrows}<circle cx="17" cy="21" r="2" fill={s}/><circle cx="31" cy="21" r="2" fill={s}/></>
      );

    case "Fearful":
      // Open mouth oval + raised brows + big scared eyes
      return face(
        <ellipse cx="24" cy="33" rx="5" ry="3.5" stroke={s} strokeWidth="2.5"/>,
        <>{raisedBrows}{bigEyes}</>
      );

    case "Disgusted":
      // Asymmetric curled mouth + raised one brow + tongue out
      return face(
        <><path d="M15 30 Q19 26 24 29 Q28 33 33 27" stroke={s} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        <ellipse cx="20" cy="36" rx="3" ry="2" stroke={s} strokeWidth="1.5"/></>,
        <>{eyes}
        <path d="M13 16 Q17 19 21 16" stroke={s} strokeWidth="2" strokeLinecap="round"/>
        <line x1="27" y1="16" x2="35" y2="16" stroke={s} strokeWidth="2" strokeLinecap="round"/></>
      );

    case "Crying":
      // Frown + eyes + big tears
      return face(frownMed, <>{eyes}{tears}</>);

    case "Depressed":
      // Extreme frown + heavy sad brows + barely-there eyes
      return face(frownBig,
        <><path d="M12 22 Q17 19 22 22" stroke={s} strokeWidth="2" strokeLinecap="round"/>
        <path d="M26 22 Q31 19 36 22" stroke={s} strokeWidth="2" strokeLinecap="round"/>
        <circle cx="17" cy="26" r="1.5" fill={s} opacity="0.6"/>
        <circle cx="31" cy="26" r="1.5" fill={s} opacity="0.6"/></>
      );

    case "Anxious":
      // Wavy nervous mouth + worried brows + sweat
      return face(
        <path d="M15 31 Q18 28 21 31 Q24 34 27 31 Q30 28 33 31" stroke={s} strokeWidth="2.5" strokeLinecap="round" fill="none"/>,
        <>{worriedBrows}<circle cx="17" cy="21" r="2" fill={s}/><circle cx="31" cy="21" r="2" fill={s}/>
        <path d="M38 9 Q36 14 38 16 Q40 14 38 9Z" fill={s}/></>
      );

    case "Lonely":
      // Small frown + single tear + empty circles around face
      return face(frownSmall,
        <>{eyes}
        <path d="M15 24 Q12 29 15 32 Q18 29 15 24Z" fill={s}/>
        <circle cx="6" cy="24" r="2" stroke={s} strokeWidth="1" opacity="0.35"/>
        <circle cx="42" cy="24" r="2" stroke={s} strokeWidth="1" opacity="0.35"/></>
      );

    case "Embarrassed":
      // Smile (hiding) + big blush circles + eyes looking away
      return face(smileSmall,
        <><circle cx="15" cy="19" r="2" fill={s}/>
        <circle cx="29" cy="19" r="2" fill={s}/>
        <circle cx="10" cy="26" r="6" fill={s} opacity="0.25"/>
        <circle cx="38" cy="26" r="6" fill={s} opacity="0.25"/>
        <line x1="19" y1="14" x2="27" y2="14" stroke={s} strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/></>
      );

    case "Heartbroken":
      // Sad frown + broken heart (split down middle)
      return face(frownMed,
        <>{eyes}
        <path d="M24 13 C24 11 22 8 19 10 C16 12 18 15 24 18 C30 15 32 12 29 10 C26 8 24 11 24 13Z" fill={s} opacity="0.9"/>
        <line x1="24" y1="11" x2="24" y2="19" stroke="rgba(0,0,0,0.6)" strokeWidth="2"/>
        <path d="M24 14 L22 17 M24 14 L26 17" stroke="rgba(0,0,0,0.5)" strokeWidth="1" strokeLinecap="round" fill="none"/></>
      );

    case "Frustrated":
      // Frown + one angry brow + one flat brow (asymmetric) + steam
      return face(frownSmall,
        <><path d="M13 16 Q17 19 21 15" stroke={s} strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="27" y1="16" x2="35" y2="16" stroke={s} strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="17" cy="21" r="2" fill={s}/>
        <circle cx="31" cy="21" r="2" fill={s}/>
        <line x1="38" y1="7" x2="38" y2="13" stroke={s} strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="41" y1="5" x2="41" y2="11" stroke={s} strokeWidth="1.8" strokeLinecap="round"/></>
      );

    case "Jealous":
      // Slight frown + side-eye pupils shifted left + green cheek blush
      return face(frownSmall,
        <><circle cx="15" cy="19" r="2" fill={s}/>
        <circle cx="29" cy="19" r="2" fill={s}/>
        <path d="M13 15 Q17 17 21 16" stroke={s} strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M27 15 Q31 17 35 16" stroke={s} strokeWidth="1.8" strokeLinecap="round"/>
        <circle cx="10" cy="26" r="5" fill={s} opacity="0.2"/>
        <circle cx="38" cy="26" r="5" fill={s} opacity="0.2"/></>
      );

    default:
      return face(
        <line x1="17" y1="30" x2="31" y2="30" stroke={s} strokeWidth="2.5" strokeLinecap="round"/>,
        <>{eyes}</>
      );
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
