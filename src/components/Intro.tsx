"use client";

import { RiCheckLine } from "@remixicon/react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useIntro } from "./IntroContext";

/*
  First-load intro: collab DMs arrive one by one as a calm iOS-style
  notification stack, pile up, then fold into a single "All handled" pill
  while the hero fades in underneath.
*/

const DMS = [
  { who: "mia.eats.la", img: "mia", text: "Hey! Would you be open to a collab? ☕" },
  { who: "joey.films", img: "joao", text: "Could you send me a product for a reel? 🙏" },
  { who: "ana.rivera", img: "ana", text: "I have 12K followers, can I come film?" },
  { who: "rafa.costa", img: "rafa", text: "Do you do paid collabs? Rates attached" },
  { who: "la.bites", img: "nata", text: "Gifted visit for 2 for a post? 👀" },
  { who: "travel.with.jon", img: "roasters", text: "Would you host a giveaway with me?" },
  { who: "sofia.ugc", img: "ana", text: "Sent you a DM last week… 🥺" },
];

const EASE = [0.22, 1, 0.36, 1] as const;
const STEP = 360; // ms between arrivals
const START = 350;
const GAP = 84; // vertical distance between full cards
const FULL = 4; // cards shown in full before they tuck into the pile

function slot(i: number) {
  if (i < FULL) return { y: i * GAP, scale: 1, opacity: 1 };
  const d = i - FULL + 1;
  return { y: (FULL - 1) * GAP + d * 12, scale: 1 - d * 0.05, opacity: Math.max(0, 1 - d * 0.45) };
}

export default function Intro() {
  const { done, setDone, reduced } = useIntro();
  const [count, setCount] = useState(0);
  const [phase, setPhase] = useState<"stack" | "fold" | "gone">("stack");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const finish = useCallback(() => {
    timers.current.forEach(clearTimeout);
    setPhase("gone");
    setDone(true);
  }, [setDone]);

  useEffect(() => {
    if (reduced) return;
    const t = timers.current;
    DMS.forEach((_, i) => t.push(setTimeout(() => setCount(i + 1), START + i * STEP)));
    const foldAt = START + DMS.length * STEP + 450;
    t.push(setTimeout(() => setPhase("fold"), foldAt));
    t.push(setTimeout(finish, foldAt + 1250));
    return () => t.forEach(clearTimeout);
  }, [reduced, finish]);

  useEffect(() => {
    if (phase === "gone") return;
    const skip = () => finish();
    window.addEventListener("keydown", skip);
    window.addEventListener("wheel", skip, { passive: true });
    window.addEventListener("touchmove", skip, { passive: true });
    return () => {
      window.removeEventListener("keydown", skip);
      window.removeEventListener("wheel", skip);
      window.removeEventListener("touchmove", skip);
    };
  }, [phase, finish]);

  if (reduced) return null;

  const items = DMS.slice(0, count)
    .map((d, i) => ({ ...d, key: i }))
    .reverse();

  return (
    <AnimatePresence>
      {phase !== "gone" && !done && (
        <motion.div
          key="intro"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-night noise"
          exit={{ opacity: 0, transition: { duration: 0.7, ease: EASE } }}
          onClick={finish}
          aria-hidden="true"
        >
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[640px] w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(116,96,255,0.45),rgba(203,160,246,0))]" />

          {/* counter */}
          <div
            className={`relative mb-7 h-[44px] text-center display text-[32px] leading-none text-white transition-[opacity,transform] duration-500 ease-[cubic-bezier(.22,1,.36,1)] sm:text-[40px] ${
              phase === "stack" && count > 0 ? "translate-y-0 opacity-100" : "-translate-y-2.5 opacity-0"
            }`}
          >
            <motion.span
              key={count}
              className="inline-block min-w-[1.2ch] tabular-nums"
              initial={{ y: 14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, ease: EASE }}
            >
              {count}
            </motion.span>{" "}
            new collab DMs
          </div>

          {/* notification stack */}
          <div className="relative h-[340px] w-[min(380px,88vw)]">
            <AnimatePresence>
              {items.map((d, i) => {
                const folding = phase === "fold";
                return (
                  <motion.div
                    key={d.key}
                    className="absolute inset-x-0 top-0 origin-top"
                    style={{ zIndex: 50 - i }}
                    initial={{ y: -28, opacity: 0, scale: 0.96, filter: "blur(4px)" }}
                    animate={
                      folding
                        ? { y: 120, opacity: 0, scale: 0.9, filter: "blur(2px)", transition: { duration: 0.6, ease: EASE, delay: i * 0.04 } }
                        : { ...slot(i), filter: "blur(0px)", transition: { duration: 0.75, ease: EASE } }
                    }
                  >
                    <div className="flex items-center gap-3 rounded-[22px] bg-white/[0.92] px-3.5 py-3 shadow-[0_18px_40px_-18px_rgba(0,0,0,0.6)] ring-1 ring-white/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/img/ig/${d.img}.jpg`} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
                      <div className="min-w-0 flex-1 leading-[1.3]">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="truncate text-[14px] font-semibold">{d.who}</span>
                          <span className="shrink-0 text-[12px] text-muted">now</span>
                        </div>
                        <div className="truncate text-[14px] text-ink-2">{d.text}</div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* the fold: everything becomes one calm answer */}
            <AnimatePresence>
              {phase === "fold" && (
                <motion.div
                  className="absolute inset-x-0 top-[110px] flex justify-center"
                  initial={{ opacity: 0, scale: 0.94, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.7, ease: EASE, delay: 0.2 }}
                >
                  <div className="flex items-center gap-3 rounded-full bg-white px-6 py-3.5 text-[18px] font-semibold text-ink shadow-[0_30px_60px_-20px_rgba(120,100,255,0.6)]">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-mint text-white"><RiCheckLine size={16} aria-hidden="true" /></span>
                    All handled by Benable
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button onClick={finish} className="absolute bottom-8 text-[13px] font-medium text-white/50 transition-colors hover:text-white" tabIndex={-1}>
            Skip intro
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
