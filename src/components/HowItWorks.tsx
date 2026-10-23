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
  type RemixiconComponentType,
} from "@remixicon/react";
import { AnimatePresence, motion, useAnimate, useInView } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, SectionHead } from "./ui";
import { BrandIcon } from "./Logo";

const EASE = [0.22, 1, 0.36, 1] as const;
// how long each step stays on screen; the vetting step needs time to show the rules drawer
const STEP_MS = [5200, 5600, 9000, 6000];

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
    who: "Benable, in the background",
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
  return <div ref={scope} className="h-full w-0 rounded-full" style={{ background: "var(--grad)" }} />;
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
      <button
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(REPLY);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
          } catch {}
        }}
        className="btn btn-dark mx-auto mt-5 flex w-fit !pr-5"
        aria-live="polite"
      >
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

const RULES: { title: string; value: string; Icon: RemixiconComponentType }[] = [
  {
    title: "Creator size",
    value: "5K+",
    Icon: RiTeamLine,
  },
  {
    title: "Gifting vs paid",
    value: "Gifted only",
    Icon: RiGift2Line,
  },
  {
    title: "Availability",
    value: "Weekdays",
    Icon: RiCalendarLine,
  },
  {
    title: "Your criteria",
    value: "Local only",
    Icon: RiEqualizerLine,
  },
];

// timeline for the vetting step, in seconds after it appears
const TICK = (i: number) => 0.25 + i * 0.26; // the seven checks
const CHECKS_DONE = TICK(CHECKS.length - 1) + 0.35;
const RULE = (i: number) => CHECKS_DONE + 0.5 + i * 0.42; // each rule gets set
const ALL_MATCH = RULE(RULES.length - 1) + 0.55;

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

function VetStage() {
  const checked = useAfter(CHECKS_DONE);
  const matched = useAfter(ALL_MATCH);

  return (
    <div className="grid w-full max-w-[920px] gap-4 md:grid-cols-[1.15fr_0.85fr] md:gap-5">
      {/* the seven checks */}
      <div className="overflow-hidden rounded-[24px] bg-white shadow-[0_30px_70px_-36px_rgba(40,30,110,0.45),0_0_0_1px_rgba(22,26,53,0.05)]">
        <div className="flex items-center gap-3 px-4 py-3 sm:px-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/ig/mia.jpg" alt="" className="h-8 w-8 rounded-full object-cover" />
          <p className="min-w-0 flex-1 truncate text-[14px] text-muted">
            Example: <span className="font-semibold text-ink">Mia Duarte</span>, mia.eats.lisbon
          </p>
          <span className={`relative grid h-[26px] shrink-0 place-items-center overflow-hidden rounded-full px-2.5 text-[12px] font-semibold transition-colors duration-500 ${checked ? "bg-[#e5f5ee] text-[#178a60]" : "bg-[#f1f0fb] text-violet"}`}>
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
                className={c.pill ? "shrink-0 rounded-full bg-[#f0eee9] px-2.5 py-[3px] text-[12.5px] font-semibold text-ink" : "shrink-0 text-[13.5px] font-semibold text-ink"}
              >
                {c.value}
              </motion.span>
            </motion.li>
          ))}
        </ul>
      </div>

      {/* your own rules */}
      <div className="flex flex-col overflow-hidden rounded-[24px] bg-[#ece9fb] shadow-[0_30px_70px_-36px_rgba(60,40,180,0.5),0_0_0_1px_rgba(80,53,227,0.08)]">
        <div className="flex items-center gap-3 bg-[#5035e3] px-4 py-3.5 text-white sm:px-5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/20">
            <RiAddLine size={18} color="#fff" aria-hidden="true" />
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block text-[15px] font-semibold">Set any of your own rules</span>
            <span className="block truncate text-[12.5px] text-white/75">Creator size, gifting vs paid, availability, your criteria</span>
          </span>
        </div>

        <div className="grid flex-1 grid-cols-2 content-start gap-2 p-2.5 md:grid-cols-1 md:gap-2 md:p-3">
          {RULES.map((r, i) => (
            <RuleRow key={r.title} rule={r} at={RULE(i)} />
          ))}
        </div>

        <div className="mx-2.5 mb-2.5 h-[44px] md:mx-3 md:mb-3">
          <AnimatePresence>
            {matched && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: EASE }}
                className="flex h-full items-center justify-center gap-2 rounded-[14px] bg-white/70 text-[13.5px] font-semibold text-[#178a60]"
              >
                <Check /> Mia matches all 4 of your rules
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function RuleRow({ rule, at }: { rule: (typeof RULES)[number]; at: number }) {
  const set = useAfter(at);
  return (
    <div className="flex h-[70px] flex-col justify-center gap-1.5 rounded-[14px] bg-white px-3 shadow-[0_6px_16px_-12px_rgba(60,40,160,0.4)] md:h-[54px] md:flex-row md:items-center md:justify-start md:gap-3">
      <span className="hidden h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-[#efecfd] md:grid">
        <rule.Icon size={18} color="#5035e3" aria-hidden="true" />
      </span>
      <span className="min-w-0 truncate text-[12.5px] font-semibold text-ink md:flex-1 md:text-[14px]">{rule.title}</span>
      {/* fixed-size slot so swapping "Set" for the value never shifts anything */}
      <span className="relative h-[26px] w-full shrink-0 md:h-[28px] md:w-[92px]">
        <AnimatePresence mode="popLayout" initial={false}>
          {set ? (
            <motion.span
              key="value"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 420, damping: 26 }}
              className="absolute inset-0 flex items-center justify-center rounded-full bg-[#5035e3] px-2 text-[12px] font-semibold text-white md:text-[12.5px]"
            >
              {rule.value}
            </motion.span>
          ) : (
            <motion.span
              key="set"
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 flex items-center justify-center rounded-full bg-[#efecfd] text-[12.5px] font-semibold text-[#5035e3]"
            >
              Set
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </div>
  );
}

function DecideStage() {
  return (
    <div className="relative w-full max-w-[420px]">
      <div className="absolute inset-x-6 -top-4 h-full rotate-[-3deg] rounded-[22px] border border-line bg-white/70" />
      <div className="relative rounded-[22px] border border-line bg-white p-5 shadow-[0_30px_60px_-30px_rgba(40,30,110,0.35)]">
        <div className="flex items-center gap-3 border-b border-line pb-3 text-[13px]">
          <BrandIcon size={36} />
          <div className="leading-tight">
            <div className="font-semibold">Your Benable dashboard</div>
            <div className="text-muted">Found Coffee</div>
          </div>
          <span className="ml-auto text-[12px] text-muted">Checked today</span>
        </div>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-mint/12 px-3 py-1 text-[13px] font-semibold text-[#178a60]">
          <Check /> Worth a yes
        </div>
        <div className="mt-2 text-[18px] font-semibold leading-snug">Mia wants a gifted visit for 2, in exchange for a reel and 3 stories.</div>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-2">Real engagement, 91% of her audience within 15 km, and two café collabs that performed.</p>
        <div className="mt-4 flex gap-2">
          <span className="btn btn-dark !py-2 !pl-4 !pr-4 text-[14px]">Yes, book her</span>
          <span className="btn btn-light !py-2 !pl-4 !pr-4 text-[14px]">No thanks</span>
        </div>
      </div>
    </div>
  );
}
