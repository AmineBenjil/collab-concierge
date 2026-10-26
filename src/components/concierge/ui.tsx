"use client";

import { RiCheckLine, RiFileCopyLine } from "@remixicon/react";
import { motion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Avatar } from "../HandleForm";

/* Shared pieces for the business side: setup, share and dashboard. */

export const EASE = [0.22, 1, 0.36, 1] as const;

export function Rise({ i, children, className = "" }: { i: number; children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y: 16, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.7, ease: EASE, delay: 0.08 + i * 0.08 }}>
      {children}
    </motion.div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-[28px] border border-line bg-white p-6 shadow-[0_30px_60px_-36px_rgba(40,30,110,0.4)] ${className}`}>{children}</div>;
}

export function Profile({ handle, name }: { handle: string; name: string }) {
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

export function StepIcon({ state }: { state: "done" | "working" | "waiting" }) {
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

export function copyText(text: string, then: () => void) {
  navigator.clipboard?.writeText(text).then(then, then);
}

/* "Copied" for 1.5s after a click, then back to normal */
function useCopied() {
  const [copied, setCopied] = useState(false);
  const t = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(t.current), []);
  const copy = (text: string) =>
    copyText(text, () => {
      setCopied(true);
      clearTimeout(t.current);
      t.current = setTimeout(() => setCopied(false), 1500);
    });
  return [copied, copy] as const;
}

export function CopyButton({ text, label, dark = false, className = "" }: { text: string; label: string; dark?: boolean; className?: string }) {
  const [copied, copy] = useCopied();
  const tone = copied
    ? "border-transparent bg-[#1f9d55] text-white"
    : dark
      ? "border-transparent bg-[#111] text-white hover:bg-black"
      : "border-[#e3e3e3] bg-white text-[#1a1a1a] hover:bg-[#fafafa]";
  return (
    <button
      type="button"
      onClick={() => copy(text)}
      aria-live="polite"
      className={`inline-flex h-[41px] shrink-0 items-center justify-center gap-2 rounded-full text-[14px] font-semibold leading-[17px] transition-colors duration-200 ${
        dark ? "pl-4 pr-6" : "border-[0.5px] pl-[15.5px] pr-[23.5px] shadow-[0_4px_7px_rgba(0,0,0,0.08)]"
      } ${tone} ${className}`}
    >
      {copied ? <RiCheckLine size={16} aria-hidden="true" className="shrink-0" /> : <RiFileCopyLine size={16} aria-hidden="true" className="shrink-0" />}
      {/* both labels share one grid cell, so the button keeps the wider one's width either way */}
      <span className="grid justify-items-center">
        <span className={`col-start-1 row-start-1 ${copied ? "invisible" : ""}`}>{label}</span>
        <span className={`col-start-1 row-start-1 ${copied ? "" : "invisible"}`} aria-hidden={!copied}>
          Copied
        </span>
      </span>
    </button>
  );
}

/* a round copy button for contact rows; the tick says it worked */
export function CopyIcon({ text, label }: { text: string; label: string }) {
  const [copied, copy] = useCopied();
  return (
    <button
      type="button"
      onClick={() => copy(text)}
      aria-label={copied ? "Copied" : `Copy ${label}`}
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full transition-colors duration-200 ${copied ? "bg-mint/12 text-[#178a60]" : "text-muted hover:bg-white hover:text-ink"}`}
    >
      {copied ? <RiCheckLine size={17} aria-hidden="true" /> : <RiFileCopyLine size={16} aria-hidden="true" />}
    </button>
  );
}

/* the segmented pill used for Share/Dashboard and the Fit/Date sort: a white thumb slides between options */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  id,
  label,
  size = "md",
}: {
  options: { value: T; label: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  id: string;
  label: string;
  size?: "sm" | "md";
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex items-center rounded-full bg-[#eef0f3] p-1 shadow-[inset_0_1px_2px_rgba(15,20,40,0.06)]">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={`relative rounded-full font-semibold transition-colors duration-200 ${size === "sm" ? "px-3 py-1 text-[13px]" : "px-4 py-1.5 text-[14px]"} ${on ? "text-ink" : "text-muted hover:text-ink"}`}
          >
            {on && <Thumb layoutId={id} />}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* a quiet section heading with a hairline running to the edge: "Strong fit ————— Sort by date" */
export function SectionLabel({ children, right, className = "" }: { children: ReactNode; right?: ReactNode; className?: string }) {
  return (
    <div className={`flex items-center gap-3 text-[14px] text-muted ${className}`}>
      <span className="shrink-0">{children}</span>
      <span className="h-px flex-1 bg-[#ececf1]" />
      {right}
    </div>
  );
}

export function Thumb({ layoutId, rounded = "rounded-full" }: { layoutId: string; rounded?: string }) {
  return (
    <motion.span
      layoutId={layoutId}
      className={`absolute inset-0 ${rounded} bg-white shadow-[0_1px_2px_rgba(15,20,40,0.08),0_4px_12px_-4px_rgba(15,20,40,0.18)]`}
      transition={{ type: "spring", stiffness: 420, damping: 36 }}
    />
  );
}
