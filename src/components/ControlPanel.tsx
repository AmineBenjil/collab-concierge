"use client";

import { RiCloseLine, RiSettings3Line } from "@remixicon/react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useControls, type HeroBg } from "./controls";

const EASE = [0.22, 1, 0.36, 1] as const;

const HERO_OPTIONS: { value: HeroBg; label: string; hint: string }[] = [
  { value: "v1", label: "V1", hint: "Night" },
  { value: "v2", label: "V2", hint: "Light grid" },
];

/* Floating gear in the corner that opens the A/B control panel. */
export default function ControlPanel() {
  const [open, setOpen] = useState(false);
  const { heroBg, setHeroBg } = useControls();
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

  return (
    <div ref={ref} className="fixed bottom-5 right-5 z-[90] flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            id="control-panel"
            role="dialog"
            aria-label="Control panel"
            className="w-[280px] rounded-[20px] border border-line bg-white/90 p-4 text-ink shadow-[0_24px_60px_-20px_rgba(40,30,110,0.45)] backdrop-blur-xl"
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.25, ease: EASE }}
            style={{ transformOrigin: "bottom right" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-semibold">Control panel</span>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close control panel" className="grid h-7 w-7 place-items-center rounded-full text-muted transition-colors hover:bg-lilac hover:text-ink">
                <RiCloseLine size={16} aria-hidden="true" />
              </button>
            </div>

            <fieldset className="mt-4">
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
