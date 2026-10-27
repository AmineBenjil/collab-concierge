"use client";

import {
  RiAddLine,
  RiCalendarLine,
  RiCheckLine,
  RiClipboardLine,
  RiDashboardLine,
  RiEqualizerLine,
  RiFileList3Line,
  RiGift2Line,
  RiShieldCheckLine,
  RiTeamLine,
  RiVerifiedBadgeFill,
  type RemixiconComponentType,
} from "@remixicon/react";
import { AnimatePresence, animate, motion, useAnimate, useInView, useMotionValue, useTransform } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { SectionHead } from "./ui";
import { emojiBurst } from "./confetti";
import { BrandIcon } from "./Logo";

const EASE = [0.22, 1, 0.36, 1] as const;
// how long each step stays on screen; the vetting step moves on while its rules popup is open
const STEP_MS = [5200, 5600, 8000, 6000];

const REPLY = "Thanks for reaching out! We handle collab requests here, takes a couple minutes and we'll get back to you: benable.com/c/foundcoffee";

const STEPS: { title: string; who: string; body: string; Icon: RemixiconComponentType }[] = [
  {
    title: "You paste",
    who: "You, 10 seconds",
    body: "One ready-made reply for every collab DM.",
    Icon: RiClipboardLine,
  },
  {
    title: "They apply",
    who: "The creator, 2 minutes",
    body: "What they want, their idea, when they're free.",
    Icon: RiFileList3Line,
  },
  {
    title: "We vet",
    who: "Custom criteria",
    body: "Seven checks on who's really behind the account.",
    Icon: RiShieldCheckLine,
  },
  {
    title: "You decide",
    who: "You, one tap",
    body: "A one-line verdict in your dashboard. Yes or no.",
    Icon: RiDashboardLine,
  },
];

