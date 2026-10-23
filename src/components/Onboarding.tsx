"use client";

import { RiArrowLeftLine, RiArrowRightUpLine, RiCheckLine, RiFileCopyLine, RiLockLine, RiMailLine, RiEqualizerLine } from "@remixicon/react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useId, useRef, useState, useSyncExternalStore, type FormEvent, type ReactNode } from "react";
import { Avatar } from "./HandleForm";
import { cleanHandle, displayName } from "./handle";
import Logo, { BrandIcon } from "./Logo";

const EASE = [0.22, 1, 0.36, 1] as const;

const STEPS = (handle: string) => [`Reading @${handle}`, "Working out what a good fit looks like", "Getting your Concierge ready"];
const STEP_MS = 1300;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* the handle from ?handle=, read on the client so the page itself stays static */
function useHandle() {
  const raw = useSyncExternalStore(
    () => () => {},
    () => new URLSearchParams(window.location.search).get("handle") ?? "",
    () => "",
  );
  return cleanHandle(raw) || "foundcoffee";
}

/*
  What happens after "Yes, that's me": we set the Concierge up in front of them, ask where
  reviewed requests should go, then hand over the link and the reply to paste into DMs.
*/
export default function Onboarding() {
  const handle = useHandle();
  const name = displayName(handle);
  const [live, setLive] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const say = (msg: string) => {
    clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  };
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  return (
    <div className="relative min-h-svh overflow-hidden bg-bg">
      <div className="pointer-events-none absolute left-1/2 top-[-260px] h-[620px] w-[1100px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(143,108,247,0.22),rgba(242,134,154,0.08)_60%,transparent)] blur-2xl" />
      <div className="dot-grid pointer-events-none absolute inset-x-0 top-0 h-[520px] [mask-image:linear-gradient(to_bottom,#000,transparent)]" />

      {/* same floating glass bar as the landing page nav once it's scrolled */}
      <header className="fixed inset-x-0 top-3 z-50 flex justify-center px-2 sm:top-4">
        <nav
          aria-label="Main"
          className="flex h-[58px] w-full max-w-[860px] items-center justify-between rounded-[18px] border border-[#e5e7eb]/70 bg-white/70 pl-4 pr-2 text-ink shadow-[0_20px_32px_-12px_rgba(50,38,98,0.22)] backdrop-blur-xl"
        >
          <div className="flex items-center gap-2">
            {!live && (
              <Link href="/" aria-label="Back to the home page" className="-ml-1 grid h-9 w-9 place-items-center rounded-full text-ink-2 transition-colors hover:bg-lilac hover:text-ink">
                <RiArrowLeftLine size={18} aria-hidden="true" />
              </Link>
            )}
            <Link href="/" aria-label="Benable Collab Concierge home" className="flex items-center gap-3">
              {/* phones get the icon alone so the live header has room */}
              <BrandIcon size={30} className="sm:hidden" />
              <span className="hidden sm:block">
                <Logo />
              </span>
              <span className="hidden h-4 w-px bg-ink/15 sm:block" />
              <span className="hidden text-[14px] font-semibold sm:block">Collab Concierge</span>
            </Link>
          </div>
          <AnimatePresence>
            {live && (
              <motion.div className="flex items-center gap-4 pr-1 sm:gap-6" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}>
                <Tabs onDashboard={() => say("Your dashboard is next on the build list.")} />
                <Avatar handle={handle} size={36} />
              </motion.div>
            )}
          </AnimatePresence>
        </nav>
      </header>

      <main className="relative mx-auto w-full max-w-[600px] px-5 pb-24 pt-[112px] sm:pt-[136px]">
        <AnimatePresence mode="wait">
          {live ? (
            <Live key="live" handle={handle} name={name} say={say} />
          ) : (
            <Setup key="setup" handle={handle} name={name} onLive={() => setLive(true)} />
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {toast && (
          <motion.div
            role="status"
            className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-5"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.3, ease: EASE }}
          >
            <span className="rounded-full bg-ink px-4 py-2.5 text-[14px] font-medium text-white shadow-[0_18px_40px_-16px_rgba(22,26,53,0.7)]">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- step 1: setting it up, then where to send reviewed requests ---------- */

function Setup({ handle, name, onLive }: { handle: string; name: string; onLive: () => void }) {
  const steps = STEPS(handle);
  const [done, setDone] = useState(0); // how many steps have finished
  const [email, setEmail] = useState("");
  const [activating, setActivating] = useState(false);
  const id = useId();
  const ready = done >= steps.length;
  const valid = EMAIL.test(email.trim());
  const canActivate = ready && valid; // they can type while we set up; activation waits for it

  useEffect(() => {
    const t = [1, 2, 3].map((n) => setTimeout(() => setDone(n), STEP_MS * n));
    return () => t.forEach(clearTimeout);
  }, []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!canActivate || activating) return;
    setActivating(true);
    setTimeout(onLive, 1400);
  };

  return (
    <motion.section exit={{ opacity: 0, y: -12, filter: "blur(6px)" }} transition={{ duration: 0.45, ease: EASE }}>
      <Rise i={0}>
        <h1 className="moment-title">
          {name}, meet your <span className="grad-text">Concierge.</span>
        </h1>
      </Rise>
      <Rise i={1}>
        <p className="moment-sub mt-4 h-[28px]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={ready ? "ready" : "working"} className="inline-block" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3 }}>
              {ready ? "Ready. One thing before it goes live." : "Setting it up for you now."}
            </motion.span>
          </AnimatePresence>
        </p>
      </Rise>

      <Rise i={2} className="mt-10">
        <Card>
          <Profile handle={handle} name={name} />
          <ul className="mt-5 space-y-3.5 border-t border-line pt-5">
            {steps.map((s, i) => {
              const state = i < done ? "done" : i === done ? "working" : "waiting";
              return (
                <li key={s} className={`flex items-center gap-3 text-[15px] transition-colors duration-300 ${state === "waiting" ? "text-muted" : "text-ink"}`}>
                  <StepIcon state={state} />
                  {s}
                </li>
              );
            })}
          </ul>

          {/* the link, locked until they activate it */}
          <motion.div
            initial={false}
            animate={ready ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="mt-5 flex items-center gap-3 rounded-2xl bg-[#f3f2f9] p-3.5">
              <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-violet">
                <RiLockLine size={17} aria-hidden="true" />
              </span>
              <div className="min-w-0 leading-tight">
                <div className="text-[14.5px] font-semibold text-ink">Your Concierge link is ready</div>
                <div className="mt-0.5 truncate text-[13.5px] text-muted">benable.com/c/{handle} · activate it below to share</div>
              </div>
            </div>
          </motion.div>
        </Card>
      </Rise>

      <Rise i={3} className="mt-8">
        <form onSubmit={submit}>
          <label htmlFor={id} className="block text-[15px] font-semibold text-ink">
            Where should we send reviewed collab requests?
          </label>
          <div className="mt-3 flex h-[58px] items-center gap-2 overflow-hidden rounded-full bg-white pl-5 pr-5 shadow-[0_18px_40px_-26px_rgba(40,30,110,0.45),inset_0_0_0_1px_rgba(22,26,53,0.09)] outline-2 outline-transparent transition-[outline-color] duration-200 focus-within:outline-[#8f7cf7]">
            <RiMailLine size={18} className="shrink-0 text-muted" aria-hidden="true" />
            <input
              id={id}
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@yourbusiness.com"
              className="h-full min-w-0 flex-1 bg-transparent text-[16px] text-ink outline-none placeholder:text-muted"
            />
          </div>
          <button
            type="submit"
            disabled={!canActivate || activating}
            className={`mt-3 flex h-[56px] w-full items-center justify-center gap-2 rounded-full text-[16px] font-semibold text-white transition-colors duration-300 ${
              canActivate ? "bg-[#5035e3] hover:bg-[#4429d6]" : "cursor-not-allowed bg-[#5035e3]/20"
            }`}
          >
            {activating ? (
              <>
                <span className="h-[18px] w-[18px] animate-spin rounded-full border-2 border-white/30 border-t-white motion-reduce:animate-none" aria-hidden="true" />
                Activating…
              </>
            ) : (
              "Activate my Concierge link"
            )}
          </button>
          <p className="mt-3 text-center text-[13.5px] text-muted">Free. You can change this anytime.</p>
        </form>
      </Rise>
    </motion.section>
  );
}

/* ---------- step 2: live, with the link and the reply to paste ---------- */

function Live({ handle, name, say }: { handle: string; name: string; say: (m: string) => void }) {
  const link = `benable.com/c/${handle}`;
  const reply = `Thanks for reaching out! We handle collab requests here: ${link}. Takes a couple minutes and we'll get back to you.`;

  return (
    <motion.section>
      <Rise i={0} className="flex justify-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-mint/12 px-3 py-1 text-[13px] font-semibold text-[#178a60]">
          <span className="relative flex h-2 w-2">
            <span className="absolute inset-0 animate-ping rounded-full bg-mint/60 motion-reduce:animate-none" />
            <span className="relative h-2 w-2 rounded-full bg-mint" />
          </span>
          Live
        </span>
      </Rise>
      <Rise i={1}>
        <h1 className="moment-title mt-4">
          Your Concierge is <span className="grad-text">live.</span>
        </h1>
      </Rise>
      <Rise i={2}>
        <p className="moment-sub mt-4">Reply to any collab DM with your link. We take it from there.</p>
      </Rise>

      <Rise i={3} className="mt-10">
        <Card>
          <Profile handle={handle} name={name} />

          <div className="mt-5 border-t border-line pt-5">
            <div className="text-[13px] font-medium text-muted">Your link</div>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <span className="min-w-0 flex-1 break-all text-[20px] font-bold tracking-[-0.02em] text-ink sm:text-[22px]">{link}</span>
              <CopyButton text={link} label="Copy link" dark />
            </div>
            <button type="button" onClick={() => say("Creator preview is next on the build list.")} className="mt-3 inline-flex items-center gap-1 text-[14px] font-semibold text-violet hover:underline">
              Test your link, see what creators see <RiArrowRightUpLine size={15} aria-hidden="true" />
            </button>
          </div>

          <div className="mt-5 border-t border-line pt-5">
            <p className="text-[14.5px] text-ink-2">When a creator DMs you, reply with this. Your link handles the rest.</p>
            {/* a little DM thread, so it's obvious where the reply goes */}
            <div className="mt-4 rounded-[22px] bg-[#f3f2f9] p-4">
              <div className="flex items-end gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/img/ig/ana.jpg" alt="" className="h-7 w-7 rounded-full object-cover" />
                <span className="rounded-[18px] rounded-bl-[6px] bg-white px-3.5 py-2 text-[14px] text-ink shadow-[0_1px_0_rgba(22,26,53,0.04)]">hii! would love to collab 💜</span>
              </div>
              <div className="mt-3 flex justify-end">
                <div className="max-w-[88%] rounded-[18px] rounded-br-[6px] bg-[linear-gradient(135deg,#7b4dff,#5035e3)] px-4 py-3 text-[14.5px] leading-snug text-white shadow-[0_14px_28px_-16px_rgba(80,53,227,0.9)]">
                  {reply}
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <CopyButton text={reply} label="Copy reply" />
              </div>
            </div>
          </div>
        </Card>
      </Rise>

      <Rise i={4} className="mt-4">
        <Card className="flex items-center gap-4 !p-5">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-lilac text-violet">
            <RiEqualizerLine size={20} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1 leading-snug">
            <div className="text-[15.5px] font-semibold text-ink">Make it yours</div>
            <div className="mt-0.5 text-[13.5px] text-muted">The questions creators answer, your dealbreakers, the collabs you want.</div>
          </div>
          <button type="button" onClick={() => say("Customize is next on the build list.")} className="shrink-0 rounded-full bg-[#5035e3] px-4 py-2.5 text-[14px] font-semibold text-white shadow-[0_10px_20px_-10px_rgba(80,53,227,0.8)] transition-transform hover:-translate-y-px">
            Customize
          </button>
        </Card>
      </Rise>
    </motion.section>
  );
}

/* ---------- pieces ---------- */

/* text tabs with a sliding underline: Share is this page; the dashboard isn't built yet */
function Tabs({ onDashboard }: { onDashboard: () => void }) {
  const tabs = [
    { id: "share", label: "Share" },
    { id: "dashboard", label: "Dashboard" },
  ];
  const active = "share";
  return (
    <div role="tablist" aria-label="Concierge" className="flex items-center gap-5">
      {tabs.map((t) => {
        const on = t.id === active;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={on}
            type="button"
            onClick={on ? undefined : onDashboard}
            className={`relative py-2 text-[14px] transition-colors ${on ? "font-semibold text-ink" : "font-medium text-muted hover:text-ink"}`}
          >
            {t.label}
            <span className={`absolute inset-x-0 -bottom-0.5 h-[2px] rounded-full bg-ink transition-transform duration-300 ${on ? "scale-x-100" : "scale-x-0"}`} />
          </button>
        );
      })}
    </div>
  );
}

function Rise({ i, children, className = "" }: { i: number; children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y: 16, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.7, ease: EASE, delay: 0.08 + i * 0.08 }}>
      {children}
    </motion.div>
  );
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-[28px] border border-line bg-white p-6 shadow-[0_30px_60px_-36px_rgba(40,30,110,0.4)] ${className}`}>{children}</div>;
}

function Profile({ handle, name }: { handle: string; name: string }) {
  return (
    <div className="flex items-center gap-4">
      <Avatar handle={handle} size={56} />
      <div className="min-w-0 leading-tight">
        <div className="truncate text-[19px] font-bold tracking-[-0.02em] text-ink">{name}</div>
        <div className="mt-1 truncate text-[14px] text-muted">@{handle} · Instagram</div>
      </div>
    </div>
  );
}

function StepIcon({ state }: { state: "done" | "working" | "waiting" }) {
  return (
    <span className="relative h-5 w-5 shrink-0">
      <span className={`absolute inset-0 grid place-items-center rounded-full bg-mint text-white transition-[opacity,transform] duration-300 ${state === "done" ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}>
        <RiCheckLine size={13} aria-hidden="true" />
      </span>
      <span
        className={`absolute inset-0.5 rounded-full border-2 transition-opacity duration-300 ${
          state === "working" ? "animate-spin border-violet/15 border-t-violet opacity-100 motion-reduce:animate-none" : state === "waiting" ? "border-line opacity-100" : "opacity-0"
        }`}
        aria-hidden="true"
      />
    </span>
  );
}

function copy(text: string, then: () => void) {
  navigator.clipboard?.writeText(text).then(then, then);
}

function CopyButton({ text, label, dark = false }: { text: string; label: string; dark?: boolean }) {
  const [copied, setCopied] = useState(false);
  const t = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(t.current), []);
  const click = () =>
    copy(text, () => {
      setCopied(true);
      clearTimeout(t.current);
      t.current = setTimeout(() => setCopied(false), 1800);
    });
  return (
    <button
      type="button"
      onClick={click}
      className={`inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-[14px] font-semibold transition-colors ${
        dark ? "btn btn-dark !py-0" : "bg-white text-ink shadow-[0_6px_16px_-10px_rgba(40,30,110,0.5),inset_0_0_0_1px_rgba(22,26,53,0.08)] hover:bg-lilac"
      }`}
    >
      {copied ? <RiCheckLine size={16} aria-hidden="true" /> : <RiFileCopyLine size={16} aria-hidden="true" />}
      {copied ? "Copied" : label}
    </button>
  );
}
