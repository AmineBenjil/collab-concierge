"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { useToast } from "../Shell";
import { EASE } from "../ui";
import type { ChangeEmail } from "./model";

/* ---------- the app's buttons, at 44px ---------- */

/* Settings' white pill ("Copy reply") */
export const SOFT_PILL =
  "inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full border-[0.5px] border-[#e3e3e3] bg-white px-5 text-[14px] font-semibold text-[#1a1a1a] shadow-[0_4px_7px_rgba(0,0,0,0.08)] transition-colors duration-200 hover:bg-[#fafafa]";
/* a text button inside a sentence: looks inline, but its hit area grows to 44px tall */
export const INLINE =
  "relative font-semibold text-ink-2 underline decoration-[#d8d8df] underline-offset-4 transition-colors hover:text-ink hover:decoration-ink after:absolute after:-inset-x-1 after:-inset-y-3.5 after:content-[''] disabled:no-underline";

export function Spinner({ light = true }: { light?: boolean }) {
  return <span aria-hidden="true" className={`size-4 shrink-0 animate-spin rounded-full border-2 motion-reduce:animate-none ${light ? "border-white/30 border-t-white" : "border-violet/15 border-t-violet"}`} />;
}

/* ---------- the dialog: scrim, focus trap, Esc, focus back to the trigger ---------- */

export function Dialog({
  m,
  returnTo,
  labelledBy,
  className,
  children,
}: {
  m: ChangeEmail;
  returnTo: RefObject<HTMLElement | null>;
  labelledBy: string;
  className: string;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();
  const panel = useRef<HTMLDivElement>(null);
  const busy = m.phase === "sending";
  const busyRef = useRef(busy);
  const close = useRef(m.close);
  useEffect(() => {
    busyRef.current = busy;
    close.current = m.close;
  });

  /* the page holds still under it; focus comes back to "Change email" when it closes */
  useEffect(() => {
    const html = document.documentElement;
    const { overflow, paddingRight } = html.style;
    const gap = window.innerWidth - html.clientWidth;
    html.style.overflow = "hidden";
    if (gap > 0) html.style.paddingRight = `${gap}px`;
    const target = returnTo.current;
    return () => {
      html.style.overflow = overflow;
      html.style.paddingRight = paddingRight;
      target?.focus({ preventScroll: true });
    };
  }, [returnTo]);

  /* while sending, the field and button are locked, so focus waits on the dialog itself; when sending
     ends without leaving the step (an error), it goes back to the field */
  const wasBusy = useRef(busy);
  useEffect(() => {
    const el = panel.current;
    if (busy) el?.focus({ preventScroll: true });
    else if (wasBusy.current && m.phase === "enter") el?.querySelector<HTMLElement>("[data-autofocus]")?.focus({ preventScroll: true });
    wasBusy.current = busy;
  }, [busy, m.phase]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const el = panel.current;
      if (!el) return;
      if (e.key === "Escape") {
        e.preventDefault();
        if (!busyRef.current) close.current();
        return;
      }
      if (e.key !== "Tab") return;
      const items = [...el.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])')].filter((n) => n.offsetParent !== null);
      if (!items.length) return e.preventDefault();
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === el)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, []);

  return (
    <motion.div className="fixed inset-0 z-[60] flex items-end justify-center p-3 sm:items-center sm:p-6" initial="hidden" animate="shown" exit="hidden">
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 bg-black/40"
        variants={{ hidden: { opacity: 0 }, shown: { opacity: 1 } }}
        transition={{ duration: 0.3 }}
        onClick={() => !busy && m.close()}
      />
      <motion.div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={`relative max-h-[calc(100svh-24px)] w-full overflow-y-auto overscroll-contain outline-none ${className}`}
        variants={reduce ? { hidden: { opacity: 0 }, shown: { opacity: 1 } } : { hidden: { opacity: 0, y: 20, scale: 0.98 }, shown: { opacity: 1, y: 0, scale: 1 } }}
        transition={{ duration: 0.38, ease: EASE }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

/* the height follows the step inside it, so switching steps resizes the dialog instead of jumping */
export function AutoHeight({ children }: { children: ReactNode }) {
  const inner = useRef<HTMLDivElement>(null);
  const [h, setH] = useState<number | "auto">("auto");
  useLayoutEffect(() => {
    const el = inner.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setH(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <motion.div animate={{ height: h }} initial={false} transition={{ duration: 0.32, ease: EASE }} className="overflow-hidden">
      <div ref={inner}>{children}</div>
    </motion.div>
  );
}

/* one step at a time, a short cross-fade between them; each step, once it's in, puts focus on its own
   first thing (the field, or its main button) */
export function Step({ k, children }: { k: string; children: ReactNode }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div key={k} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2, ease: EASE }}>
        <Focus>{children}</Focus>
      </motion.div>
    </AnimatePresence>
  );
}

function Focus({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    const first = el?.querySelector<HTMLElement>("[data-autofocus]:not(:disabled)");
    if (first) first.focus({ preventScroll: true });
    else el?.closest<HTMLElement>('[role="dialog"]')?.focus({ preventScroll: true });
  }, []);
  return <div ref={ref}>{children}</div>;
}

/* the key for Step: errors stay inside "enter", the sending spinner too */
export const stepKey = (m: ChangeEmail) => (m.phase === "sending" ? "enter" : m.phase === "confirmed" && m.otherDevice ? "confirmed-away" : m.phase);

/* the confirmed step on another device: its one button sends a sign-in link to the new address */
export function useSignIn(m: ChangeEmail) {
  const say = useToast();
  return () => {
    say(`We sent a sign-in link to ${m.target}.`);
    m.close();
  };
}

/* Send link waits for a full email, and holds off while sending or rate limited */
export const sendDisabled = (m: ChangeEmail) => m.phase === "sending" || !m.valid || m.rateLeft > 0;
