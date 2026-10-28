"use client";

import {
  RiArrowDownSLine,
  RiArrowLeftSLine,
  RiCheckLine,
  RiEyeLine,
  RiImageAddLine,
  RiInstagramLine,
  RiLockLine,
  RiListCheck2,
  RiMapPin2Line,
} from "@remixicon/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useId, useRef, useState, useSyncExternalStore, type FormEvent, type ReactNode } from "react";
import { Avatar } from "../HandleForm";
import Logo from "../Logo";
import { cleanHandle, displayName } from "../names";
import { OTHER, READY, useCustom, type AskedStep, type PreviewMessage, type Question, type Screen } from "./custom";
import PreviewDevice from "./PreviewDevice";

/*
  benable.com/c/<handle>, what a creator sees after the business replies to their DM with its link.
  Built for a phone first (most creators open it inside Instagram): one question per screen,
  a sticky button within thumb reach, and the draft saved as they go.
  Copy is Tony's, from his prototype.
*/

const EASE = [0.22, 1, 0.36, 1] as const;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const RANGES = ["Under $100", "$100 to $250", "$250 to $500", "$500 to $1,000", "$1,000+"];

type Step = "opener" | "socials" | "collab" | "payment" | "audience" | "manual" | "based" | "contact" | "custom" | "extra" | "done";
const GROUPS = ["Socials", "Collab", "Audience", "Details"];
/* where a step sits in the progress bar; the business's own questions (n of them, asked after ours) stretch Details */
function place(step: Step, n: number, qi: number): [group: number, at: number, of: number] | undefined {
  const fixed: Partial<Record<Step, [number, number, number]>> = {
    socials: [0, 1, 1],
    collab: [1, 1, 2],
    payment: [1, 2, 2],
    audience: [2, 1, 2],
    manual: [2, 2, 2],
    based: [3, 1, 3 + n],
    contact: [3, 2, 3 + n],
    custom: [3, 3 + qi, 3 + n],
    extra: [3, 3 + n, 3 + n],
  };
  return fixed[step];
}

/*
  The business's preview fills the form in for them: each step types its answers, then a tap hint
  sits on the button that moves on, so they can tap through the whole flow the way a creator would.
*/
const DEMO = { name: "Nia Carter", followers: "33.9K", avatar: "/img/dash/nia.jpg" };
const SCRIPT: Partial<Record<Step, [field: keyof Draft, value: string][]>> = {
  socials: [["handle", "niacarter"]],
  collab: [
    ["create", "A Reel and two Stories about your morning pour-overs and the pastries. Happy to film a tasting too."],
    ["want", "A complimentary visit for two. No payment needed."],
  ],
  payment: [
    ["paid", "yes"],
    ["range", "$100 to $250"],
    ["paid", "no"],
  ],
  based: [["based", "Highland Park, 10 min away"]],
  contact: [
    ["first", "Nia"],
    ["last", "Carter"],
    ["email", "niacarter@gmail.com"],
    ["phone", "(323) 555-0148"],
  ],
  extra: [["extra", "Weekday mornings work best. Happy to tag you in Stories too."]],
};
const TYPED = new Set<keyof Draft>(["handle", "create", "want", "based", "first", "last", "email", "phone", "extra"]);
type Lookup = "idle" | "searching" | "found" | "confirmed";

type Draft = {
  handle: string;
  create: string;
  want: string;
  paid: "" | "yes" | "no";
  range: string;
  insights: "" | "connected" | "manual";
  based: string;
  first: string;
  last: string;
  email: string;
  phone: string;
  extra: string;
  answers: Record<string, Answer>;
};
type Answer = { text: string; picks: string[]; other: string };
const NO_ANSWER: Answer = { text: "", picks: [], other: "" };
const EMPTY: Draft = { handle: "", create: "", want: "", paid: "", range: "", insights: "", based: "", first: "", last: "", email: "", phone: "", extra: "", answers: {} };

/* an answer counts once there's text, or a pick (and words for "Other" if that's the pick) */
const answered = (q: Question, a: Answer) =>
  q.kind === "text" ? !!a.text.trim() : a.picks.length > 0 && (!a.picks.includes(OTHER) || !!a.other.trim());

/* the Customize preview drives the flow from outside, so its fields mustn't pull focus from the editor */
const AutoFocus = createContext(true);

const draftKey = (business: string) => `cc:draft:${business}`;
function loadDraft(business: string): Draft {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(draftKey(business));
    return raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY;
  } catch {
    return EMPTY;
  }
}

const noop = () => () => {};
/* "preview": the business testing its link. "embed": the same flow inside PreviewDevice's phone.
   "customize": the Customize page's phone, which picks the screen and sends the unsaved edits. */
function useMode() {
  return useSyncExternalStore(
    noop,
    () => {
      const q = new URLSearchParams(window.location.search);
      return q.get("customize") === "1" ? "customize" : q.get("embed") === "1" ? "embed" : q.get("preview") === "1" ? "preview" : null;
    },
    () => null
  );
}
const WIDE = "(min-width: 640px)";
function useWide() {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(WIDE);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia(WIDE).matches,
    () => false
  );
}