export default function HowItWorks() {
  const [active, setActive] = useState(0);
  const [hover, setHover] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-20% 0px -20% 0px" });
  const paused = !inView || hover;

  const next = () => setActive((a) => (a + 1) % STEPS.length);

  return (
    <section id="how" className="relative scroll-mt-24 py-24 sm:py-32">
      <div className="container-x">
        <SectionHead
          label="How it works"
          title={
            <>
              You paste. They apply. We vet. <span className="grad-text">You decide.</span>
            </>
          }
          sub="Your part takes about ten seconds. Everything in between is on us."
        />

        <div ref={ref} className="mt-16">
          {/* step tabs with progress */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-6 lg:grid-cols-4">
            {STEPS.map((s, i) => {
              const on = i === active;
              return (
                <button key={s.title} onClick={() => setActive(i)} className="group text-left" aria-pressed={on}>
                  <div className={`flex items-center gap-2 transition-opacity duration-300 ${on ? "opacity-100" : "opacity-55 group-hover:opacity-80"}`}>
                    <s.Icon size={20} color={on ? "var(--violet)" : "var(--ink)"} aria-hidden="true" />
                    <span className="display text-[20px]">{s.title}</span>
                  </div>
                  <p className={`mt-1 text-[14px] leading-snug transition-opacity duration-300 ${on ? "text-ink-2" : "text-ink-2/60"}`}>{s.body}</p>
                  <div className="mt-4 h-[2px] overflow-hidden rounded-full bg-line">
                    {on && <Progress key={active} ms={STEP_MS[active]} paused={paused} onDone={next} />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* stage: one fixed size for every step; pauses while you hover it */}
          <div
            className="card relative mt-10 h-[720px] overflow-hidden sm:h-[560px]"
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
          >
            <div className="dot-grid pointer-events-none absolute inset-0" />
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(143,108,247,0.18),transparent)]" />
            <div className="absolute left-5 top-5 z-10 rounded-full border border-line bg-white px-3 py-1 text-[12px] font-semibold text-ink-2 sm:left-6 sm:top-6">
              {STEPS[active].who}
            </div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={active}
                className="absolute inset-0 flex items-center justify-center px-4 pb-6 pt-16 sm:px-8 sm:pb-8 sm:pt-16"
                initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -10, filter: "blur(6px)" }}
                transition={{ duration: 0.5, ease: EASE }}
              >
                {active === 0 && <PasteStage />}
                {active === 1 && <ApplyStage />}
                {active === 2 && <VetStage />}
                {active === 3 && <DecideStage />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

function Progress({ ms, paused, onDone }: { ms: number; paused: boolean; onDone: () => void }) {
  const [scope, animate] = useAnimate();
  const ctrl = useRef<ReturnType<typeof animate> | null>(null);
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  });
  useEffect(() => {
    let alive = true;
    const a = animate(scope.current, { width: "100%" }, { duration: ms / 1000, ease: "linear" });
    a.pause();
    ctrl.current = a;
    a.then(() => {
      if (alive) done.current();
    });
    return () => {
      alive = false;
      a.stop();
    };
  }, [animate, scope, ms]);
  useEffect(() => {
    if (paused) ctrl.current?.pause();
    else ctrl.current?.play();
  }, [paused]);
  return <div ref={scope} className="h-full w-0 rounded-full" style={{ background: "var(--ink)" }} />;
}

function PasteStage() {
  const [copied, setCopied] = useState(false);
  return (
    <div className="w-full max-w-[420px]">
      <div className="rounded-[22px] border border-line bg-white p-4 shadow-[0_30px_60px_-30px_rgba(40,30,110,0.35)]">
        <div className="flex items-center gap-2 border-b border-line pb-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/ig/mia.jpg" alt="" className="h-8 w-8 rounded-full object-cover" />
          <div className="text-[13px] leading-tight">
            <div className="font-semibold">mia.eats.lisbon</div>
            <div className="text-muted">Instagram</div>
          </div>
        </div>
        <div className="mt-3 w-fit max-w-[85%] rounded-[16px] bg-[#f1f2f6] px-3 py-2 text-[14px]">Would you be open to a collab? ☕</div>
        <div className="ml-auto mt-2 w-fit max-w-[88%] rounded-[14px] bg-[#5e49f0] px-3 py-2 text-[14px] leading-snug text-white">{REPLY}</div>
      </div>
      {/* turns green and pops emoji the moment it's clicked */}
      <button
        onClick={async (e) => {
          const r = e.currentTarget.getBoundingClientRect();
          emojiBurst(r.left + r.width / 2, r.top + r.height / 2);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
          try {
            await navigator.clipboard.writeText(REPLY);
          } catch {}
        }}
        className={`btn btn-dark mx-auto mt-5 flex w-fit !pr-5 ${copied ? "!bg-[#22b07d]" : ""}`}
        style={{ transition: "background-color 250ms ease, transform 300ms cubic-bezier(0.2, 0.8, 0.2, 1)" }}
        aria-live="polite"
      >
        {copied && <RiCheckLine size={18} color="#fff" aria-hidden="true" />}
        {copied ? "Copied to clipboard" : "Copy the reply"}
      </button>
    </div>
  );
}

function ApplyStage() {
  return (
    <div className="w-full max-w-[380px] rounded-[22px] border border-line bg-white p-5 text-[13px] shadow-[0_30px_60px_-30px_rgba(40,30,110,0.35)]">
      <div className="flex items-center gap-2 text-[12px] text-muted">
        <BrandIcon size={16} /> benable.com/c/foundcoffee
      </div>
      <div className="display mt-2 text-[21px]">Collab with Found Coffee</div>
      <div className="mt-4 space-y-3.5">
        <Field label="What are you hoping for?">
          <Chip on>Gifted visit</Chip>
          <Chip>Paid</Chip>
        </Field>
        <Field label="What would you post?">
          <Chip on>1 reel</Chip>
          <Chip on>3 stories</Chip>
          <Chip>TikTok</Chip>
        </Field>
        <Field label="Your idea">
          <div className="rounded-xl bg-[#f4f5f9] px-3 py-2 text-ink-2">A slow-morning reel: oat flat white, pastel de nata, window seat.</div>
        </Field>
        <Field label="When are you free?">
          <div className="rounded-xl bg-[#f4f5f9] px-3 py-2 text-ink-2">Weekday mornings</div>
        </Field>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-muted">{label}</div>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Chip({ on, children }: { on?: boolean; children: ReactNode }) {
  return <span className={`rounded-full px-3 py-1 ${on ? "bg-ink text-white" : "border border-line text-ink-2"}`}>{children}</span>;
}

const CHECKS: { title: string; hint: string; value: string; pill?: boolean }[] = [
  { title: "Fake followers", hint: "inflated or bought numbers", value: "None found", pill: true },
  { title: "Content quality", hint: "their last 24 posts", value: "Strong", pill: true },
  { title: "Audience location", hint: "where their followers live", value: "91% Lisbon" },
  { title: "Red flags", hint: "anything that could reflect badly on you", value: "None in 24 posts", pill: true },
  { title: "Successful collabs", hint: "evidence they delivered before", value: "2 local cafés" },
  { title: "True engagement rate", hint: "real likes and comments, not bought", value: "6.4%" },
  { title: "Audience size", hint: "followers across platforms", value: "24.1K" },
];

const RULES: { title: string; Icon: RemixiconComponentType }[] = [
  {
    title: "Creator size",
    Icon: RiTeamLine,
  },
  {
    title: "Gifting vs paid",
    Icon: RiGift2Line,
  },
  {
    title: "Availability",
    Icon: RiCalendarLine,
  },
  {
    title: "Your criteria",
    Icon: RiEqualizerLine,
  },
];

// timeline for one loop of the vetting step, in seconds after it starts
const TICK = (i: number) => 0.35 + i * 0.26; // the seven checks
const CHECKS_DONE = TICK(CHECKS.length - 1) + 0.35;
const PRESS = CHECKS_DONE + 0.7; // the + gets clicked
const OPEN = PRESS + 0.25; // card slides left, rules pop up
const CLOSE = OPEN + 5;
const RESTART = CLOSE + 1.0;

// side-by-side layout (lg+): card, gap with the thread, rules popup
const CARD_W = 480;
const GAP = 88;
const POP_W = 360;
const SHIFT = (GAP + POP_W) / 2; // how far right the card sits while it's alone, so it reads centered

const LG = "(min-width: 1024px)";
function useLg() {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(LG);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia(LG).matches,
    () => false
  );
}

function useAfter(seconds: number) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setOn(true), seconds * 1000);
    return () => clearTimeout(t);
  }, [seconds]);
  return on;
}

