"use client";

import { animate, AnimatePresence, motion, useInView, useMotionValue, useMotionValueEvent, useReducedMotion, useTransform } from "motion/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/*
  Creators on Benable over a year: a hockey-stick line that draws itself left to right while
  a counter climbs from 500 to 1,000,000+, and creator faces pop up on each month as the line
  reaches it (a small crowd at the peak). Plays once when the box scrolls into view.

  The line's height is drawn for the story (small ups and downs, then the hockey stick), not to
  scale: on a linear axis everything before the last few months would sit flat on the floor.
*/

const EASE = [0.22, 1, 0.36, 1] as const;
const DRAW_EASE = [0.33, 0, 0.25, 1] as const;
const DURATION = 4.8;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// creators at the end of each month; the counter interpolates between them
const COUNTS = [500, 1200, 2500, 4200, 7500, 12000, 21000, 38000, 80000, 170000, 400000, 1000000];
// drawn height of each month, 0 to 1
const HEIGHT = [0.04, 0.11, 0.07, 0.14, 0.1, 0.17, 0.13, 0.21, 0.29, 0.47, 0.7, 1];

// chart box in SVG units; avatars sit on top in % of the same box
const W = 1000;
const H = 400;
const X0 = 24;
const X1 = 952;
const FLOOR = 386;
const RISE = 326;
const PTS = HEIGHT.map((h, i) => ({ x: X0 + ((X1 - X0) * i) / (MONTHS.length - 1), y: FLOOR - h * RISE }));

