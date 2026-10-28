"use client";

import { animate, motion, useInView, useMotionValue, useReducedMotion, useTime, useTransform, type AnimationPlaybackControls } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";

/*
  Question 3: "your customers" and "their followers" as two circles. They slide together and the
  overlap lights up in violet with the audience match on it. Every few seconds a second
  creator swaps in whose followers barely overlap, then it swings back. Built at 360 x 210 and
  scaled down to fit narrower cards. The lens is the followers circle clipped to the customers
  circle, so it stays exact while they move.
*/

const W = 360;
const H = 210;
const R = 80;
const CY = 100;
const EASE = [0.22, 1, 0.36, 1] as const;

// circle centres, always mirrored around the middle (180): apart before the first play,
// overlapping for a fit, barely touching for a miss
const START = { a: 80, b: 280 };
const FIT = { a: 130, b: 230 };
const MISS = { a: 105, b: 255 };

const HOLD_MS = 4500;

const CASES = [
  { pct: 84, chip: "Strong fit", tone: "border-[#c7e1c6] bg-[#e3f9e2] text-[#175412]" },
  { pct: 23, chip: "Audience miss", tone: "border-[#f2c6cf] bg-[#fdeaee] text-[#8e1f37]" },
];

// customer faces, as offsets from the customers circle's centre, all clear of the overlap
const CUSTOMERS = [
  { img: "/img/dash/ava.jpg", x: -48, y: -30 },
  { img: "/img/dash/marco.jpg", x: -58, y: 12 },
  { img: "/img/dash/jade.jpg", x: -36, y: 42 },
  { img: "/img/dash/theo.jpg", x: -12, y: -46 },
  { img: "/img/dash/priya.jpg", x: -16, y: 10 },
];