function Tick({ delay }: { delay: number }) {
  return (
    <motion.span
      className="grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full bg-[#e5f5ee]"
      initial={{ scale: 0.4, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 480, damping: 22, delay }}
    >
      <RiCheckLine size={14} color="var(--mint)" aria-hidden="true" />
    </motion.span>
  );
}

// each loop remounts the scene, so every timer restarts from the closed, centered state
function VetStage() {
  const [loop, setLoop] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setLoop((l) => l + 1), RESTART * 1000);
    return () => clearTimeout(t);
  }, [loop]);
  return <VetLoop key={loop} />;
}

// offset of `el` inside `root`, ignoring transforms, so it measures the open layout
function offsetIn(el: HTMLElement, root: HTMLElement) {
  let x = 0;
  let y = 0;
  let n: HTMLElement | null = el;
  while (n && n !== root) {
    x += n.offsetLeft;
    y += n.offsetTop;
    n = n.offsetParent as HTMLElement | null;
  }
  return { x, y };
}

function VetLoop() {
  const lg = useLg();
  const checked = useAfter(CHECKS_DONE);
  const pressed = useAfter(PRESS);
  const opened = useAfter(OPEN);
  const closed = useAfter(CLOSE);
  const open = opened && !closed;

  const root = useRef<HTMLDivElement>(null);
  const fab = useRef<HTMLSpanElement>(null);
  const head = useRef<HTMLDivElement>(null);
  const [thread, setThread] = useState<{ d: string; ex: number; ey: number } | null>(null);

  useLayoutEffect(() => {
    if (!lg || !root.current || !fab.current || !head.current) return;
    const r = root.current;
    const measure = () => {
      const f = offsetIn(fab.current!, r);
      const h = offsetIn(head.current!, r);
      const sx = f.x + fab.current!.offsetWidth / 2;
      const sy = f.y + fab.current!.offsetHeight / 2;
      const ex = h.x;
      const ey = h.y + head.current!.offsetHeight / 2;
      const c = (ex - sx) * 0.6;
      setThread({ d: `M ${sx} ${sy} C ${sx + c} ${sy}, ${ex - c} ${ey}, ${ex} ${ey}`, ex, ey });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(r);
    return () => ro.disconnect();
  }, [lg]);

  const popup = (
    <motion.div
      className="relative flex shrink-0 flex-col overflow-hidden rounded-[24px] bg-[#f1eefe] shadow-[0_30px_70px_-36px_rgba(60,40,180,0.5),0_0_0_1px_rgba(122,92,250,0.08)]"
      style={{ width: lg ? POP_W : "min(100%, 400px)", transformOrigin: lg ? "left center" : "center bottom", pointerEvents: open ? "auto" : "none" }}
      initial={false}
      animate={open ? { opacity: 1, x: 0, y: 0, scale: 1 } : { opacity: 0, x: lg ? -28 : 0, y: lg ? 0 : 18, scale: 0.94 }}
      transition={open ? { duration: 0.6, ease: EASE, delay: 0.22 } : { duration: 0.35, ease: EASE }}
      aria-hidden={!open}
    >
      <div ref={head} className="flex items-center gap-3 bg-[#7a5cfa] px-4 py-3.5 text-white sm:px-5">
        <span className="min-w-0 leading-tight">
          <span className="block text-[15px] font-semibold">Set any of your own rules</span>
          <span className="block truncate text-[12.5px] text-white/75">Creator size, gifting vs paid, availability, your criteria</span>
        </span>
      </div>

      <div className="grid grid-cols-2 content-start gap-2 p-2.5 md:grid-cols-1 md:gap-2 md:p-3">
        {RULES.map((r) => (
          <RuleRow key={r.title} rule={r} />
        ))}
      </div>

    </motion.div>
  );

  return (
    <div ref={root} className="relative flex w-full items-center justify-center" style={lg ? { width: CARD_W + GAP + POP_W, gap: GAP } : undefined}>
      {/* the seven checks, with the + floating on its edge */}
      <motion.div
        className="relative w-full shrink-0"
        style={{ width: lg ? CARD_W : undefined, maxWidth: lg ? undefined : 480 }}
        initial={false}
        animate={lg ? { x: open ? 0 : SHIFT } : { x: 0, opacity: open ? 0.45 : 1, scale: open ? 0.96 : 1 }}
        transition={{ duration: 0.8, ease: EASE, delay: open ? 0 : 0.15 }}
      >
        <div className="overflow-hidden rounded-[24px] bg-white shadow-[0_30px_70px_-36px_rgba(40,30,110,0.45),0_0_0_1px_rgba(22,26,53,0.05)]">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/ig/mia.jpg" alt="" className="h-8 w-8 rounded-full object-cover" />
            <p className="min-w-0 flex-1 truncate text-[14px] text-muted">
              Example: <span className="font-semibold text-ink">Mia Duarte</span>, mia.eats.lisbon
            </p>
            <span className={`relative grid h-[26px] shrink-0 place-items-center overflow-hidden rounded-full px-2.5 text-[12px] font-semibold transition-colors duration-500 ${checked ? "bg-[#e5f5ee] text-[#178a60]" : "bg-[#f1f0fb] text-violet"} ${lg ? "mr-4" : ""}`}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.span key={checked ? "done" : "busy"} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }} transition={{ duration: 0.25 }}>
                  {checked ? "All clear" : "Checking…"}
                </motion.span>
              </AnimatePresence>
            </span>
          </div>
          <ul>
            {CHECKS.map((c, i) => (
              <motion.li
                key={c.title}
                className="flex h-[40px] items-center gap-3 border-t border-line px-4 sm:h-[42px] sm:px-5"
                initial={{ opacity: 0.35 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: TICK(i) }}
              >
                <Tick delay={TICK(i)} />
                <p className="min-w-0 flex-1 truncate text-[14px]">
                  <span className="font-semibold text-ink">{c.title}</span>
                  <span className="hidden text-muted lg:inline"> · {c.hint}</span>
                </p>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: TICK(i) + 0.1 }}
                  className={`${c.pill ? "shrink-0 rounded-full bg-[#f0eee9] px-2.5 py-[3px] text-[12.5px] font-semibold text-ink" : "shrink-0 text-[13.5px] font-semibold text-ink"} ${lg ? "mr-4" : ""}`}
                >
                  {c.value}
                </motion.span>
              </motion.li>
            ))}
          </ul>
        </div>

        {/* floating +: right edge on desktop, bottom corner when stacked */}
        <span ref={fab} className={`absolute z-10 h-11 w-11 ${lg ? "-right-[22px] top-1/2 -mt-[22px]" : "-bottom-[22px] right-5"}`}>
          {pressed && (
            <motion.span
              className="absolute inset-0 rounded-full border-2 border-[#7a5cfa]"
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 1.9, opacity: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            />
          )}
          <motion.span
            className="grid h-full w-full place-items-center rounded-full bg-[#7a5cfa] shadow-[0_12px_24px_-8px_rgba(122,92,250,0.6),0_0_0_4px_#fff]"
            initial={false}
            animate={{ scale: pressed && !opened ? 0.86 : 1, rotate: open ? 45 : 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 24 }}
          >
            <RiAddLine size={22} color="#fff" aria-hidden="true" />
          </motion.span>
        </span>
      </motion.div>

      {/* your own rules: beside the card on desktop, over it when stacked */}
      {lg ? popup : <div className="pointer-events-none absolute inset-0 flex items-center justify-center">{popup}</div>}

      {/* the thread from the + to the popup */}
      {lg && thread && (
        <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
          <motion.path
            d={thread.d}
            fill="none"
            stroke="#7a5cfa"
            strokeOpacity={0.55}
            strokeWidth={1.25}
            strokeLinecap="round"
            initial={false}
            animate={{ pathLength: open ? 1 : 0, opacity: open ? 1 : 0 }}
            transition={open ? { duration: 0.6, ease: EASE, delay: 0.55 } : { duration: 0.3, ease: EASE }}
          />
          <motion.circle
            cx={thread.ex}
            cy={thread.ey}
            r={3.5}
            fill="#7a5cfa"
            initial={false}
            animate={{ opacity: open ? 1 : 0, scale: open ? 1 : 0.4 }}
            transition={{ duration: 0.3, delay: open ? 1.05 : 0 }}
          />
        </svg>
      )}
    </div>
  );
}

