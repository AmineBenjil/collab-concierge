"use client";

import { AnimatePresence, motion } from "motion/react";
import { RiArrowRightLine, RiCheckLine } from "@remixicon/react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { cleanHandle, displayName, setDraftHandle } from "./handle";

const EASE = [0.22, 1, 0.36, 1] as const;

type Status = "idle" | "searching" | "match" | "confirmed";

/*
  The one sign-up control on the page: a business's Instagram handle.
  Used in the hero and in the closing section, so the two always behave the same.
  Submit looks the account up, asks "is this you?" on a card that floats under the pill
  (nothing around it moves), then hands off to the setup page.
*/
// brings a handle field into view (a little above the middle of the screen) and puts the cursor in it,
// so it shows its active, ready-to-type state; returns false if the field isn't on the page
export function focusHandleInput(scope: string) {
  const input = document.querySelector<HTMLInputElement>(`${scope} input`);
  if (!input) return false;
  const r = input.getBoundingClientRect();
  const top = Math.max(0, window.scrollY + r.top + r.height / 2 - window.innerHeight * 0.45);
  window.scrollTo({ top, behavior: "smooth" });
  input.focus({ preventScroll: true });
  return true;
}

export default function HandleForm({
  tone = "dark",
  centerNote = tone === "light",
  className = "",
}: {
  tone?: "dark" | "light";
  centerNote?: boolean;
  className?: string;
}) {
  const id = useId();
  const router = useRouter();
  const [handle, setHandle] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const clean = cleanHandle(handle);
  const ready = clean.length > 0;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!ready || status !== "idle") return;
    setStatus("searching");
    timer.current = setTimeout(() => setStatus("match"), 1100);
  };

  const confirm = () => {
    setStatus("confirmed");
    timer.current = setTimeout(() => router.push(`/start?handle=${encodeURIComponent(clean)}`), 750);
  };

  const reset = () => {
    clearTimeout(timer.current);
    setStatus("idle");
  };

  const open = status === "match" || status === "confirmed";

  return (
    <div className={`relative w-full max-w-[520px] ${className}`}>
      <form onSubmit={submit} className="group relative">
        <div className="pointer-events-none absolute -inset-1 rounded-full bg-[radial-gradient(closest-side,rgba(143,108,247,0.45),transparent)] opacity-0 blur-xl transition-opacity duration-500 group-focus-within:opacity-100" />
        <div
          className={`relative flex h-[58px] items-center overflow-hidden rounded-full bg-white pl-4 pr-1.5 outline-2 outline-offset-0 outline-transparent transition-[outline-color] duration-200 focus-within:outline-[#8f7cf7] sm:h-[64px] sm:pl-6 sm:pr-2 ${
            tone === "dark"
              ? "shadow-[0_24px_50px_-24px_rgba(0,0,0,0.6),inset_0_0_0_1px_rgba(22,26,53,0.06)]"
              : "shadow-[0_24px_50px_-28px_rgba(40,30,110,0.45),inset_0_0_0_1px_rgba(22,26,53,0.09)]"
          }`}
        >
          <span className="text-[15px] font-semibold text-muted sm:text-[17px]" aria-hidden="true">@</span>
          <label htmlFor={id} className="sr-only">Your business&rsquo;s Instagram handle</label>
          <input
            id={id}
            value={handle}
            onChange={(e) => {
              setHandle(e.target.value);
              setDraftHandle(e.target.value);
              if (status !== "idle") reset();
            }}
            placeholder="Your business's Instagram handle"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            className="h-full min-w-0 flex-1 bg-transparent pl-1.5 text-[16px] tracking-[-0.01em] text-ink outline-none focus-visible:outline-none placeholder:text-[14.5px] placeholder:text-muted sm:pl-2 sm:text-[17px] sm:placeholder:text-[17px]"
          />
          {/* stays a faint 20% purple until there's a handle to send; spins while we look it up */}
          <button
            type="submit"
            disabled={!ready}
            aria-label={status === "searching" ? "Looking up your account" : "Find my account"}
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-white transition-[background-color,box-shadow,transform] duration-300 ease-[cubic-bezier(.2,.8,.2,1)] sm:h-12 sm:w-12 ${
              ready
                ? "bg-[#5035e3] shadow-[0_10px_20px_-8px_rgba(80,53,227,0.8)] hover:scale-105 active:scale-95"
                : "cursor-not-allowed bg-[#5035e3]/20 shadow-none"
            }`}
          >
            {status === "searching" ? (
              <span className="h-[18px] w-[18px] animate-spin rounded-full border-2 border-white/30 border-t-white motion-reduce:animate-none" aria-hidden="true" />
            ) : (
              <RiArrowRightLine size={20} aria-hidden="true" />
            )}
          </button>
        </div>
      </form>

      <p
        className={`mt-3.5 pl-2 text-[14px] font-medium transition-opacity duration-300 ${tone === "dark" ? "text-white/55" : "text-muted"} ${centerNote ? "text-center" : ""} ${open ? "opacity-0" : ""}`}
        aria-hidden={open || undefined}
      >
        Totally <span className="underline decoration-[1.5px] underline-offset-[3px]">free</span>. 30 seconds to create.
      </p>

      {/* "is this you?" */}
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Confirm your account"
            className="absolute inset-x-0 top-[calc(100%-26px)] z-20"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.4, ease: EASE }}
          >
            <div className="flex items-center gap-3 rounded-[22px] border border-line bg-white p-3 text-left text-ink shadow-[0_24px_50px_-22px_rgba(40,30,110,0.45)] sm:gap-3.5 sm:p-3.5">
              <Avatar handle={clean} size={48} />
              <div className="min-w-0 flex-1 leading-tight">
                <div className="truncate text-[16px] font-semibold">{displayName(clean)}</div>
                <div className="mt-0.5 truncate text-[13.5px] text-muted">@{clean} · Instagram</div>
              </div>
              <AnimatePresence mode="wait" initial={false}>
                {status === "confirmed" ? (
                  <motion.span
                    key="yes"
                    role="status"
                    className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-mint px-4 text-[14px] font-semibold text-white"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, ease: EASE }}
                  >
                    <RiCheckLine size={16} aria-hidden="true" /> That&rsquo;s me
                  </motion.span>
                ) : (
                  <motion.button
                    key="ask"
                    type="button"
                    onClick={confirm}
                    className="h-10 shrink-0 rounded-full bg-[#111] px-4 text-[14px] font-semibold text-white transition-colors hover:bg-black"
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                  >
                    Yes, that&rsquo;s me
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* stand-in for the account's profile picture until we read the real one from Instagram */
export function Avatar({ size }: { handle?: string; size: number }) {
  return (
    <span className="brand-grad grid shrink-0 place-items-center rounded-full p-[2px]" style={{ width: size, height: size }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/img/ig/konacoffee.jpg" alt="" className="h-full w-full rounded-full border-2 border-white object-cover" />
    </span>
  );
}
