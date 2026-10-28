"use client";

import { motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import { confetti } from "./confetti";
import { focusHandleInput } from "./HandleForm";
import Reveal from "./Reveal";

/*
  Pricing: one offer, $0, shown straight away. The first time the section scrolls into view,
  confetti rains down the screen and a stamp lands on the receipt (cut zigzag top and bottom,
  every line $0.00).
*/

// seconds after the section comes into view
const STAMP_AT = 0.6;

const ITEMS = [
  ["Your Concierge link", "$0.00"],
  ["7 checks per creator", "$0.00"],
  ["Unlimited creators", "$0.00"],
  ["A yes or no per DM", "$0.00"],
];
const FEES = [
  ["Setup fee", "$0.00"],
  ["Monthly fee", "$0.00"],
];

function Line({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <li className={`flex items-baseline ${strong ? "text-[17px] font-bold text-[#161a35]" : ""}`}>
      <span>{label}</span>
      <span className="mx-2 flex-1 -translate-y-[3px] border-b border-dotted border-[#c3c5d3]" />
      <span>{value}</span>
    </li>
  );
}

function Receipt({ seen, reduce }: { seen: boolean; reduce: boolean }) {
  return (
    <Reveal className="w-[340px]">
      {/* the shadow lives on a wrapper so it follows the zigzag edges */}
      <div style={{ filter: "drop-shadow(0 24px 30px rgba(40,30,110,0.14)) drop-shadow(0 1px 2px rgba(40,30,110,0.06))" }}>
        <div className="receipt-edge relative bg-white px-7 py-10 font-mono text-[13px] leading-[1.5] text-[#3a3d55]">
            <p className="text-center text-[15px] font-bold tracking-[0.18em] text-[#161a35]">COLLAB CONCIERGE</p>
            <p className="mt-1 text-center text-[11px] tracking-[0.2em] text-[#8a8da3]">BY BENABLE</p>

            <ul className="mt-5 flex flex-col gap-1.5 border-t border-dashed border-[#c3c5d3] pt-4">
              {ITEMS.map(([l, v]) => (
                <Line key={l} label={l} value={v} />
              ))}
            </ul>
            <ul className="mt-4 flex flex-col gap-1.5 border-t border-dashed border-[#c3c5d3] pt-4">
              {FEES.map(([l, v]) => (
                <Line key={l} label={l} value={v} />
              ))}
            </ul>
            <ul className="mt-3">
              <Line label="TOTAL" value="$0.00" strong />
            </ul>

            <ul className="mt-4 border-t border-dashed border-[#c3c5d3] pt-4">
              <Line label="Card on file" value="NONE" />
            </ul>

            <div
              aria-hidden="true"
                className="mx-auto mt-6 h-[38px] w-[200px]"
              style={{
                background:
                  "repeating-linear-gradient(90deg, #2a2c40 0 2px, transparent 2px 4px, #2a2c40 4px 5px, transparent 5px 8px, #2a2c40 8px 11px, transparent 11px 12px, #2a2c40 12px 13px, transparent 13px 17px)",
              }}
            />
            <p className="mt-2 text-center text-[11px] tracking-[0.2em] text-[#8a8da3]">NO CARD. NO CATCH.</p>

          {/* rubber stamp over the totals, once the receipt is on screen */}
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute right-6 top-[196px] mix-blend-multiply"
            initial={reduce ? { opacity: 0, scale: 1, rotate: -12 } : { opacity: 0, scale: 1.6, rotate: -6 }}
            animate={seen ? { opacity: 0.9, scale: 1, rotate: -12 } : undefined}
            transition={{ type: "spring", stiffness: 420, damping: 26, delay: STAMP_AT }}
          >
            <div className="rounded-[12px] border-[3px] border-rose p-[3px]">
              <div className="rounded-[7px] border-[1.5px] border-rose px-3.5 pb-1.5 pt-2 text-center text-rose">
                <p className="font-sans text-[28px] font-extrabold leading-none tracking-[-0.01em]">100% FREE</p>
                <p className="mt-1 font-sans text-[10px] font-bold tracking-[0.32em]">NOTHING DUE</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Reveal>
  );
}

export default function Pricing() {
  const ref = useRef<HTMLElement>(null);
  const seen = useInView(ref, { once: true, amount: 0.4 });
  const reduce = useReducedMotion() ?? false;
  // cacheComponents keeps this page alive in a hidden <Activity> while you're elsewhere, and React re-runs
  // effects when it's shown again; the ref survives that, so coming back via the logo doesn't rain confetti twice
  const rained = useRef(false);

  useEffect(() => {
    if (!seen || reduce || rained.current) return;
    rained.current = true;
    confetti();
  }, [seen, reduce]);

  return (
    <section ref={ref} id="pricing" className="relative scroll-mt-24 overflow-x-clip py-24 sm:py-32">
      <div className="mx-auto grid w-full max-w-[1000px] items-center gap-14 px-5 sm:px-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-16 lg:px-10">
        {/* copy */}
        <Reveal className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <span className="pill-label">Pricing</span>
          <p className="mt-8 text-[80px] font-bold leading-none tracking-[-0.045em] text-[#1c1c1c] tabular-nums sm:text-[104px]">$0</p>
          <h2 className="section-title mt-5">100% totally free.</h2>
          <p className="section-sub mt-4">We&apos;re not kidding, no credit card required.</p>
          <a
            href="#claim"
            onClick={(e) => {
              if (focusHandleInput("#claim")) e.preventDefault();
            }}
            className="mt-8 inline-flex h-10 items-center justify-center rounded-[12px] bg-[#7a5cfa] px-4 text-[14.5px] font-medium leading-[21.75px] text-white transition-colors hover:bg-[#6a4ced]"
          >
            Get your link
          </a>
        </Reveal>

        {/* receipt; phones get it at 80% in a box sized to match */}
        <div className="relative flex justify-center lg:justify-end">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-16 -z-10 blur-3xl"
            style={{ background: "radial-gradient(closest-side, rgba(143,108,247,.16), rgba(242,134,154,.08) 55%, transparent)" }}
          />
          <div className="relative h-[408px] w-[272px] sm:h-[510px] sm:w-[340px]">
            <div className="absolute left-0 top-0 origin-top-left scale-[0.8] sm:scale-100">
              <Receipt seen={seen} reduce={reduce} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