function RuleRow({ rule }: { rule: (typeof RULES)[number] }) {
  return (
    <div className="flex h-[70px] flex-col justify-center gap-1.5 rounded-[14px] bg-white px-3 shadow-[0_6px_16px_-12px_rgba(60,40,160,0.4)] md:h-[54px] md:flex-row md:items-center md:justify-start md:gap-3">
      <span className="hidden h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-[#f2effe] md:grid">
        <rule.Icon size={18} color="#7a5cfa" aria-hidden="true" />
      </span>
      <span className="min-w-0 truncate text-[12.5px] font-semibold text-ink md:flex-1 md:text-[14px]">{rule.title}</span>
      <span className="flex h-[26px] w-full shrink-0 items-center justify-center rounded-full bg-[#f4f4f6] text-[12.5px] font-semibold text-[#1c1c1c] shadow-[inset_0_0_0_0.5px_#c3c5d3] md:h-[28px] md:w-[56px]">
        Set
      </span>
    </div>
  );
}

type Fit = "no" | "maybe" | "strong";

// the three readings on the fit gauge, left to right
const FIT: Record<Fit, { label: string; solid: string; pale: string; noteBg: string; noteText: string; angle: number }> = {
  no: { label: "Not a fit", solid: "#e5484d", pale: "#fbd3d3", noteBg: "#fef4f3", noteText: "#7c3a36", angle: 172 },
  maybe: { label: "Maybe", solid: "#e9a23b", pale: "#f6e5c6", noteBg: "#fffaf0", noteText: "#6e5222", angle: 90 },
  strong: { label: "Strong fit", solid: "#3ca44f", pale: "#d3ecd2", noteBg: "#f2fef7", noteText: "#3f5c3a", angle: 8 },
};