export default function CreatorFlow({ handle }: { handle: string }) {
  const name = displayName(handle);
  const mode = useMode();
  const wide = useWide();
  const preview = mode === "preview";
  const demo = mode === "embed" || preview;
  const edit = mode === "customize";
  const router = useRouter();
  const reduce = useReducedMotion();

  const [current, setStep] = useState<Step>("opener");
  const [qi, setQi] = useState(0);
  const stored = useCustom(handle);
  /* customize: the editor posts its live copy and the screen to show, and asks again once we're listening */
  const [live, setLive] = useState<PreviewMessage | null>(null);
  useEffect(() => {
    if (!edit) return;
    const on = (e: MessageEvent) => e.origin === window.location.origin && e.data?.type === "cc:customize" && setLive(e.data as PreviewMessage);
    window.addEventListener("message", on);
    window.parent.postMessage({ type: READY }, window.location.origin);
    return () => window.removeEventListener("message", on);
  }, [edit]);
  const custom = live?.custom ?? stored;
  const screen: Screen | null = edit ? (live?.screen ?? { kind: "opener" }) : null;
  /* ?step=done (the control panel's "Creator done screen" shortcut) opens on the end screen, until they move on */
  const skipToDone = useSyncExternalStore(noop, () => new URLSearchParams(window.location.search).get("step") === "done", () => false);
  const [moved, setMoved] = useState(false);
  const step: Step = screen ? SCREEN_STEP(screen) : skipToDone && !moved ? "done" : current;
  /* the question on screen: the editor's draft while customizing, otherwise the business's own list */
  const qs = custom.questions;
  const question: Question | null = screen ? (screen.kind === "custom" ? screen.question : null) : (qs[qi] ?? null);
  const [dir, setDir] = useState<1 | -1>(1);
  // the opener shows none of the draft, so reading storage up front can't change the first paint
  const [d, setD] = useState<Draft>(() => loadDraft(handle));
  const [shots, setShots] = useState<(string | null)[]>([null, null, null]);
  const [connecting, setConnecting] = useState(false);
  const [headsUp, setHeadsUp] = useState(false);
  const [saved, setSaved] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const later = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms));
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  /* save the draft as they type; a quiet "Saved" says it worked (the preview's typed-in answers aren't kept) */
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => {
    const next = { ...d, [k]: v };
    setD(next);
    if (demo || edit) return;
    try {
      localStorage.setItem(draftKey(handle), JSON.stringify(next));
      setSaved(true);
    } catch {}
  };
  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 1400);
    return () => clearTimeout(t);
  }, [saved, d]);

  /* screenshots stay in this tab only; their object URLs are released when replaced or on leave */
  const shotsRef = useRef(shots);
  useEffect(() => {
    shotsRef.current = shots;
  }, [shots]);
  useEffect(() => () => shotsRef.current.forEach((u) => u && URL.revokeObjectURL(u)), []);
  const addShot = (i: number, file?: File) => {
    if (!file) return;
    setShots((prev) => {
      const next = [...prev];
      if (next[i]) URL.revokeObjectURL(next[i]!);
      next[i] = URL.createObjectURL(file);
      return next;
    });
  };

  /* preview: each step types its answers in, then flags the button to tap; leaving the step stops it */
  const [filled, setFilled] = useState<Step | null>(null);
  const [lookup, setLookup] = useState<Lookup>("idle");
  useEffect(() => {
    if (!demo) return;
    const ts: ReturnType<typeof setTimeout>[] = [];
    const put = (k: keyof Draft, v: string) => setD((p) => ({ ...p, [k]: v }));
    let t = 650; // let the step slide in first
    for (const [k, v] of SCRIPT[step] ?? []) {
      if (!TYPED.has(k)) {
        ts.push(setTimeout(() => put(k, v), t));
        t += 1100; // long enough to see each choice land
        continue;
      }
      ts.push(setTimeout(() => put(k, ""), t));
      const speed = v.length > 40 ? 22 : 60;
      for (let i = 1; i <= v.length; i++) ts.push(setTimeout(() => put(k, v.slice(0, i)), t + i * speed));
      t += v.length * speed + 380;
    }
    if (step === "socials") {
      // the same "is this you?" as the hero: look the handle up, then ask
      ts.push(setTimeout(() => setLookup("searching"), t));
      t += 1000;
      ts.push(setTimeout(() => setLookup("found"), t));
    }
    ts.push(setTimeout(() => setFilled(step), t));
    return () => {
      ts.forEach(clearTimeout);
      setFilled(null);
      setLookup("idle");
    };
  }, [demo, step]);
  const hint = (s: Step) => demo && filled === s && step === s;

  const go = (to: Step, direction: 1 | -1 = 1, toQ = 0) => {
    if (edit) return; // the preview shows what the editor picks
    setQi(toQ);
    setMoved(true);
    setDir(direction);
    setStep(to);
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };

  const valid: Record<Step, boolean> = {
    opener: true,
    socials: cleanHandle(d.handle).length > 0,
    collab: !!d.create.trim() && !!d.want.trim(),
    payment: d.paid === "no" || (d.paid === "yes" && !!d.range),
    audience: d.insights === "connected",
    manual: shots.every(Boolean),
    based: !!d.based.trim(),
    contact: !!d.first.trim() && !!d.last.trim() && EMAIL.test(d.email.trim()) && d.phone.replace(/\D/g, "").length >= 7,
    // the preview's tap-through doesn't type into the business's own questions, so it doesn't wait on them
    custom: demo || !question || answered(question, d.answers[question.id] ?? NO_ANSWER),
    extra: true,
    done: true,
  };

  const NEXT: Record<Step, Step> = {
    opener: "socials",
    socials: "collab",
    collab: "payment",
    payment: "audience",
    audience: "based",
    manual: "based",
    based: "contact",
    contact: qs.length ? "custom" : "extra",
    custom: qi < qs.length - 1 ? "custom" : "extra",
    extra: "done",
    done: "opener",
  };
  const BACK: Partial<Record<Step, Step>> = {
    socials: "opener",
    collab: "socials",
    payment: "collab",
    audience: "payment",
    manual: "audience",
    based: d.insights === "manual" ? "manual" : "audience",
    contact: "based",
    custom: qi > 0 ? "custom" : "contact",
    extra: qs.length ? "custom" : "contact",
  };
  /* which of the business's questions a move lands on */
  const nextQ = step === "custom" ? qi + 1 : 0;
  const backQ = step === "custom" ? qi - 1 : qs.length - 1;

  const connect = () => {
    setHeadsUp(false);
    if (connecting) return;
    setConnecting(true);
    later(() => {
      setConnecting(false);
      set("insights", "connected");
      // a beat on "Connected", then on to the next question, unless they already moved on
      later(() => {
        setDir(1);
        setStep((s) => (s === "audience" ? "based" : s));
      }, 900);
    }, 1600);
  };

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    if (edit || !valid[step]) return;
    if (step === "done") {
      const share = `/share?handle=${encodeURIComponent(handle)}`;
      if (mode === "embed") return void (window.top ?? window).location.assign(share);
      if (preview) return router.push(share);
      try {
        localStorage.removeItem(draftKey(handle));
      } catch {}
      setD(EMPTY);
      setShots([null, null, null]);
      return go("opener", -1);
    }
    go(NEXT[step], 1, nextQ);
  };

  const at = screen?.kind === "custom" ? place("custom", screen.total, screen.index) : screen?.kind === "empty" ? place("custom", screen.total, 0) : place(step, qs.length, qi);

  // on a laptop, the preview is the real flow inside a phone, so it reads the way creators see it
  if (preview && wide) return <PreviewDevice handle={handle} draftKey={draftKey(handle)} />;

  return (
    <AutoFocus value={!edit}>
    <div className="relative min-h-svh bg-[#f4f3f8]">
      {/* desktop: the café's own colours, blurred far back, so the card feels like theirs */}
      <div className="pointer-events-none fixed inset-0 hidden overflow-hidden sm:block" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/ig/foundcoffee.jpg" alt="" className="h-full w-full scale-125 object-cover opacity-35 blur-[90px]" />
        <div className="absolute inset-0 bg-[#f4f3f8]/60" />
      </div>

      {preview && (
        <div className="sticky top-0 z-40 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-ink px-4 py-2.5 text-center text-[13px] text-white/80">
          <span className="inline-flex items-center gap-1.5">
            <RiEyeLine size={15} aria-hidden="true" />
            Preview. This is what creators see.
          </span>
          <Link href={`/share?handle=${encodeURIComponent(handle)}`} className="font-semibold text-white underline decoration-white/40 underline-offset-4 hover:decoration-white">
            Back to your Concierge
          </Link>
        </div>
      )}

      <div className="relative mx-auto flex min-h-svh w-full max-w-[460px] flex-col bg-white sm:my-10 sm:min-h-[min(820px,calc(100svh-80px))] sm:rounded-[32px] sm:border sm:border-white/70 sm:shadow-[0_40px_90px_-40px_rgba(40,30,110,0.45)]">
        {step === "opener" ? (
          <Opener name={name} welcome={custom.welcome} onStart={() => go("socials")} hint={hint("opener")} />
        ) : step === "done" ? (
          <Done name={name} handle={handle} thanks={custom.thanks} onDone={() => submit()} hint={hint("done")} />
        ) : (
          <>
            <TopBar step={at!} onBack={() => go(BACK[step]!, -1, backQ)} saved={saved} handle={handle} />
            <form id="flow" onSubmit={submit} className="flex-1 px-6 pb-6 pt-7">
              <AnimatePresence mode="wait" custom={dir} initial={false}>
                <motion.div
                  key={step === "custom" ? `custom-${screen ? "edit" : qi}` : step}
                  custom={dir}
                  variants={{
                    enter: (s: number) => ({ x: reduce ? 0 : s * 28, opacity: 0 }),
                    center: { x: 0, opacity: 1 },
                    exit: (s: number) => ({ x: reduce ? 0 : s * -28, opacity: 0 }),
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.32, ease: EASE }}
                >
                  {step === "socials" && (
                    <Socials
                      d={d}
                      set={set}
                      lookup={demo ? lookup : undefined}
                      hint={hint("socials")}
                      onConfirm={() => {
                        setLookup("confirmed");
                        later(() => go("collab"), 700);
                      }}
                    />
                  )}
                  {step === "collab" && <Collab d={d} set={set} />}
                  {step === "payment" && <Payment d={d} set={set} />}
                  {step === "audience" && <Audience name={name} handle={cleanHandle(d.handle)} connecting={connecting} connected={d.insights === "connected"} />}
                  {step === "manual" && <Manual name={name} shots={shots} onAdd={addShot} />}
                  {step === "based" && <Based d={d} set={set} name={name} />}
                  {step === "contact" && <Contact d={d} set={set} />}
                  {step === "custom" &&
                    (question ? (
                      <Custom q={question} a={d.answers[question.id] ?? NO_ANSWER} onChange={(a) => set("answers", { ...d.answers, [question.id]: a })} />
                    ) : (
                      <NoQuestions />
                    ))}
                  {step === "extra" && <Extra d={d} set={set} />}
                </motion.div>
              </AnimatePresence>
            </form>
          </>
        )}

        {step !== "opener" && step !== "done" && !(demo && step === "socials") && (
          <Footer>
            {step === "audience" && d.insights !== "connected" ? (
              <>
                <Primary type="button" onClick={connect} busy={connecting} hint={hint("audience") && !connecting}>
                  {connecting ? (
                    "Connecting…"
                  ) : (
                    <>
                      <RiInstagramLine size={19} aria-hidden="true" /> Connect Instagram
                    </>
                  )}
                </Primary>
                <button type="button" onClick={() => setHeadsUp(true)} disabled={connecting} className="mt-1 h-11 w-full rounded-full text-[15px] font-semibold text-ink-2 transition-colors hover:bg-[#f4f3f8] disabled:opacity-40">
                  Enter manually
                </button>
              </>
            ) : step === "audience" ? (
              <Primary type="button" onClick={() => go("based")}>
                <RiCheckLine size={19} aria-hidden="true" /> Connected
              </Primary>
            ) : (
              <Primary type="submit" form="flow" disabled={!valid[step]} hint={hint(step) && valid[step]}>
                {step === "extra" ? "Send my request" : "Next"}
              </Primary>
            )}
          </Footer>
        )}

        <AnimatePresence>
          {headsUp && (
            <HeadsUp
              onConnect={connect}
              onManual={() => {
                setHeadsUp(false);
                set("insights", "manual");
                go("manual");
              }}
              onClose={() => setHeadsUp(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
    </AutoFocus>
  );
}

const SCREEN_STEP = (s: Screen): Step => (s.kind === "step" ? (s.step as AskedStep) : s.kind === "empty" ? "custom" : s.kind);

/* ---------- screens ---------- */

/*
  The first screen, built to Design Labs 15526:88239: the café's photo fading to white under a
  "Powered by Benable" strip, their avatar and name pill, the title, their welcome message, and Let's go.
*/
function Opener({ name, welcome, onStart, hint = false }: { name: string; welcome: string; onStart: () => void; hint?: boolean }) {
  return (
    <div className="relative flex flex-1 flex-col">
      <Cover height={415} top={0.5} />
      <PoweredBy />

      <Enter i={1} className="relative mt-[229.75px] flex flex-col items-center gap-6 px-[21.38px]">
        <Business name={name} />
        <Headline>Request a collab</Headline>
      </Enter>

      {/* the business's welcome DM (Customize); cleared, the screen goes straight to Let's go */}
      {welcome.trim() && (
        <Enter i={2} className="relative mt-[60.75px]">
          <Bubble>{welcome}</Bubble>
        </Enter>
      )}

      <div className="sticky bottom-0 z-20 mt-auto px-5 pb-[max(30.5px,env(safe-area-inset-bottom))] pt-6">
        <CardButton onClick={onStart} hint={hint}>
          Let&apos;s go
        </CardButton>
        <p className="mt-4 text-center text-[14px] leading-4 text-[#aaa]">About 2 minutes</p>
      </div>
    </div>
  );
}

/* ---------- the opener and thank-you screens share these, built to their Figma frames ---------- */

/* the café's photo, fading to white at the bottom */
function Cover({ height, top }: { height: number; top: number }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 overflow-hidden sm:rounded-t-[32px]" style={{ top, height }} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/img/creator/cover.png" alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-[linear-gradient(to_top,#fff,rgba(255,255,255,0))]" />
    </div>
  );
}

/* the dark strip at the top: "Powered by" and the Benable logo, centred on each other */
function PoweredBy() {
  return (
    <div className="sticky top-0 z-10 flex h-[67px] items-start justify-center bg-[linear-gradient(to_top,rgba(0,0,0,0)_4.753%,rgba(0,0,0,0.3)_74.958%)] px-5 pb-5 pt-3 text-white sm:rounded-t-[32px]">
      <div className="flex items-center gap-2">
        <span className="text-[16px] leading-[normal]">Powered by</span>
        <Logo height={25.115} />
      </div>
    </div>
  );
}

/* their avatar (a half-white hairline ring and a soft shadow) tucked into a white name pill with the brand gradient as its stroke */
function Business({ name }: { name: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="relative mb-[-18px] size-20 shrink-0 rounded-full shadow-[0_1px_14px_rgba(0,0,0,0.25)] outline outline-[1.5px] outline-white/50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/ig/foundcoffee.jpg" alt="" className="size-full rounded-full object-cover" />
      </span>
      <span className="relative max-w-full rounded-full border border-transparent px-4 py-1 [background:linear-gradient(#fff,#fff)_padding-box,var(--brand-grad)_border-box]">
        <span className="block truncate font-display text-[20px] font-medium leading-[normal] text-[#1c1c1c]">{name}</span>
      </span>
    </div>
  );
}

function Headline({ children }: { children: ReactNode }) {
  // ! beats the global h1 rule (bold, 0.98 line height, its own tracking)
  return <h1 className="w-full text-center font-display text-[30px] !font-extrabold uppercase !leading-[26px] !tracking-[-0.5px] text-[#474747]">{children}</h1>;
}

/* a DM from the business: their avatar and a grey bubble with a tucked bottom-left corner */
function Bubble({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-end gap-2.5 px-5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/img/ig/foundcoffee.jpg" alt="" width={32} height={32} className="size-8 shrink-0 rounded-full object-cover" />
      <p className="min-w-0 flex-1 rounded-[16px] rounded-bl-[4px] bg-[#eef2f5] py-2.5 pl-2.5 pr-[11px] font-[-apple-system,'SF_Pro','SF_Pro_Text','Helvetica_Neue',Inter,sans-serif] text-[14px] leading-[16.7px] tracking-[-0.3px] text-[#0f1316]">
        {children}
      </p>
    </div>
  );
}

function CardButton({ children, onClick, hint = false }: { children: ReactNode; onClick: () => void; hint?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex h-12 w-full items-center justify-center rounded-[12px] bg-[#7a5cfa] px-4 text-[16px] font-medium leading-[normal] text-white transition-[background-color,transform] duration-200 hover:bg-[#6c4ef0] active:scale-[0.985]"
    >
      {children}
      {hint && <TapHint />}
    </button>
  );
}

function Socials({ d, set, lookup, hint = false, onConfirm }: Bind & { lookup?: Lookup; hint?: boolean; onConfirm?: () => void }) {
  const id = useId();
  const open = lookup === "found" || lookup === "confirmed";
  return (
    <>
      <Title sub="Add your primary Instagram.">Your socials</Title>
      <div className="relative mt-7">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
          <IgGlyph />
        </span>
        <select aria-label="Platform" defaultValue="instagram" className={`${field} cursor-pointer appearance-none pl-12 pr-11 font-medium`}>
          <option value="instagram">Instagram</option>
          <option value="tiktok" disabled>
            TikTok (coming soon)
          </option>
        </select>
        <RiArrowDownSLine size={20} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
      </div>
      <label htmlFor={id} className="sr-only">
        Your handle
      </label>
      <div className={`${field} mt-3 flex items-center gap-1 focus-within:bg-white focus-within:shadow-[inset_0_0_0_2px_#5035e3]`}>
        <span className="text-muted">@</span>
        <input id={id} autoFocus={useContext(AutoFocus) && !lookup} autoCapitalize="none" autoCorrect="off" spellCheck={false} value={d.handle} onChange={(e) => set("handle", e.target.value)} placeholder="Your handle" className="h-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted" />
        {lookup === "searching" && <span className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-violet/15 border-t-violet motion-reduce:animate-none" aria-hidden="true" />}
        {open && (
          <motion.span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-mint/15 text-[#178a60]" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.35, ease: EASE }}>
            <RiCheckLine size={16} aria-label="Account found" />
          </motion.span>
        )}
      </div>

      {/* "is this you?", as in the hero: the account we found, and one tap to say yes */}
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Confirm your account"
            className="mt-3 flex items-center gap-3 rounded-[22px] border border-line bg-white p-3 shadow-[0_24px_50px_-22px_rgba(40,30,110,0.45)]"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.4, ease: EASE }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={DEMO.avatar} alt="" className="size-12 shrink-0 rounded-full object-cover" />
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-[16px] font-semibold text-ink">{DEMO.name}</div>
              {/* the handle is right above in the field, so the card spends its second line on reach */}
              <div className="mt-0.5 truncate text-[13.5px] text-muted">{DEMO.followers} followers</div>
            </div>
            <AnimatePresence mode="wait" initial={false}>
              {lookup === "confirmed" ? (
                <motion.span
                  key="yes"
                  role="status"
                  className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-mint px-4 text-[14px] font-semibold text-white"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, ease: EASE }}
                >
                  <RiCheckLine size={16} aria-hidden="true" /> That&apos;s me
                </motion.span>
              ) : (
                <motion.button
                  key="ask"
                  type="button"
                  onClick={onConfirm}
                  className="relative h-10 shrink-0 rounded-full bg-[#111] px-4 text-[14px] font-semibold text-white transition-colors hover:bg-black"
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                >
                  Yes, that&apos;s me
                  {hint && <TapHint />}
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Collab({ d, set }: Bind) {
  return (
    <>
      <Title>What did you have in mind for the collab?</Title>
      <Area label="What would you create or do for us?" hint="Share any specifics you have in mind, and say if you're open to other kinds of collabs too." value={d.create} onChange={(v) => set("create", v)} autoFocus className="mt-7" />
      <Area label="What would you like from us?" hint="Any complimentary services or products, and whether you're expecting payment." value={d.want} onChange={(v) => set("want", v)} className="mt-6" />
    </>
  );
}

function Payment({ d, set }: Bind) {
  return (
    <>
      <Title>Please confirm</Title>
      <div className="mt-7 text-[16px] font-semibold text-ink">Would you require a payment for this collab?</div>
      <div role="radiogroup" aria-label="Payment" className="mt-3 grid grid-cols-2 gap-2">
        {(["yes", "no"] as const).map((v) => (
          <Choice key={v} on={d.paid === v} onClick={() => set("paid", v)} className="h-[52px] text-[17px]">
            {v === "yes" ? "Yes" : "No"}
          </Choice>
        ))}
      </div>
      {/* the range only matters if they're charging, so it waits for a yes */}
      <AnimatePresence initial={false}>
        {d.paid === "yes" && (
          <motion.div key="yes" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: EASE }} className="overflow-hidden">
            <div className="pt-7 text-[16px] font-semibold text-ink">Please indicate a range</div>
            <div role="radiogroup" aria-label="Payment range" className="mt-3 flex flex-wrap gap-2">
              {RANGES.map((r) => (
                <Choice key={r} on={d.range === r} onClick={() => set("range", r)} className="h-11 px-4 text-[15px]">
                  {r}
                </Choice>
              ))}
            </div>
          </motion.div>
        )}
        {/* a no gets said back to them in full, so it's clear what they're agreeing to */}
        {d.paid === "no" && (
          /* same card and entrance as the "is this you?" account match on the socials step; no height clip, so the shadow stays whole */
          <motion.div
            key="no"
            className="mt-3 flex items-center gap-3 rounded-[22px] border border-line bg-white py-4 pl-5 pr-4 shadow-[0_24px_50px_-22px_rgba(40,30,110,0.45)]"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.4, ease: EASE }}
          >
            <span className="min-w-0 flex-1 text-[16px] font-semibold leading-snug text-ink">No, I&apos;m not looking to receive payment for this collab</span>
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-mint/15 text-[#178a60]">
              <RiCheckLine size={16} aria-hidden="true" />
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Audience({ name, handle, connecting, connected }: { name: string; handle: string; connecting: boolean; connected: boolean }) {
  const items = ["Follower size and engagement", "Audience insights and location", "Your content and performance"];
  return (
    <>
      <Title sub={`Connect Instagram so ${name} can see your account size, audience, and content at a glance.`}>Your audience and content</Title>
      <div className="relative mt-7 overflow-hidden rounded-[22px] border border-line bg-[#fafafc] p-5">
        <div className="text-[13px] font-semibold text-muted">What {name} will see</div>
        <ul className="mt-3.5 space-y-3">
          {items.map((t, i) => (
            <li key={t} className="flex items-center gap-3 text-[15px] text-ink">
              <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full transition-colors duration-300 ${connected ? "bg-mint text-white" : "bg-mint/12 text-[#178a60]"}`} style={{ transitionDelay: connected ? `${i * 120}ms` : "0ms" }}>
                <RiCheckLine size={14} aria-hidden="true" />
              </span>
              {t}
            </li>
          ))}
        </ul>
        <AnimatePresence>
          {(connecting || connected) && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: EASE }} className="mt-4 flex items-center gap-3 border-t border-line pt-4">
              <IgGlyph />
              <div className="min-w-0 flex-1 text-[14.5px] leading-tight">
                <div className="font-semibold text-ink">{connected ? `Connected as @${handle}` : "Connecting to Instagram…"}</div>
              </div>
              {connecting ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-violet/15 border-t-violet motion-reduce:animate-none" aria-hidden="true" />
              ) : (
                <span className="grid h-6 w-6 place-items-center rounded-full bg-mint text-white">
                  <RiCheckLine size={14} aria-hidden="true" />
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <p className="mt-4 flex items-center gap-2 text-[13.5px] text-muted">
        <RiLockLine size={15} className="shrink-0" aria-hidden="true" />
        Your data stays fully private, read-only. Disconnect anytime.
      </p>
    </>
  );
}

function Manual({ name, shots, onAdd }: { name: string; shots: (string | null)[]; onAdd: (i: number, f?: File) => void }) {
  const slots = [
    { title: "Overview", hint: "Insights → Overview. Accounts reached and followers." },
    { title: "Audience", hint: "Insights → Total followers. Top cities, age, gender." },
    { title: "Engagement", hint: "Insights → Accounts engaged. Likes, comments, shares." },
  ];
  return (
    <>
      <Title sub={`Add three screenshots from Instagram Insights. ${name} sees these and nothing else.`}>Your audience and content</Title>
      <ul className="mt-7 space-y-2.5">
        {slots.map((s, i) => {
          const src = shots[i];
          return (
            <li key={s.title} className={`flex items-center gap-3.5 rounded-[20px] border p-3 transition-colors duration-300 ${src ? "border-mint/30 bg-mint/[0.05]" : "border-line bg-white"}`}>
              <span className="relative grid h-14 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-lilac text-[15px] font-bold text-violet">
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src} alt={`${s.title} screenshot`} className="h-full w-full object-cover" />
                ) : (
                  i + 1
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-[15.5px] font-semibold text-ink">
                  {s.title}
                  {src && <RiCheckLine size={16} className="text-mint" aria-hidden="true" />}
                </div>
                <div className="mt-0.5 text-[13px] leading-snug text-muted">{s.hint}</div>
              </div>
              <label className={`inline-flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-4 text-[14px] font-semibold transition-colors ${src ? "text-ink-2 hover:bg-[#f4f3f8]" : "bg-ink text-white hover:bg-black"}`}>
                {!src && <RiImageAddLine size={16} aria-hidden="true" />}
                {src ? "Change" : "Add"}
                <input type="file" accept="image/*" className="sr-only" onChange={(e) => onAdd(i, e.target.files?.[0])} />
              </label>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function Based({ d, set, name }: Bind & { name: string }) {
  const id = useId();
  return (
    <>
      <Title sub={`Where you'd be coming from. A neighborhood is enough for ${name} to see how far it is.`}>Address or neighborhood</Title>
      <label htmlFor={id} className="sr-only">
        Your city or neighborhood
      </label>
      <div className={`${field} mt-7 flex items-center gap-2.5 focus-within:bg-white focus-within:shadow-[inset_0_0_0_2px_#5035e3]`}>
        <RiMapPin2Line size={19} className="shrink-0 text-muted" aria-hidden="true" />
        <input id={id} autoFocus={useContext(AutoFocus)} value={d.based} onChange={(e) => set("based", e.target.value)} placeholder="Your city or neighborhood" autoComplete="address-level2" className="h-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted" />
      </div>
    </>
  );
}

function Contact({ d, set }: Bind) {
  const [touched, setTouched] = useState(false);
  const badEmail = touched && !!d.email.trim() && !EMAIL.test(d.email.trim());
  return (
    <>
      <Title sub="So they know who they're saying yes to. We'll notify you as soon as they answer!">Your name and contact info</Title>
      <div className="mt-7 grid grid-cols-2 gap-2.5">
        <Input label="First name" value={d.first} onChange={(v) => set("first", v)} autoComplete="given-name" autoFocus />
        <Input label="Last name" value={d.last} onChange={(v) => set("last", v)} autoComplete="family-name" />
      </div>
      <Input label="Email" type="email" inputMode="email" value={d.email} onChange={(v) => set("email", v)} onBlur={() => setTouched(true)} autoComplete="email" invalid={badEmail} className="mt-2.5" />
      <AnimatePresence initial={false}>
        {badEmail && (
          <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: EASE }} className="overflow-hidden px-1 text-[13.5px] text-[#c23a56]">
            <span className="block pt-2">That doesn&apos;t look like an email. Check it and try again.</span>
          </motion.p>
        )}
      </AnimatePresence>
      <Input label="Phone" type="tel" inputMode="tel" value={d.phone} onChange={(v) => set("phone", v)} autoComplete="tel" className="mt-2.5" />
    </>
  );
}

function Extra({ d, set }: Bind) {
  return (
    <>
      <Title sub="Timing preferences, restrictions, limitations, anything else.">Anything else you&apos;d like to add?</Title>
      <Area label="" value={d.extra} onChange={(v) => set("extra", v)} placeholder="Optional" autoFocus className="mt-7" />
      <p className="mt-3 px-1 text-[13.5px] text-muted">Optional, but the more you share, the better.</p>
    </>
  );
}

/* one of the business's own questions (Customize): a text box, or a list to pick one or several from */
function Custom({ q, a, onChange }: { q: Question; a: Answer; onChange: (a: Answer) => void }) {
  const otherId = useId();
  const list = q.answers.filter((x) => x.trim());
  const options = q.other ? [...list, OTHER] : list;
  const pick = (v: string) => onChange({ ...a, picks: q.multi ? (a.picks.includes(v) ? a.picks.filter((p) => p !== v) : [...a.picks, v]) : [v] });
  const otherOn = a.picks.includes(OTHER);
  return (
    <>
      <Title sub={q.sub.trim() || undefined}>{q.title.trim() || "Your question"}</Title>
      {q.kind === "text" ? (
        <Area label="" value={a.text} onChange={(text) => onChange({ ...a, text })} placeholder="Type your answer" autoFocus className="mt-7" />
      ) : (
        <>
          <div className="mt-7 text-[14px] font-semibold text-muted">{q.multi ? "Pick all that apply" : "Pick one"}</div>
          <div role={q.multi ? "group" : "radiogroup"} aria-label={q.title} className="mt-3 flex flex-col gap-2">
            {options.map((v, i) => {
              const on = a.picks.includes(v);
              return (
                <button
                  key={`${v}-${i}`}
                  type="button"
                  role={q.multi ? "checkbox" : "radio"}
                  aria-checked={on}
                  onClick={() => pick(v)}
                  className={`flex min-h-[52px] w-full items-center gap-3 rounded-[14px] py-3 pl-4 pr-3.5 text-left text-[17px] font-semibold transition-[background-color,box-shadow,color] duration-200 ${
                    on ? "bg-[#5035e3]/[0.08] text-[#4429d6] shadow-[inset_0_0_0_2px_#5035e3]" : "bg-[#f2f2f7] text-ink active:bg-[#e9e9f0]"
                  }`}
                >
                  <span className="min-w-0 flex-1">{v === OTHER ? "Other" : v}</span>
                  <span
                    aria-hidden="true"
                    className={`grid size-[22px] shrink-0 place-items-center transition-colors duration-200 ${q.multi ? "rounded-[7px]" : "rounded-full"} ${on ? "bg-[#5035e3] text-white" : "bg-white shadow-[inset_0_0_0_1.5px_#d4d4de]"}`}
                  >
                    {on && <RiCheckLine size={15} />}
                  </span>
                </button>
              );
            })}
          </div>
          {/* "Other" opens a field for their own words, right under the list */}
          <AnimatePresence initial={false}>
            {otherOn && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: EASE }} className="overflow-hidden">
                <label htmlFor={otherId} className="sr-only">
                  Your answer
                </label>
                <input id={otherId} value={a.other} onChange={(e) => onChange({ ...a, other: e.target.value })} placeholder="Type your answer" className={`${field} mt-2 placeholder:text-muted`} />
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </>
  );
}

/* the Customize preview's Questions tab before the business has added any */
function NoQuestions() {
  return (
    <div className="flex flex-col items-center px-6 pt-24 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-lilac text-violet">
        <RiListCheck2 size={22} aria-hidden="true" />
      </span>
      <p className="mt-4 text-[16px] leading-relaxed text-ink-2">Add a question and it shows up here, just as creators will see it.</p>
    </div>
  );
}

/*
  The thank-you screen, built to Design Labs 15528:88425: the same photo and name pill as the opener,
  "Amazing!" and what happens next, the business's thank-you DM, a nudge to follow them, and Done.
*/
function Done({ name, handle, thanks, onDone, hint = false }: { name: string; handle: string; thanks: string; onDone: () => void; hint?: boolean }) {
  return (
    <div className="relative flex flex-1 flex-col">
      <Cover height={257} top={1} />
      <PoweredBy />
      <Confetti />

      <Enter i={1} className="relative mt-[69.75px] flex flex-col items-center gap-6 px-[21.38px]">
        <Business name={name} />
        <div className="flex w-full flex-col items-center gap-2 text-center">
          <Headline>Amazing!</Headline>
          <p className="text-[16px] leading-[normal] text-[#717171]">Your collab request is being reviewed by {name}. We&apos;ll text you the second they answer.</p>
        </div>
      </Enter>

      {thanks.trim() && (
        <Enter i={2} className="relative mt-[37.5px]">
          <Bubble>{thanks}</Bubble>
        </Enter>
      )}

      <Enter i={3} className="relative mt-[20.6px] flex flex-col gap-3 px-5">
        <p className="text-[16px] font-semibold leading-[normal] tracking-[-0.5px] text-black">Follow us on Instagram</p>
        <div className="flex items-center justify-between gap-3 rounded-[16px] border-[0.5px] border-[#e3e3e3] bg-[rgba(247,247,247,0.99)] py-3 pl-3 pr-2">
          <span className="min-w-0 truncate text-[14px] font-semibold leading-[normal] text-black">@{handle}</span>
          <a
            href={`https://www.instagram.com/${encodeURIComponent(handle)}`}
            target="_blank"
            rel="noopener"
            className="flex h-8 w-[88px] shrink-0 items-center justify-center rounded-[64px] bg-[#1c1c1c] text-[14px] font-medium leading-[normal] text-white transition-colors hover:bg-black"
          >
            Follow
          </a>
        </div>
      </Enter>

      <div className="sticky bottom-0 z-20 mt-auto px-5 pb-[max(21px,env(safe-area-inset-bottom))] pt-6">
        <CardButton onClick={onDone} hint={hint}>
          Done
        </CardButton>
        <p className="mx-auto mt-[14px] w-[295.208px] max-w-full -translate-x-[0.5px] text-center text-[13px] leading-[17px] text-[#4a4a4a]">
          <span className="font-semibold">Benable</span> is an app that connects over 1 million creators with local businesses and brands.
        </p>
      </div>
    </div>
  );
}

/*
  One burst of confetti from behind the business's photo as the thank-you screen opens:
  paper pops up and out, flutters, then drifts down and fades. Seeded, so every visit throws the same burst.
*/
const CONFETTI_COLORS = ["#6b4ef0", "#9b87ff", "#22b07d", "#ffc94d", "#ff7aa8", "#4cc3ff"];
const CONFETTI = (() => {
  let s = 7;
  const rnd = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  return Array.from({ length: 90 }, (_, i) => {
    const angle = (-165 + rnd() * 150) * (Math.PI / 180);
    const speed = 110 + rnd() * 190;
    const x = Math.cos(angle) * speed;
    return {
      x,
      up: Math.sin(angle) * speed,
      drift: x * 0.35 + (rnd() - 0.5) * 90,
      fall: 520 + rnd() * 260,
      spin: (rnd() - 0.5) * 720,
      flip: 360 * (2 + Math.round(rnd() * 3)),
      w: 5 + rnd() * 4,
      h: 8 + rnd() * 6,
      round: rnd() < 0.3,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      duration: 2.6 + rnd() * 1.4,
      delay: 0.25 + rnd() * 0.2,
    };
  });
})();

function Confetti() {
  if (useReducedMotion()) return null;
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      {CONFETTI.map((p, i) => (
        <motion.span
          key={i}
          className="absolute left-1/2 top-[190px]"
          style={{ width: p.w, height: p.round ? p.w : p.h, marginLeft: -p.w / 2, background: p.color, borderRadius: p.round ? "50%" : 1.5 }}
          initial={{ x: 0, y: 0, rotate: 0, rotateY: 0, opacity: 0 }}
          animate={{ x: [0, p.x, p.x + p.drift], y: [0, p.up, p.fall], rotate: p.spin, rotateY: p.flip, opacity: [0, 1, 1, 0] }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            x: { duration: p.duration, delay: p.delay, times: [0, 0.22, 1], ease: ["easeOut", "linear"] },
            y: { duration: p.duration, delay: p.delay, times: [0, 0.22, 1], ease: ["easeOut", "easeIn"] },
            opacity: { duration: p.duration, delay: p.delay, times: [0, 0.04, 0.75, 1] },
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}

/* ---------- pieces ---------- */

type Bind = { d: Draft; set: <K extends keyof Draft>(k: K, v: Draft[K]) => void };

// iOS-style filled fields: soft grey at rest, white with a violet ring while typing; 17px so Safari never zooms
const field = "h-[52px] w-full rounded-[14px] bg-[#f2f2f7] px-4 text-[17px] text-ink outline-none transition-[background-color,box-shadow] duration-200 focus:bg-white focus:shadow-[inset_0_0_0_2px_#5035e3]";

function Enter({ i, children, className = "" }: { i: number; children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE, delay: 0.1 + i * 0.08 }}>
      {children}
    </motion.div>
  );
}

function Title({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <>
      <h1 className="flow-title !text-[28px]">{children}</h1>
      {sub && <p className="mt-2.5 text-[16px] leading-relaxed text-ink-2">{sub}</p>}
    </>
  );
}

function Input({
  label,
  value,
  onChange,
  invalid = false,
  className = "",
  ...rest
}: { label: string; value: string; onChange: (v: string) => void; invalid?: boolean; className?: string } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "className">) {
  const id = useId();
  const focus = useContext(AutoFocus);
  // the label sits in the field like a placeholder, then floats up once there's text or focus
  return (
    <div className={`relative ${className}`}>
      <input
        id={id}
        placeholder=" "
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={invalid || undefined}
        className={`${field} peer h-[58px] pb-1.5 pt-5 ${invalid ? "!shadow-[inset_0_0_0_2px_#e5536f]" : ""}`}
        {...rest}
        autoFocus={focus && rest.autoFocus}
      />
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[17px] text-muted transition-all duration-200 peer-focus:top-[17px] peer-focus:text-[12.5px] peer-[:not(:placeholder-shown)]:top-[17px] peer-[:not(:placeholder-shown)]:text-[12.5px]"
      >
        {label}
      </label>
    </div>
  );
}

function Area({ label, hint, value, onChange, placeholder, autoFocus, className = "" }: { label: string; hint?: string; value: string; onChange: (v: string) => void; placeholder?: string; autoFocus?: boolean; className?: string }) {
  const id = useId();
  const focus = useContext(AutoFocus);
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="block text-[16px] font-semibold text-ink">
          {label}
        </label>
      )}
      {hint && <p className="mt-1 text-[14px] leading-snug text-muted">{hint}</p>}
      <textarea
        id={id}
        aria-label={label || placeholder}
        autoFocus={focus && autoFocus}
        rows={4}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${field} ${label ? "mt-3" : ""} h-auto min-h-[128px] resize-none py-3.5 leading-snug placeholder:text-muted`}
      />
    </div>
  );
}

function Choice({ on, onClick, children, className = "" }: { on: boolean; onClick: () => void; children: ReactNode; className?: string }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-[14px] font-semibold transition-[background-color,box-shadow,color] duration-200 ${
        on ? "bg-[#5035e3]/[0.08] text-[#4429d6] shadow-[inset_0_0_0_2px_#5035e3]" : "bg-[#f2f2f7] text-ink active:bg-[#e9e9f0]"
      } ${className}`}
    >
      {on && <RiCheckLine size={17} aria-hidden="true" />}
      {children}
    </button>
  );
}

function TopBar({ step, onBack, saved, handle }: { step: [number, number, number]; onBack: () => void; saved: boolean; handle: string }) {
  const [group, at, of] = step;
  // a native-feeling nav bar: back on the left, where they are in the middle, the business on the right
  return (
    <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-xl sm:rounded-t-[32px]">
      <div className="relative flex h-[52px] items-center px-1.5">
        <button type="button" onClick={onBack} aria-label="Back" className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-ink transition-colors active:bg-[#f2f2f7]">
          <RiArrowLeftSLine size={30} aria-hidden="true" />
        </button>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center leading-tight" aria-label={`Step ${group + 1} of ${GROUPS.length}: ${GROUPS[group]}`}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={group} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2, ease: EASE }}>
              <div className="text-[16px] font-semibold tracking-[-0.01em] text-ink">{GROUPS[group]}</div>
              <div className="text-[12px] font-medium text-muted">
                Step {group + 1} of {GROUPS.length}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="ml-auto flex items-center gap-1.5 pr-2.5">
          <span aria-live="polite" className={`text-[12.5px] font-medium text-muted transition-opacity duration-300 ${saved ? "opacity-100" : "opacity-0"}`}>
            {saved ? "Saved" : ""}
          </span>
          <Avatar handle={handle} size={30} />
        </div>
      </div>
      <div className="flex gap-1 px-4 pb-2.5" aria-hidden="true">
        {GROUPS.map((g, i) => (
          <span key={g} className="h-[4px] flex-1 overflow-hidden rounded-full bg-[#ececf2]">
            <motion.span className="block h-full rounded-full bg-[#5035e3]" initial={false} animate={{ width: i < group ? "100%" : i === group ? `${(at / of) * 100}%` : "0%" }} transition={{ duration: 0.5, ease: EASE }} />
          </span>
        ))}
      </div>
    </div>
  );
}

function Footer({ children }: { children: ReactNode }) {
  return <div className="sticky bottom-0 z-20 mt-auto bg-gradient-to-t from-white from-70% to-white/0 px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-6 sm:rounded-b-[32px]">{children}</div>;
}

function Primary({ children, busy = false, hint = false, className = "", ...rest }: { children: ReactNode; busy?: boolean; hint?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={`relative flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[#5035e3] text-[17px] font-semibold text-white transition-[background-color,transform] duration-200 hover:bg-[#4429d6] active:scale-[0.985] disabled:cursor-not-allowed disabled:bg-[#5035e3]/20 disabled:active:scale-100 ${busy ? "cursor-wait" : ""} ${className}`}
    >
      {busy && <span className="h-[18px] w-[18px] animate-spin rounded-full border-2 border-white/30 border-t-white motion-reduce:animate-none" aria-hidden="true" />}
      {children}
      {hint && <TapHint />}
    </button>
  );
}

/* the preview's "tap here": a fingertip press with a ring rippling out, like a screen recording's touch */
function TapHint() {
  return (
    <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 z-10 size-0">
      <motion.span
        className="absolute -left-6 -top-6 size-12 rounded-full border-2 border-white/80"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: [0.5, 1.5], opacity: [0.9, 0] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut", delay: 0.2 }}
      />
      <motion.span
        className="absolute -left-[13px] -top-[13px] size-[26px] rounded-full bg-white/45 shadow-[0_2px_8px_rgba(0,0,0,0.25)]"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [1, 0.82, 1], opacity: 1 }}
        transition={{ scale: { duration: 1.4, repeat: Infinity, ease: "easeInOut" }, opacity: { duration: 0.3 } }}
      />
    </span>
  );
}

/* the official Instagram app icon (Figma: Design Labs 15529:88516) */
function IgGlyph() {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/img/instagram.svg" alt="" width={28} height={28} className="block" />;
}

/* "Heads up": nudges anyone skipping Instagram, without blocking them */
function HeadsUp({ onConnect, onManual, onClose }: { onConnect: () => void; onManual: () => void; onClose: () => void }) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [onClose]);
  return (
    <motion.div className="fixed inset-0 z-50 flex items-end justify-center sm:absolute sm:rounded-[32px]" initial="hidden" animate="shown" exit="hidden">
      <motion.div aria-hidden="true" className="absolute inset-0 bg-[#161a35]/30 sm:rounded-[32px]" variants={{ hidden: { opacity: 0 }, shown: { opacity: 1 } }} transition={{ duration: 0.3 }} onClick={onClose} />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="headsup-title"
        className="relative w-full max-w-[460px] rounded-t-[28px] bg-white px-6 pb-[max(20px,env(safe-area-inset-bottom))] pt-3 sm:rounded-b-[32px]"
        variants={{ hidden: { y: "100%" }, shown: { y: 0 } }}
        transition={{ duration: 0.45, ease: EASE }}
      >
        <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-line" />
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#fff4e0] text-[22px] font-bold text-[#c27a00]" aria-hidden="true">
          !
        </span>
        <h2 id="headsup-title" className="mt-4 text-[24px] text-ink">
          Heads up
        </h2>
        <p className="mt-2 text-[16px] leading-relaxed text-ink-2">Creators who connect their Instagram are 5 times more likely to get a collab.</p>
        <div className="mt-6">
          <Primary type="button" onClick={onConnect} autoFocus>
            <RiInstagramLine size={19} aria-hidden="true" /> Connect Instagram
          </Primary>
          <button type="button" onClick={onManual} className="mt-1 h-11 w-full rounded-full text-[15px] font-semibold text-ink-2 transition-colors hover:bg-[#f4f3f8]">
            Enter data manually
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