// smooth curve through every point (Catmull-Rom as cubic Béziers)
function curve(pts: { x: number; y: number }[]) {
  let d = `M${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const t = 0.16;
    d += ` C${p1.x + (p2.x - p0.x) * t} ${p1.y + (p2.y - p0.y) * t} ${p2.x - (p3.x - p1.x) * t} ${p2.y - (p3.y - p1.y) * t} ${p2.x} ${p2.y}`;
  }
  return d;
}
const LINE = curve(PTS);
const AREA = `${LINE} L${X1} ${FLOOR} L${X0} ${FLOOR} Z`;

// faces: real Benable creators (carousel cut-outs on their tile colour) and the café demo's creators
// wide: desktop only, so phones get one face a month and a smaller crowd at the peak
type Face = { month: number; src: string; bg?: string; dx: number; dy: number; size: number; wide?: boolean };
const CUT = (n: string) => `/img/creators-carousel/${n}.png`;
const IG = (n: string) => `/img/ig/${n}.jpg`;
const FACES: Face[] = [
  { month: 1, src: IG("ana"), dx: 0, dy: -26, size: 30 },
  { month: 2, src: CUT("amy"), bg: "#bfafa4", dx: 0, dy: -26, size: 30 },
  { month: 3, src: IG("joao"), dx: 0, dy: -26, size: 30 },
  { month: 4, src: CUT("hanah"), bg: "#d57a8a", dx: 0, dy: -26, size: 30 },
  { month: 5, src: IG("ines"), dx: 0, dy: -28, size: 32 },
  { month: 6, src: CUT("vitolda"), bg: "#e6ccbf", dx: 0, dy: -28, size: 32 },
  { month: 7, src: IG("rafa"), dx: 0, dy: -28, size: 32 },
  { month: 8, src: CUT("giano"), bg: "#dab4ad", dx: -12, dy: -30, size: 34 },
  { month: 8, src: IG("tiago"), dx: 14, dy: -26, size: 30, wide: true },
  { month: 9, src: CUT("megan"), bg: "#9c926c", dx: -14, dy: -32, size: 36 },
  { month: 9, src: IG("clara"), dx: 16, dy: -28, size: 32, wide: true },
  { month: 10, src: CUT("gabriel"), bg: "#6c7e90", dx: -16, dy: -34, size: 38 },
  { month: 10, src: IG("beatriz"), dx: 18, dy: -30, size: 34, wide: true },
  // the peak: a small crowd, nothing overlapping much
  { month: 11, src: CUT("always-asia"), bg: "#9f9ac2", dx: -2, dy: -44, size: 44 },
  { month: 11, src: CUT("nana"), bg: "#f6cec0", dx: -44, dy: -26, size: 38 },
  { month: 11, src: IG("mia"), dx: -30, dy: -68, size: 34 },
  { month: 11, src: CUT("space-cadet"), bg: "#f1b0d0", dx: 30, dy: -72, size: 34, wide: true },
  { month: 11, src: IG("joao"), dx: -78, dy: -48, size: 30, wide: true },
];

const fmt = new Intl.NumberFormat("en-US");
function countAt(p: number) {
  if (p >= 1) return "1,000,000+";
  const f = p * (COUNTS.length - 1);
  const i = Math.floor(f);
  const t = f - i;
  const n = COUNTS[i] * Math.pow(COUNTS[i + 1] / COUNTS[i], t);
  const step = n < 10000 ? 10 : n < 100000 ? 100 : 1000;
  return fmt.format(Math.round(n / step) * step);
}

export default function CreatorGrowth() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-120px" });
  const reduce = useReducedMotion();
  const p = useMotionValue(0);
  const clipW = useTransform(p, (v) => X0 + v * (X1 - X0) + 6);
  const count = useTransform(p, countAt);
  const [reached, setReached] = useState(-1);
  // phones: faces at 70% and only the non-wide ones
  const [small, setSmall] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const read = () => setSmall(mq.matches);
    read();
    mq.addEventListener("change", read);
    return () => mq.removeEventListener("change", read);
  }, []);
  const k = small ? 0.7 : 1;

  useMotionValueEvent(p, "change", (v) => {
    const m = Math.floor(v * (MONTHS.length - 1) + 0.02);
    setReached((r) => (m > r ? m : r));
  });

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      p.set(1);
      return;
    }
    const controls = animate(p, 1, { duration: DURATION, ease: DRAW_EASE, delay: 0.3 });
    return () => controls.stop();
  }, [inView, reduce, p]);

  return (
    <div ref={ref} className="card relative h-[460px] overflow-hidden sm:h-[540px]">
      <div className="dot-grid pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[420px] w-[720px] translate-x-1/4 translate-y-1/4 rounded-full bg-[radial-gradient(closest-side,rgba(143,108,247,0.18),transparent)]" />
      <div className="absolute left-5 top-5 z-10 rounded-full border border-line bg-white px-3 py-1 text-[12px] font-semibold text-ink-2 sm:left-6 sm:top-6">
        Creators assessed
      </div>

      <div className="absolute left-5 top-[62px] z-10 sm:left-6 sm:top-[70px]">
        <motion.div className="display text-[36px] leading-none tabular-nums text-[#1c1c1c] sm:text-[48px]" aria-hidden="true">
          {count}
        </motion.div>
        <div className="mt-2 text-[14px] text-muted sm:text-[15px]">creators</div>
        <span className="sr-only">Over 1,000,000 creators assessed by Benable, up from 500 a year earlier.</span>
      </div>

      {/* chart */}
      <div className="absolute inset-x-4 bottom-10 top-[150px] sm:inset-x-8 sm:bottom-12 sm:top-[112px]" aria-hidden="true">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
          <defs>
            <linearGradient id="growth-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8f6cf7" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#8f6cf7" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="growth-line" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#4d8dff" />
              <stop offset="55%" stopColor="#8f6cf7" />
              <stop offset="100%" stopColor="#f2869a" />
            </linearGradient>
            <clipPath id="growth-reveal">
              <motion.rect x="0" y="-60" height={H + 120} width={clipW} />
            </clipPath>
          </defs>
          {[0, 1, 2].map((i) => (
            <line key={i} x1={X0} x2={X1} y1={FLOOR - i * (RISE / 2)} y2={FLOOR - i * (RISE / 2)} stroke="#e7e7ef" strokeDasharray="4 6" vectorEffect="non-scaling-stroke" />
          ))}
          <g clipPath="url(#growth-reveal)">
            <path d={AREA} fill="url(#growth-fill)" />
            <path d={LINE} fill="none" stroke="url(#growth-line)" strokeWidth="3" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          </g>
        </svg>

        {/* a dot on each month the line has passed */}
        {PTS.map((pt, i) => (
          <span
            key={i}
            className={`absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#8f6cf7] shadow-[0_1px_3px_rgba(40,30,110,0.3)] transition-[opacity,scale] duration-300 ${reached >= i ? "scale-100 opacity-100" : "scale-0 opacity-0"}`}
            style={{ left: `${(pt.x / W) * 100}%`, top: `${(pt.y / H) * 100}%` }}
          />
        ))}

        <AnimatePresence>
          {FACES.map((f, i) =>
            reached >= f.month && !(small && f.wide) ? (
              <motion.span
                key={i}
                className="absolute overflow-hidden rounded-full border-2 border-white shadow-[0_6px_14px_-4px_rgba(22,26,53,0.4)]"
                style={{
                  left: `${(PTS[f.month].x / W) * 100}%`,
                  top: `${(PTS[f.month].y / H) * 100}%`,
                  width: f.size * k,
                  height: f.size * k,
                  marginLeft: (f.dx - f.size / 2) * k,
                  marginTop: (f.dy - f.size / 2) * k,
                  background: f.bg ?? "#eee",
                }}
                initial={{ scale: 0, opacity: 0, y: 8 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: EASE, delay: (i % 3) * 0.06 }}
              >
                <Image src={f.src} alt="" fill sizes="48px" className={f.bg ? "object-cover object-[50%_12%] scale-[1.35] origin-top" : "object-cover"} />
              </motion.span>
            ) : null
          )}
        </AnimatePresence>
      </div>

      {/* months */}
      <div className="absolute inset-x-4 bottom-3 h-4 sm:inset-x-8 sm:bottom-4" aria-hidden="true">
        {PTS.map((pt, i) => (
          <span
            key={i}
            className={`absolute -translate-x-1/2 text-[11px] font-medium text-muted sm:text-[12px] ${i % 2 ? "max-sm:hidden" : ""}`}
            style={{ left: `${(pt.x / W) * 100}%` }}
          >
            {MONTHS[i]}
          </span>
        ))}
      </div>
    </div>
  );
}