const VERDICTS: { name: string; handle: string; reach: string; img: string; fit: Fit; ask: string; note: string }[] = [
  {
    name: "Jordan Blake",
    handle: "@Jordan_Blake",
    reach: "41.2K",
    img: "/img/decide/jordan.jpg",
    fit: "no",
    ask: "Paid Reel for €400. 12% Lisbon audience, and most of the likes look bought.",
    note: "Jordan doesn't look like a fit. Most followers live outside Lisbon and engagement looks inflated.",
  },
  {
    name: "Rafa Costa",
    handle: "@rafa.eats",
    reach: "8.9K",
    img: "/img/ig/rafa.jpg",
    fit: "maybe",
    ask: "Gifted brunch for two, one Reel. Local audience, but only a few posts so far.",
    note: "Rafa could work. The audience is local, there's just not much to judge yet.",
  },
  {
    name: "Mia Duarte",
    handle: "@mia.eats.lisbon",
    reach: "24.1K",
    img: "/img/ig/mia.jpg",
    fit: "strong",
    ask: "Gifted visit for a Reel and two Stories. 91% Lisbon audience, strong content.",
    note: "Mia looks like a strong fit, with a real local audience and clean, consistent content.",
  },
];

// gauge geometry: a 240° dial in a 100×78 box, split into three segments
const G = { cx: 50, cy: 50, r: 40, from: 210, to: -30, gap: 11 };
const polar = (a: number, r = G.r) => {
  const t = (a * Math.PI) / 180;
  return `${(G.cx + r * Math.cos(t)).toFixed(2)} ${(G.cy - r * Math.sin(t)).toFixed(2)}`;
};
const SEG = (G.from - G.to - 2 * G.gap) / 3;
const ARCS = (["no", "maybe", "strong"] as const).map((fit, i) => {
  const a1 = G.from - i * (SEG + G.gap);
  const a2 = a1 - SEG;
  return { fit, d: `M ${polar(a1)} A ${G.r} ${G.r} 0 0 1 ${polar(a2)}` };
});

