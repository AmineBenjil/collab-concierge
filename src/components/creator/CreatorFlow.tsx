"use client";

import {
  RiArrowDownSLine,
  RiArrowLeftSLine,
  RiCheckLine,
  RiEyeLine,
  RiImageAddLine,
  RiInstagramLine,
  RiLockLine,
  RiMapPin2Line,
} from "@remixicon/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useSyncExternalStore, type FormEvent, type ReactNode } from "react";
import { Avatar } from "../HandleForm";
import Logo from "../Logo";
import { cleanHandle, displayName } from "../names";
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
const AREAS: Record<string, string> = { bellacures: "Studio City" };
const COVER = ["/img/ig/cafe.jpg", "/img/ig/nata.jpg", "/img/ig/roasters.jpg"];

type Step = "opener" | "socials" | "collab" | "payment" | "audience" | "manual" | "based" | "contact" | "extra" | "done";
const GROUPS = ["Socials", "Collab", "Audience", "Details"];
const PLACE: Partial<Record<Step, [group: number, at: number, of: number]>> = {
  socials: [0, 1, 1],
  collab: [1, 1, 2],
  payment: [1, 2, 2],
  audience: [2, 1, 2],
  manual: [2, 2, 2],
  based: [3, 1, 3],
  contact: [3, 2, 3],
  extra: [3, 3, 3],
};

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
};
const EMPTY: Draft = { handle: "", create: "", want: "", paid: "", range: "", insights: "", based: "", first: "", last: "", email: "", phone: "", extra: "" };

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
/* "preview": the business testing its link. "embed": the same flow inside PreviewDevice's phone. */
function useMode() {
  return useSyncExternalStore(
    noop,
    () => {
      const q = new URLSearchParams(window.location.search);
      return q.get("embed") === "1" ? "embed" : q.get("preview") === "1" ? "preview" : null;
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
  const area = AREAS[handle] ?? "Los Angeles";
  const place = area === "Los Angeles" ? area : `${area}, LA`;
  const mode = useMode();
  const wide = useWide();
  const preview = mode === "preview";
  const router = useRouter();
  const reduce = useReducedMotion();

  const [current, setStep] = useState<Step>("opener");
  /* ?step=done (the control panel's "Creator done screen" shortcut) opens on the end screen, until they move on */
  const skipToDone = useSyncExternalStore(noop, () => new URLSearchParams(window.location.search).get("step") === "done", () => false);
  const [moved, setMoved] = useState(false);
  const step: Step = skipToDone && !moved ? "done" : current;
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

  /* save the draft as they type; a quiet "Saved" says it worked */
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => {
    const next = { ...d, [k]: v };
    setD(next);
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

  const go = (to: Step, direction: 1 | -1 = 1) => {
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
    contact: "extra",
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
    extra: "contact",
  };

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
    if (!valid[step]) return;
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
    go(NEXT[step]);
  };

  const at = PLACE[step];

  // on a laptop, the preview is the real flow inside a phone, so it reads the way creators see it
  if (preview && wide) return <PreviewDevice handle={handle} draftKey={draftKey(handle)} />;

  return (
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
          <Opener name={name} handle={handle} place={place} />
        ) : step === "done" ? (
          <Done name={name} handle={handle} />
        ) : (
          <>
            <TopBar step={at!} onBack={() => go(BACK[step]!, -1)} saved={saved} handle={handle} />
            <form id="flow" onSubmit={submit} className="flex-1 px-6 pb-6 pt-7">
              <AnimatePresence mode="wait" custom={dir} initial={false}>
                <motion.div
                  key={step}
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
                  {step === "socials" && <Socials d={d} set={set} />}
                  {step === "collab" && <Collab d={d} set={set} />}
                  {step === "payment" && <Payment d={d} set={set} />}
                  {step === "audience" && <Audience name={name} handle={cleanHandle(d.handle)} connecting={connecting} connected={d.insights === "connected"} />}
                  {step === "manual" && <Manual name={name} shots={shots} onAdd={addShot} />}
                  {step === "based" && <Based d={d} set={set} name={name} area={area} />}
                  {step === "contact" && <Contact d={d} set={set} />}
                  {step === "extra" && <Extra d={d} set={set} />}
                </motion.div>
              </AnimatePresence>
            </form>
          </>
        )}

        <Footer>
          {step === "audience" && d.insights !== "connected" ? (
            <>
              <Primary type="button" onClick={connect} busy={connecting}>
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
          ) : step === "opener" ? (
            <>
              <Primary type="button" onClick={() => go("socials")}>
                Let&apos;s go
              </Primary>
              <p className="mt-2.5 text-center text-[13px] text-muted">About 2 minutes</p>
            </>
          ) : step === "done" ? (
            <Primary type="button" onClick={() => submit()}>
              Done
            </Primary>
          ) : (
            <Primary type="submit" form="flow" disabled={!valid[step]}>
              {step === "extra" ? "Send my request" : "Next"}
            </Primary>
          )}
        </Footer>

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
  );
}

/* ---------- screens ---------- */

