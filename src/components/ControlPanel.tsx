"use client";

import { RiArrowDownSLine, RiCloseLine, RiSettings3Line } from "@remixicon/react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { useControls, type HeroBg } from "./controls";

const EASE = [0.22, 1, 0.36, 1] as const;

const HERO_OPTIONS: { value: HeroBg; label: string; hint: string }[] = [
  { value: "v1", label: "V1", hint: "Night" },
  { value: "v2", label: "V2", hint: "Light grid" },
];

/* jump straight to any screen of the demo without walking the flows */
const DEMO = "foundcoffee";
const q = `?handle=${DEMO}`;
const SHORTCUTS: { group: string; links: { label: string; href?: string }[] }[] = [
  {
    group: "Business side",
    links: [
      { label: "Home page", href: "/" },
      { label: "Meet your Concierge", href: `/start${q}` },
      { label: "You're live", href: `/share${q}` },
      { label: "Dashboard", href: `/dashboard${q}` },
      { label: "A creator pop-up", href: `/dashboard${q}&open=mia` },
    ],
  },
  {
    group: "Creator side",
    links: [
      { label: "Creator flow, from the start", href: `/c/${DEMO}` },
      { label: "Creator done screen", href: `/c/${DEMO}?step=done` },
    ],
  },
  { group: "Not built yet", links: [{ label: "Customize" }] },
];

const noop = () => () => {};
/* the creator preview embeds the whole flow in a phone frame; no gear inside that */
function useEmbedded() {
  return useSyncExternalStore(noop, () => new URLSearchParams(window.location.search).get("embed") === "1", () => false);
}

/* Floating gear in the corner: shortcuts to every screen, and the A/B switches. On every page. */
export default function ControlPanel() {
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<"shortcuts" | "look" | null>("shortcuts");
  const { heroBg, setHeroBg } = useControls();
  const pathname = usePathname();
  const embedded = useEmbedded();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  if (embedded) return null;

  const toggle = (s: "shortcuts" | "look") => setSection(section === s ? null : s);

  return (
    // under the request pop-up (z-60), so the gear never sits on its footer buttons
    <div ref={ref} className="fixed bottom-5 right-5 z-[55] flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            id="control-panel"
            role="dialog"
            aria-label="Control panel"
            className="flex max-h-[calc(100svh-100px)] w-[300px] flex-col overflow-hidden rounded-[20px] border border-line bg-white/95 text-ink shadow-[0_24px_60px_-20px_rgba(40,30,110,0.45)] backdrop-blur-xl"
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.25, ease: EASE }}
            style={{ transformOrigin: "bottom right" }}
          >
            <div className="flex shrink-0 items-center justify-between px-4 pb-2 pt-4">
              <span className="text-[15px] font-semibold">Control panel</span>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close control panel" className="grid h-7 w-7 place-items-center rounded-full text-muted transition-colors hover:bg-lilac hover:text-ink">
                <RiCloseLine size={16} aria-hidden="true" />
              </button>
            </div>

            <div className="min-h-0 overflow-y-auto px-2 pb-2">
              <Section title="Shortcuts" hint="Jump to any screen" open={section === "shortcuts"} onToggle={() => toggle("shortcuts")}>
                {SHORTCUTS.map((g) => (
                  <div key={g.group} className="mt-1 first:mt-0">
                    <div className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">{g.group}</div>
                    <ul>
                      {g.links.map((l) => {
                        const here = l.href && l.href.split(/[?&]/)[0] === pathname && !l.href.includes("open=") && !l.href.includes("step=");
                        return (
                          <li key={l.label}>
                            {l.href ? (
                              <Link
                                href={l.href}
                                onClick={() => setOpen(false)}
                                aria-current={here ? "page" : undefined}
                                className={`flex items-center justify-between rounded-[10px] px-2 py-2 text-[14px] transition-colors hover:bg-[#f3f2f9] ${here ? "font-semibold text-violet" : "text-ink"}`}
                              >
                                {l.label}
                                {here && <span className="text-[11px] font-medium text-muted">You&apos;re here</span>}
                              </Link>
                            ) : (
                              <span aria-disabled="true" className="block px-2 py-2 text-[14px] text-muted/80">
                                {l.label}
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </Section>

              <Section title="Look" hint="Theme and versions" open={section === "look"} onToggle={() => toggle("look")}>
                <fieldset className="px-2 pb-1 pt-2">
                  <legend className="text-[13px] font-medium text-ink-2">Hero background</legend>
                  <div className="mt-2 grid grid-cols-2 gap-1 rounded-[14px] bg-[#f3f2f9] p-1">
                    {HERO_OPTIONS.map((o) => {
                      const on = heroBg === o.value;
                      return (
                        <button
                          key={o.value}
                          type="button"
                          aria-pressed={on}
                          onClick={() => setHeroBg(o.value)}
                          className={`rounded-[10px] px-3 py-2 text-left transition-all duration-200 ${on ? "bg-white shadow-[0_4px_12px_-6px_rgba(40,30,110,0.35)]" : "hover:bg-white/60"}`}
                        >
                          <span className={`block text-[14px] font-semibold ${on ? "text-violet" : "text-ink"}`}>{o.label}</span>
                          <span className="block text-[12px] text-muted">{o.hint}</span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              </Section>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="control-panel"
        aria-label={open ? "Close control panel" : "Open control panel"}
        className="grid h-11 w-11 place-items-center rounded-full border border-line bg-white text-ink shadow-[0_12px_28px_-10px_rgba(40,30,110,0.45)] transition-transform duration-300 hover:scale-105"
      >
        <RiSettings3Line size={20} aria-hidden="true" className={`transition-transform duration-500 ${open ? "rotate-90" : ""}`} />
      </button>
    </div>
  );
}

/* one collapsible category, so shortcuts and A/B switches don't crowd each other */
function Section({ title, hint, open, onToggle, children }: { title: string; hint: string; open: boolean; onToggle: () => void; children: ReactNode }) {
  return (
    <div className="border-t border-line first:border-t-0">
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full items-center justify-between rounded-[10px] px-2 py-2.5 text-left transition-colors hover:bg-[#f3f2f9]">
        <span>
          <span className="block text-[14px] font-semibold text-ink">{title}</span>
          <span className="block text-[12px] text-muted">{hint}</span>
        </span>
        <RiArrowDownSLine size={18} aria-hidden="true" className={`text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: EASE }} className="overflow-hidden">
            <div className="pb-2">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