function Gauge({ fit, live }: { fit: Fit; live: boolean }) {
  // the needle swings in from straight up to its reading
  const angle = useMotionValue(live ? 90 : FIT[fit].angle);
  useEffect(() => {
    const a = animate(angle, FIT[fit].angle, { type: "spring", stiffness: 90, damping: 13, delay: 0.45 });
    return () => a.stop();
  }, [angle, fit]);
  const x2 = useTransform(angle, (a) => G.cx + 30 * Math.cos((a * Math.PI) / 180));
  const y2 = useTransform(angle, (a) => G.cy - 30 * Math.sin((a * Math.PI) / 180));
  return (
    <svg viewBox="0 0 100 78" className="h-[62px] w-[80px]" aria-hidden="true">
      {ARCS.map((a) => (
        <path key={a.fit} d={a.d} fill="none" strokeWidth={5.5} strokeLinecap="round" stroke={a.fit === fit ? FIT[a.fit].solid : FIT[a.fit].pale} />
      ))}
      <motion.line x1={G.cx} y1={G.cy} x2={x2} y2={y2} stroke="#1c1c1c" strokeWidth={3} strokeLinecap="round" />
      <circle cx={50} cy={50} r={3.5} fill="#fff" stroke="#1c1c1c" strokeWidth={1.6} />
    </svg>
  );
}

