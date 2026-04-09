import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

/**
 * AnimatedWord — cycles through `words` with a spring slide-in animation.
 * Drop this inline inside any heading.
 */
export function AnimatedWord({ words }: { words: string[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setTimeout(() => {
      setIndex((prev) => (prev === words.length - 1 ? 0 : prev + 1));
    }, 2200);
    return () => clearTimeout(id);
  }, [index, words]);

  return (
    <span className="relative inline-flex justify-center overflow-hidden align-bottom"
      style={{ minWidth: "1ch" }}>
      &nbsp;
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="absolute font-black"
          style={{
            background: "linear-gradient(135deg,#10b981 0%,#34d399 50%,#6ee7b7 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
          initial={{ opacity: 0, y: -60 }}
          transition={{ type: "spring", stiffness: 60, damping: 18 }}
          animate={
            index === i
              ? { y: 0, opacity: 1 }
              : { y: index > i ? -80 : 80, opacity: 0 }
          }
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

/**
 * AnimatedHero — full standalone hero section.
 * Can also be used independently on any page.
 */
export function AnimatedHero({ onCta }: { onCta?: () => void }) {
  const words = useMemo(
    () => ["consistent", "profitable", "disciplined", "data-driven", "systematic"],
    []
  );

  return (
    <div className="w-full flex flex-col items-center justify-center text-center px-6 py-32">
      {/* Badge */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[rgba(16,185,129,0.3)] bg-[rgba(16,185,129,0.08)] mb-8"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
        <span className="text-[11px] font-semibold text-[#10b981] tracking-wide uppercase">
          AI-Powered Trading Journal
        </span>
      </motion.div>

      {/* Headline with animated word */}
      <motion.h1
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.75, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        className="font-black leading-[1.06] tracking-tight text-white mb-6"
        style={{ fontSize: "clamp(44px,7vw,80px)", letterSpacing: "-3px" }}
      >
        Become a more
        <br />
        <AnimatedWord words={words} />
        <span className="text-white"> trader.</span>
      </motion.h1>

      {/* Sub */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
        className="text-[rgba(255,255,255,0.45)] text-[17px] max-w-xl leading-relaxed mb-10"
      >
        EdgeFlow analyzes every trade — surfacing the patterns, leaks, and emotional
        triggers costing you money.
      </motion.p>

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.26, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col sm:flex-row items-center gap-3 mb-6"
      >
        <button
          onClick={onCta}
          className="px-8 py-3.5 rounded-full bg-[#10b981] text-black text-[15px] font-bold hover:bg-[#0ea572] active:scale-95 transition-all flex items-center gap-2"
        >
          Start Free — No Card Needed
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
        <a
          href="#see-the-app"
          className="text-[rgba(255,255,255,0.4)] text-[14px] py-3 px-4 hover:text-white transition-colors"
        >
          See the app ↓
        </a>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-[12px] text-[rgba(255,255,255,0.2)]"
      >
        ✓ Free plan &nbsp;·&nbsp; ✓ No credit card &nbsp;·&nbsp; ✓ Cancel anytime
      </motion.p>
    </div>
  );
}
