"use client";

import { RiLockLine, RiMailLine } from "@remixicon/react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { displayName } from "../names";
import { rememberEmail, useHandle } from "./store";
import { Card, EASE, Profile, Rise, StepIcon } from "./ui";

const STEPS = (handle: string) => [`Reading @${handle}`, "Working out what a good fit looks like", "Getting your Concierge ready"];
const STEP_MS = 1300;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/*
  What happens after "Yes, that's me": we set the Concierge up in front of them and ask
  where reviewed requests should go. Activating leaves upward, then the Share page rises in.
*/
export default function Setup() {
  const handle = useHandle();
  const name = displayName(handle);
  const router = useRouter();
  const steps = STEPS(handle);
  const [done, setDone] = useState(0); // how many steps have finished
  const [email, setEmail] = useState("");
  const [activating, setActivating] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const id = useId();
  const ready = done >= steps.length;
  const valid = EMAIL.test(email.trim());
  const canActivate = ready && valid; // they can type while we set up; activation waits for it
  const next = `/share?handle=${encodeURIComponent(handle)}`;

  useEffect(() => {
    const t = [1, 2, 3].map((n) => setTimeout(() => setDone(n), STEP_MS * n));
    const pending = timers.current;
    return () => [...t, ...pending].forEach(clearTimeout);
  }, []);

  useEffect(() => {
    router.prefetch(next);
  }, [router, next]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!canActivate || activating) return;
    setActivating(true);
    rememberEmail(email.trim());
    timers.current.push(
      setTimeout(() => setLeaving(true), 1400),
      setTimeout(() => router.push(next), 1400 + 450),
    );
  };

  return (
    <main className="relative mx-auto w-full max-w-[600px] px-5 pb-24 pt-[112px] sm:pt-[136px]">
      <motion.section animate={leaving ? { opacity: 0, y: -12, filter: "blur(6px)" } : undefined} transition={{ duration: 0.45, ease: EASE }}>
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
    </main>
  );
}