function VerdictCard({ v, live }: { v: (typeof VERDICTS)[number]; live: boolean }) {
  const f = FIT[v.fit];
  return (
    <div className="flex flex-col gap-1.5 overflow-hidden rounded-[22px] bg-[#f2f2f2] shadow-[0_24px_50px_-28px_rgba(22,26,53,0.35),0_4px_14px_rgba(0,0,0,0.08)]">
      <div className="bg-white px-4 pb-4 pt-3.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={v.img} alt="" className="h-10 w-10 shrink-0 rounded-full border border-white object-cover shadow-[0_4px_7px_rgba(0,0,0,0.08)]" />
            <div className="min-w-0">
              <div className="flex items-center gap-1 text-[13.5px] font-semibold text-black">
                <span className="truncate">{v.name}</span>
                <RiVerifiedBadgeFill size={15} color="#3897f0" aria-hidden="true" className="shrink-0" />
              </div>
              <div className="mt-0.5 truncate text-[11.5px] text-[#999]">
                {v.handle} · {v.reach}
              </div>
            </div>
          </div>
          <span className="shrink-0 rounded-full border border-white px-3.5 py-[7px] text-[12.5px] font-medium leading-none text-white" style={{ background: f.solid }}>
            {f.label}
          </span>
        </div>
        <p className="mt-3 text-[14px] font-medium leading-[1.3] text-[#1c1c1c]">{v.ask}</p>
      </div>

      <div className="bg-white p-4">
        <div className="flex items-center justify-between gap-3 text-[12.5px] leading-4">
          <span className="shrink-0 font-bold text-[#1c1c1c]">Fit checker</span>
          <span className="truncate text-[#717171]">Collab requested October 19, 2026</span>
        </div>
        <div className="mt-2.5">
          <div className="relative z-10 flex h-[106px] flex-col items-center justify-center gap-1.5 rounded-[12px] bg-white shadow-[inset_0_0_0_0.5px_#e3e3e3]">
            <Gauge fit={v.fit} live={live} />
            <span className="text-[14px] font-bold" style={{ color: f.solid }}>
              {f.label}
            </span>
          </div>
          <p
            className="-mt-3 rounded-b-[12px] px-5 pb-2.5 pt-[22px] text-center text-[12.5px] leading-snug shadow-[inset_0_0_0_0.5px_#e3e3e3]"
            style={{ background: f.noteBg, color: f.noteText }}
          >
            {v.note}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2.5 border-t border-[#ececf1] bg-white px-4 py-3">
        <span className="flex h-10 w-[96px] items-center justify-center rounded-[14px] bg-[#f1f1f1] text-[14px] font-medium text-[#161a35]">Decline</span>
        <span className="flex h-10 w-[176px] items-center justify-center rounded-[14px] bg-[#7a5cfa] text-[14px] font-medium text-white">Interested</span>
      </div>
    </div>
  );
}

function DecideStage() {
  const [front, ...rest] = VERDICTS;
  return (
    <div className="relative w-full max-w-[440px] pt-6">
      {/* the next requests in the pile peek out above the one on top, then fan out to either side */}
      {rest
        .map((v, i) => {
          const side = i === 0 ? 1 : -1;
          return (
            <motion.div
              key={v.name}
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0"
              style={{ originY: 0 }}
              initial={{ x: 0, y: 12 - i * 12, scale: 0.95 - i * 0.05 }}
              animate={{ x: `${side * 13}%`, y: 40, scale: 0.93 }}
              transition={{ duration: 0.9, ease: EASE, delay: 1 + i * 0.08 }}
            >
              {/* tilt from the bottom edge, like a hand of cards */}
              <motion.div
                style={{ originY: 1 }}
                initial={{ rotate: 0 }}
                animate={{ rotate: side * 3.5 }}
                transition={{ duration: 0.9, ease: EASE, delay: 1 + i * 0.08 }}
              >
                <VerdictCard v={v} live={false} />
              </motion.div>
            </motion.div>
          );
        })
        .reverse()}
      <div className="relative">
        <VerdictCard v={front} live />
      </div>
    </div>
  );
}