function Opener({ name, handle, place }: { name: string; handle: string; place: string }) {
  return (
    <div className="flex-1">
      {/* a strip of their posts, so a creator knows where they're headed */}
      <div className="grid grid-cols-3 gap-1 overflow-hidden px-3 pt-3 sm:rounded-t-[32px]">
        {COVER.map((src, i) => (
          <motion.div
            key={src}
            className={`aspect-[4/5] overflow-hidden bg-[#eceaf3] ${i === 0 ? "rounded-l-[22px]" : i === 2 ? "rounded-r-[22px]" : ""}`}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: EASE, delay: i * 0.08 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="h-full w-full object-cover" />
          </motion.div>
        ))}
      </div>
      <div className="px-6">
        <div className="-mt-10 inline-block rounded-full bg-white p-1">
          <Avatar handle={handle} size={80} />
        </div>
        <Enter i={1}>
          <div className="mt-2 text-[22px] font-bold tracking-[-0.02em] text-ink">{name}</div>
          <div className="mt-0.5 flex items-center gap-1 text-[14px] text-muted">
            <RiMapPin2Line size={15} aria-hidden="true" />
            {place}
          </div>
        </Enter>
        <Enter i={2}>
          <h1 className="flow-title mt-8">Request a collab</h1>
        </Enter>
        <Enter i={3}>
          <Message name={name} handle={handle} text="So glad you reached out! Tell us about yourself and what you have in mind. We'll get back to you soon! 💜" />
        </Enter>
        <Enter i={4}>
          <Brand />
        </Enter>
      </div>
    </div>
  );
}

function Socials({ d, set }: Bind) {
  const id = useId();
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
        <input id={id} autoFocus autoCapitalize="none" autoCorrect="off" spellCheck={false} value={d.handle} onChange={(e) => set("handle", e.target.value)} placeholder="Your handle" className="h-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted" />
      </div>
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
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: EASE }} className="overflow-hidden">
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

function Based({ d, set, name, area }: Bind & { name: string; area: string }) {
  const id = useId();
  return (
    <>
      <Title sub={`${name} is in ${area}. It helps to know how far you'd be coming.`}>Where are you based?</Title>
      <label htmlFor={id} className="sr-only">
        Your city or neighborhood
      </label>
      <div className={`${field} mt-7 flex items-center gap-2.5 focus-within:bg-white focus-within:shadow-[inset_0_0_0_2px_#5035e3]`}>
        <RiMapPin2Line size={19} className="shrink-0 text-muted" aria-hidden="true" />
        <input id={id} autoFocus value={d.based} onChange={(e) => set("based", e.target.value)} placeholder="Your city or neighborhood" autoComplete="address-level2" className="h-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted" />
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

function Done({ name, handle }: { name: string; handle: string }) {
  return (
    <div className="flex flex-1 flex-col items-center px-6 pt-16 text-center">
      <motion.div className="relative" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, ease: EASE }}>
        <Avatar handle={handle} size={92} />
        <motion.span
          className="absolute -bottom-1 -right-1 grid h-9 w-9 place-items-center rounded-full border-[3px] border-white bg-mint text-white"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.45, ease: EASE, delay: 0.35 }}
        >
          <RiCheckLine size={18} aria-hidden="true" />
        </motion.span>
      </motion.div>
      <Enter i={2}>
        <h1 className="flow-title mt-7">Amazing!</h1>
        <p className="mx-auto mt-3 max-w-[320px] text-[16px] leading-relaxed text-ink-2">
          Your collab request is being reviewed by {name}. We&apos;ll text you the second they answer.
        </p>
      </Enter>
      <Enter i={3} className="w-full text-left">
        <Message name={name} handle={handle} text="Thank you so much! We can’t wait to review and get back to you! 🙌" />
      </Enter>
      <Enter i={4} className="w-full">
        <Brand note />
      </Enter>
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
        autoFocus={autoFocus}
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

function Message({ name, handle, text }: { name: string; handle: string; text: string }) {
  return (
    <div className="mt-5">
      <div className="text-[13px] font-semibold text-muted">Message from {name}</div>
      <div className="mt-2.5 flex items-end gap-2">
        <Avatar handle={handle} size={28} />
        <p className="rounded-[20px] rounded-bl-[6px] bg-[#f1f0f6] px-4 py-3 text-[16px] leading-relaxed text-ink">{text}</p>
      </div>
    </div>
  );
}

function Brand({ note = false }: { note?: boolean }) {
  return (
    <div className="mt-10 flex flex-col items-center pb-2 text-center">
      <div className="text-[13px] font-semibold text-ink-2">Collab Concierge</div>
      <div className="mt-1.5 flex items-center gap-1.5 text-[12.5px] text-muted">
        Powered by <Logo height={17} />
      </div>
      {note && <p className="mt-3 max-w-[280px] text-[12.5px] leading-relaxed text-muted">Benable is an app that connects over 1 million creators with local businesses and brands.</p>}
    </div>
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

function Primary({ children, busy = false, className = "", ...rest }: { children: ReactNode; busy?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={`flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[#5035e3] text-[17px] font-semibold text-white transition-[background-color,transform] duration-200 hover:bg-[#4429d6] active:scale-[0.985] disabled:cursor-not-allowed disabled:bg-[#5035e3]/20 disabled:active:scale-100 ${busy ? "cursor-wait" : ""} ${className}`}
    >
      {busy && <span className="h-[18px] w-[18px] animate-spin rounded-full border-2 border-white/30 border-t-white motion-reduce:animate-none" aria-hidden="true" />}
      {children}
    </button>
  );
}

function IgGlyph() {
  return (
    <span className="grid h-7 w-7 place-items-center rounded-[9px] text-white" style={{ background: "radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285aeb 90%)" }}>
      <RiInstagramLine size={16} aria-hidden="true" />
    </span>
  );
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
