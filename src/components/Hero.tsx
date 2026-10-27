"use client";

import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import HandleForm from "./HandleForm";
import HeroBackground from "./HeroBackground";
import Phone from "./Phone";
import { useControls } from "./controls";
import { useIntro } from "./IntroContext";

const EASE = [0.22, 1, 0.36, 1] as const;

/*
  Creators DMing around the phone. A small scheduler drops one in every few seconds at a
  random spot beside the phone (never above or below it), with at most three on screen.
  The right side is used only when the viewport leaves room for a bubble there. The fade runs
  on the face and bubble, not the wrapper, so the bubble's backdrop blur keeps working.
*/
const MESSAGES = [
  { img: "ana", text: "collab? 🙏" },
  { img: "joao", text: "gifted visit for 2?" },
  { img: "clara", text: "can I film here?" },
  { img: "rafa", text: "paid collab? 💸" },
  { img: "beatriz", text: "loved it 😍" },
  { img: "tiago", text: "rates attached 📎" },
  { img: "mia", text: "brunch reel for you? ✨" },
  { img: "ines", text: "free this weekend?" },
];
const LIFE_MS = 9000; // matches .floater's animation duration
const EVERY_MS = 3100;
const MAX_ON = 3;
const BUBBLE_H = 40;
const MIN_GAP_Y = 64; // keeps bubbles on the same side from stacking on each other
const RIGHT_ROOM = 250; // px needed right of the phone before that side is used

type Floater = { id: number; born: number; msg: number; side: "left" | "right"; top: number; x: number };

const rand = (min: number, max: number) => min + Math.random() * (max - min);

function Floaters({ light }: { light: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<Floater[]>([]);
  const live = useRef<Floater[]>([]);
  const nextId = useRef(0);

  useEffect(() => {
    live.current = [];
    const spawn = () => {
      // a bubble counts as live by its age, so a late timer can never let a fourth one in
      const now = performance.now();
      live.current = live.current.filter((f) => now - f.born < LIFE_MS);
      setItems(live.current);
      const box = ref.current?.getBoundingClientRect();
      if (!box || box.width === 0 || live.current.length >= MAX_ON) return;
      const sides: Floater["side"][] = window.innerWidth - box.right >= RIGHT_ROOM ? ["left", "right"] : ["left"];
      const free = MESSAGES.map((_, i) => i).filter((i) => !live.current.some((f) => f.msg === i));
      for (let tries = 0; tries < 12; tries++) {
        const side = sides[Math.floor(Math.random() * sides.length)];
        const top = rand(0, box.height - BUBBLE_H);
        if (live.current.some((f) => f.side === side && Math.abs(f.top - top) < MIN_GAP_Y)) continue;
        const f = { id: nextId.current++, born: now, msg: free[Math.floor(Math.random() * free.length)], side, top, x: rand(20, 96) };
        live.current = [...live.current, f];
        setItems(live.current);
        return;
      }
    };
    spawn();
    const t = setInterval(spawn, EVERY_MS);
    return () => {
      clearInterval(t);
      live.current = [];
    };
  }, []);

  return (
    // spans the phone's own height (the figure pads it by 16px), so bubbles never sit above or below it
    <div ref={ref} className="pointer-events-none absolute inset-x-0 inset-y-4 hidden xl:block" aria-hidden="true">
      {items.map((f) => {
        const m = MESSAGES[f.msg];
        const left = f.side === "left";
        return (
          <div
            key={f.id}
            className={`absolute flex items-center gap-2 ${left ? "flex-row-reverse" : ""}`}
            style={{ top: f.top, ...(left ? { right: `calc(100% + ${f.x}px)` } : { left: `calc(100% + ${f.x}px)` }) }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/img/ig/${m.img}.jpg`} alt="" className={`floater h-9 w-9 shrink-0 rounded-full object-cover ring-2 ${light ? "ring-white" : "ring-white/20"}`} />
            <span
              className={`floater whitespace-nowrap rounded-[16px] border px-3 py-2 text-[13px] backdrop-blur-2xl backdrop-saturate-150 ${
                light
                  ? "border-ink/10 bg-white/80 text-ink shadow-[0_12px_30px_-14px_rgba(40,30,110,0.35)]"
                  : "border-white/15 bg-[rgba(32,34,74,0.62)] text-white shadow-[0_12px_30px_-12px_rgba(0,0,0,0.6)]"
              } ${
                left ? "rounded-br-[6px]" : "rounded-bl-[6px]"
              }`}
            >
              {m.text}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function Hero() {
  const { done, reduced } = useIntro();
  const { heroBg } = useControls();
  const light = heroBg === "v2";
  const show = done ? "show" : "hidden";
  const item = {
    hidden: { opacity: 0, y: 24, filter: "blur(8px)" },
    show: (i: number) => ({ opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.9, ease: EASE, delay: 0.15 + i * 0.1 } }),
  };

  return (
    <section className={`relative z-10 flex min-h-svh flex-col overflow-x-clip ${light ? "text-ink" : "text-white"}`}>
      <HeroBackground variant={heroBg} />

      <div className="relative mx-auto grid w-full max-w-[1480px] flex-1 items-center gap-12 px-5 pb-14 pt-28 sm:px-8 sm:pt-32 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-10 lg:px-12 lg:pb-6 lg:pt-[clamp(76px,11svh,96px)] xl:px-16">
        {/* copy */}
        <div className="max-w-[620px]">
          <motion.h1 custom={0} variants={item} initial="hidden" animate={show} className="text-[48px] leading-[0.98] sm:text-[66px] lg:text-[clamp(52px,8svh,70px)]">
            Creators keep DMing you to collab. Meet your <span className="grad-text">Concierge.</span>
          </motion.h1>

          <motion.p custom={1} variants={item} initial="hidden" animate={show} className={`mt-6 max-w-[520px] text-[18px] leading-relaxed sm:text-[20px] ${light ? "text-ink-2" : "text-white/70"} lg:mt-[clamp(16px,2.6svh,24px)] lg:text-[clamp(17px,2.2svh,20px)]`}>
            Send them one link. We collect what they want, check who they really are, and hand you a one-line recommendation. You just say yes or no.
          </motion.p>

          <motion.div id="hero-claim" custom={2} variants={item} initial="hidden" animate={show} className="mt-9 lg:mt-[clamp(24px,4svh,36px)]">
            <HandleForm tone={light ? "light" : "dark"} centerNote={false} />
          </motion.div>

        </div>

        {/* phone, sized to always fit inside the viewport, with DMs drifting behind it */}
        <motion.figure
          initial={{ opacity: 0, y: 60 }}
          animate={done ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
          transition={{ duration: 1.1, ease: EASE, delay: 0.35 }}
          className="relative flex flex-col items-center justify-center lg:justify-self-end lg:py-4"
        >
          {done && !reduced && <Floaters light={light} />}
          <Phone className="relative z-10 w-[290px] sm:w-[320px] lg:w-[clamp(260px,calc((100svh-190px)/2.007),340px)]" />
        </motion.figure>
      </div>
    </section>
  );
}