// follower faces, as offsets from the followers circle's centre; the first two sit in the overlap
const FOLLOWERS = [
  { img: "/img/ig/ana.jpg", x: -50, y: -52 },
  { img: "/img/ig/clara.jpg", x: -50, y: 52 },
  { img: "/img/ig/tiago.jpg", x: 24, y: -50 },
  { img: "/img/ig/beatriz.jpg", x: 54, y: -16 },
  { img: "/img/ig/ines.jpg", x: 26, y: 46 },
  { img: "/img/ig/rafa.jpg", x: 56, y: 28 },
  { img: "/img/ig/joao.jpg", x: 30, y: 4 },
];
const IN_LENS = 2;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function AudienceVenn() {
  const id = useId();
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const inView = useInView(box, { once: true, amount: 0.4 });
  const reduce = useReducedMotion();
  const paused = useRef(false);

  const [shown, setShown] = useState(false);
  const [match, setMatch] = useState(false); // the number's label
  const [lit, setLit] = useState(false);
  const [chip, setChip] = useState(false);
  const [which, setWhich] = useState(0);

  const ax = useMotionValue(START.a);
  const bx = useMotionValue(START.b);
  const n = useMotionValue(0);

  // a slow ±3px drift so the idle state breathes
  const time = useTime();
  const drift = useTransform(time, (t) => (reduce ? 0 : Math.sin((t / 6000) * Math.PI * 2) * 3));
  const a = useTransform(() => ax.get() + drift.get());
  const b = useTransform(() => bx.get() - drift.get());
  const mid = useTransform(() => (a.get() + b.get()) / 2);
  const pct = useTransform(n, (v) => `${Math.round(v)}%`);

  // scale the fixed-size drawing to the card
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setScale(Math.min(1, el.clientWidth / W)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    let alive = true;
    const running: AnimationPlaybackControls[] = [];
    const go = (mv: typeof ax, to: number, opts: { duration: number; ease?: typeof EASE | "easeOut" }) => running.push(animate(mv, to, opts));
    const step = async (ms: number) => {
      await wait(ms);
      while (alive && paused.current) await wait(200);
      if (!alive) throw new Error("stopped");
    };

    const show = async () => {
      setShown(true);
      if (reduce) {
        go(ax, FIT.a, { duration: 0 });
        go(bx, FIT.b, { duration: 0 });
        go(n, CASES[0].pct, { duration: 0 });
        setMatch(true);
        setLit(true);
        setChip(true);
        return;
      }
      await wait(350);
      go(ax, FIT.a, { duration: 0.95, ease: EASE });
      go(bx, FIT.b, { duration: 0.95, ease: EASE });
      await wait(450);
      go(n, CASES[0].pct, { duration: 0.9, ease: "easeOut" });
      setMatch(true);
      await wait(200);
      setLit(true);
      await wait(700);
      setChip(true);

      // then swing between the fit and the miss
      for (let i = 1; ; i++) {
        await step(HOLD_MS);
        const c = i % 2;
        const to = c ? MISS : FIT;
        setChip(false);
        setLit(false);
        setWhich(c);
        go(ax, to.a, { duration: 0.9, ease: EASE });
        go(bx, to.b, { duration: 0.9, ease: EASE });
        go(n, CASES[c].pct, { duration: 0.9, ease: "easeOut" });
        await wait(500);
        if (!c) setLit(true);
        await wait(400);
        setChip(true);
      }
    };
    show().catch(() => {});
    return () => {
      alive = false;
      running.forEach((r) => r.stop());
    };
  }, [inView, reduce, ax, bx, n]);

  const c = CASES[which];
  const ring = (i: number) => lit && i < IN_LENS;

  return (
    <div
      ref={box}
      className="relative w-full"
      style={{ height: H * scale }}
      onMouseEnter={() => (paused.current = true)}
      onMouseLeave={() => (paused.current = false)}
      role="img"
      aria-label="Your customers and a creator's followers as two circles. For a strong fit they overlap by 84%. For an audience miss they barely touch, at 23%."
    >
      <motion.div
        className="absolute left-1/2 top-0"
        style={{ width: W, height: H, marginLeft: -W / 2, scale, originY: 0 }}
        initial={false}
        animate={shown ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        <motion.div
          className="absolute inset-0"
          initial={false}
          animate={{ scale: shown ? 1 : 0.9 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="absolute inset-0 overflow-visible" aria-hidden="true">
            <defs>
              <clipPath id={`${id}-a`}>
                <motion.circle cx={a} cy={CY} r={R} />
              </clipPath>
            </defs>
            <motion.circle cx={a} cy={CY} r={R} fill="#4d8dff" fillOpacity={0.1} stroke="#4d8dff" strokeOpacity={0.3} strokeWidth={1.5} />
            <motion.circle cx={b} cy={CY} r={R} fill="#f2869a" fillOpacity={0.1} stroke="#f2869a" strokeOpacity={0.3} strokeWidth={1.5} />
            <motion.circle cx={b} cy={CY} r={R} fill="#8f6cf7" fillOpacity={0.32} stroke="#6b4ef0" strokeOpacity={0.5} strokeWidth={1.5} clipPath={`url(#${id}-a)`} />
          </svg>

          {/* your customers: their faces and a caption ride with the circle */}
          <motion.div className="absolute top-0 left-0" style={{ x: a }}>
            {CUSTOMERS.map((f) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={f.img}
                src={f.img}
                alt=""
                className="absolute h-[18px] w-[18px] max-w-none rounded-full object-cover shadow-[0_0_0_1.5px_#fff]"
                style={{ left: f.x - 9, top: CY + f.y - 9 }}
              />
            ))}
            {/* nudged out so the two captions never touch */}
            <span className="absolute -translate-x-1/2 whitespace-nowrap text-[12px] text-muted" style={{ top: CY + R + 8, left: -24 }}>
              Your customers
            </span>
          </motion.div>

          {/* their followers: faces and caption ride with the circle */}
          <motion.div className="absolute top-0 left-0" style={{ x: b }}>
            {FOLLOWERS.map((f, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={f.img}
                src={f.img}
                alt=""
                className="absolute h-[18px] w-[18px] max-w-none rounded-full object-cover transition-[filter,opacity,box-shadow] duration-300"
                style={{
                  left: f.x - 9,
                  top: CY + f.y - 9,
                  filter: ring(i) ? "none" : "grayscale(1)",
                  opacity: ring(i) ? 1 : 0.45,
                  boxShadow: ring(i) ? "0 0 0 2px #fff, 0 0 0 3.5px #6b4ef0" : "0 0 0 1.5px #fff",
                  transitionDelay: ring(i) ? `${i * 60}ms` : "0ms",
                }}
              />
            ))}
            <span className="absolute -translate-x-1/2 whitespace-nowrap text-[12px] text-muted" style={{ top: CY + R + 8, left: 24 }}>
              Their followers
            </span>
          </motion.div>

          {/* the match, on the overlap */}
          <motion.div className="absolute left-0 flex flex-col items-center" style={{ x: mid, top: CY - 40, translateX: "-50%" }}>
            <motion.span className="text-[32px] font-bold leading-none tracking-[-0.03em] text-ink tabular-nums [text-shadow:0_1px_8px_rgba(255,255,255,0.7)]">{pct}</motion.span>
            <motion.span
              className="mt-1 whitespace-nowrap text-[12px] font-medium text-ink/70"
              initial={false}
              animate={{ opacity: match ? 1 : 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              audience match
            </motion.span>
            <motion.span
              key={which}
              className={`mt-2 whitespace-nowrap rounded-[6px] border-[0.5px] px-2 py-[3px] text-[11.5px] font-medium leading-none ${c.tone}`}
              initial={false}
              animate={chip ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.85 }}
              transition={chip ? { type: "spring", stiffness: 500, damping: 22 } : { duration: 0.15 }}
            >
              {c.chip}
            </motion.span>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
