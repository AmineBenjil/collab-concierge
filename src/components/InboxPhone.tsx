"use client";

import { RiArrowDownSLine, RiCameraLine, RiEditBoxLine, RiLineChartLine } from "@remixicon/react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { usePhoneBrand } from "./handle";
import { C, IOS_EASE, PhoneFrame, StatusBar, UI } from "./Phone";

/*
  The Instagram inbox filling up with vague collab DMs, one every 2 seconds.
  Each new chat lands on top, unread, and pushes the rest down. After the last
  one the inbox fades back to its first four chats and starts again.
*/

type Dm = { img: string; name: string; preview: string; time: string; unread?: boolean };

const START: Dm[] = [
  { img: "mia", name: "Mia Duarte", preview: "gifted visit for me + 1? 🙏", time: "1h" },
  { img: "roasters", name: "Jon Reyes", preview: "free product + $150 for a reel?", time: "3h" },
  { img: "ana", name: "Ana Rivera", preview: "can I come film this week?", time: "5h" },
  { img: "joao", name: "Joey Park", preview: "hii love your feed 💕 collab?", time: "8h" },
];

const ARRIVING: Dm[] = [
  { img: "clara", name: "Clara Mendez", preview: "would love to feature you 🥐 collab?", time: "now" },
  { img: "tiago", name: "Theo Alvarez", preview: "do you do paid collabs?", time: "now" },
  { img: "ines", name: "Ivy Martin", preview: "can I bring my camera this sat? 🎥", time: "now" },
  { img: "rafa", name: "Rafa Costa", preview: "let's work together!! dm me", time: "now" },
  { img: "beatriz", name: "Bea Lopez", preview: "PR box for a review? 📦", time: "now" },
  { img: "cafe", name: "LA Bites", preview: "food page here (80K) 👀 collab?", time: "now" },
].map((d) => ({ ...d, unread: true }));

const FIRST_DM = 1600; // after the phone has risen into place
const EVERY = 2000;
const HOLD = 3500; // full inbox stays up before the loop resets
const ROW_H = 70;

export default function InboxPhone({ className = "" }: { className?: string }) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-80px" });
  const [count, setCount] = useState(0);
  const [run, setRun] = useState(0);

  useEffect(() => {
    if (!inView || reduced) return;
    const done = count === ARRIVING.length;
    const t = setTimeout(
      () => {
        if (done) {
          setCount(0);
          setRun((r) => r + 1);
        } else setCount((c) => c + 1);
      },
      done ? HOLD : count === 0 ? FIRST_DM : EVERY
    );
    return () => clearTimeout(t);
  }, [inView, reduced, count, run]);

  const shown = reduced ? ARRIVING.length : count;
  return (
    <div ref={ref} className={className}>
      <PhoneFrame label="An Instagram inbox filling up with collab DMs: “collab?”, “do you do paid collabs?”, “PR box for a review?”, each one vague about what the creator actually wants.">
        <AnimatePresence initial={false}>
          <motion.div
            key={`inbox-${run}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.45, ease: IOS_EASE } }}
            exit={{ opacity: 0, transition: { duration: 0.45 } }}
            className="absolute inset-0 bg-white"
          >
            <Inbox arrived={ARRIVING.slice(0, shown).reverse()} />
          </motion.div>
        </AnimatePresence>
        <StatusBar />
      </PhoneFrame>
    </div>
  );
}

function Inbox({ arrived }: { arrived: Dm[] }) {
  const brand = usePhoneBrand();
  return (
    <div className="absolute inset-0 overflow-hidden pt-[54px]" style={{ color: C.ink }}>
      <div className="relative flex h-[45px] items-center px-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${UI}/back.svg`} alt="" width={24} height={24} />
        <span className="ml-3 max-w-[200px] truncate text-[20px] font-bold tracking-[-0.4px]">{brand.handle}</span>
        <RiArrowDownSLine size={18} color={C.ink} aria-hidden="true" className="ml-0.5" />
        <span className="ml-auto flex items-center gap-4">
          <RiLineChartLine size={24} color={C.ink} aria-hidden="true" />
          <RiEditBoxLine size={24} color={C.ink} aria-hidden="true" />
        </span>
      </div>

      <div className="mx-4 mt-1 flex h-[36px] items-center gap-2 rounded-[10px] px-3 text-[15px]" style={{ background: C.incoming, color: C.grey }}>
        <span className="h-[18px] w-[18px] rounded-full bg-[conic-gradient(from_200deg,#3c7bff,#a33cf2,#ff4f8b,#3c7bff)] p-[3px]">
          <span className="block h-full w-full rounded-full" style={{ background: C.incoming }} />
        </span>
        Ask Meta AI or Search
      </div>

      <div className="mt-4 flex items-center justify-between px-4">
        <span className="text-[16px] font-bold">Messages</span>
        <span className="text-[14px] font-semibold text-[#0095f6]">Requests ({arrived.length + 2})</span>
      </div>

      <div className="mt-1">
        {/* a new chat opens from zero height at the top, so the rest slide down together */}
        {arrived.map((d) => (
          <motion.div
            key={d.name}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: ROW_H, opacity: 1 }}
            transition={{ height: { duration: 0.55, ease: IOS_EASE }, opacity: { duration: 0.35, delay: 0.15 } }}
            className="overflow-hidden"
          >
            <Row {...d} />
          </motion.div>
        ))}
        {START.map((d) => (
          <Row key={d.name} {...d} />
        ))}
      </div>
    </div>
  );
}

function Row({ img, name, preview, time, unread }: Dm) {
  return (
    <div className="flex h-[70px] items-center gap-3 px-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/img/ig/${img}.jpg`} alt="" className="h-[54px] w-[54px] shrink-0 rounded-full object-cover" />
      <div className="min-w-0 flex-1 leading-[1.3]">
        <div className={`truncate text-[14px] ${unread ? "font-bold" : ""}`}>{name}</div>
        <div className={`truncate text-[14px] tracking-[-0.14px] ${unread ? "font-semibold" : ""}`} style={{ color: unread ? C.ink : C.grey }}>
          {preview} <span className="font-normal" style={{ color: C.grey }}>· {time}</span>
        </div>
      </div>
      {unread ? <span className="h-2 w-2 shrink-0 rounded-full bg-[#0095f6]" /> : <RiCameraLine size={24} color={C.grey} aria-hidden="true" />}
    </div>
  );
}
