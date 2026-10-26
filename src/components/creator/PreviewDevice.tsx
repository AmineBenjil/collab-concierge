"use client";

import { RiArrowLeftLine, RiRefreshLine } from "@remixicon/react";
import { motion } from "motion/react";
import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import { FRAME_RATIO, PT_H, PT_W, SCREEN, StatusBar } from "../Phone";

/*
  Desktop "see what creators see": the real flow, running in a phone-sized iframe (so it gets a true
  mobile viewport, its own scrolling and its own sheets) inside the same iPhone 16 Pro frame as the
  landing page, under an iOS status bar and above Safari's compact bottom bar.
*/

const EASE = [0.22, 1, 0.36, 1] as const;
const STATUS = 54;
const BAR = 80; // Safari's floating bottom bar plus the home indicator
const IOS_GLASS = {
  background: "rgba(255,255,255,0.72)",
  backdropFilter: "blur(24px) saturate(180%)",
  WebkitBackdropFilter: "blur(24px) saturate(180%)",
  boxShadow: "0 4px 18px -4px rgba(0,0,0,0.16), inset 0 0 0 0.5px rgba(0,0,0,0.08)",
};

export default function PreviewDevice({ handle, draftKey }: { handle: string; draftKey: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number | null>(null);
  const [run, setRun] = useState(0);

  useLayoutEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const measure = () => setScale((el.getBoundingClientRect().width * (SCREEN.width / 100)) / PT_W);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const restart = () => {
    try {
      localStorage.removeItem(draftKey);
    } catch {}
    setRun((r) => r + 1);
  };

  const s = scale ?? 0.8;
  const screenBox = { left: `${SCREEN.left}%`, top: `${SCREEN.top}%`, width: `${SCREEN.width}%`, height: `${SCREEN.height}%`, borderRadius: 51 * s };
  const share = `/share?handle=${encodeURIComponent(handle)}`;

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-[#f4f3f8] px-8 py-10">
      {/* the café's own colours, blurred far back */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/ig/foundcoffee.jpg" alt="" className="h-full w-full scale-125 object-cover opacity-35 blur-[90px]" />
        <div className="absolute inset-0 bg-[#f4f3f8]/60" />
      </div>

      <div className="relative flex w-full max-w-[1040px] items-center justify-center gap-16 xl:gap-24">
        <motion.div className="hidden max-w-[360px] lg:block" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE }}>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-[13px] font-semibold text-ink-2 shadow-[inset_0_0_0_1px_rgba(22,26,53,0.08)]">
            <span className="h-2 w-2 rounded-full bg-mint" aria-hidden="true" />
            Creator preview
          </span>
          <h1 className="flow-title mt-5 !text-[44px]">This is what creators see.</h1>
          <p className="mt-4 text-[17px] leading-relaxed text-ink-2">Your link opens like this on their phone, straight from your DM reply. Tap through it the way they would.</p>
          <div className="mt-8 flex flex-wrap items-center gap-2">
            <Link href={share} className="inline-flex h-12 items-center gap-2 rounded-full bg-ink px-5 text-[15px] font-semibold text-white transition-colors hover:bg-black">
              <RiArrowLeftLine size={17} aria-hidden="true" /> Back to your Concierge
            </Link>
            <button type="button" onClick={restart} className="inline-flex h-12 items-center gap-2 rounded-full px-5 text-[15px] font-semibold text-ink-2 transition-colors hover:bg-white/70">
              <RiRefreshLine size={17} aria-hidden="true" /> Start over
            </button>
          </div>
        </motion.div>

        <motion.div
          ref={wrap}
          className="relative h-[min(880px,calc(100svh-80px))] shrink-0"
          style={{ aspectRatio: `1 / ${FRAME_RATIO}` }}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE, delay: 0.1 }}
        >
          <div className="pointer-events-none absolute inset-x-[10%] bottom-[2%] top-[6%] rounded-[60px] bg-[rgba(50,25,140,0.35)] blur-[40px]" />
          <div className="absolute bg-black" style={screenBox} />
          <div className="absolute overflow-hidden bg-white" style={{ ...screenBox, isolation: "isolate" }}>
            <div className="ios absolute left-0 top-0 origin-top-left overflow-hidden bg-white" style={{ width: PT_W, height: PT_H, transform: `scale(${s})`, opacity: scale === null ? 0 : 1 }}>
              <StatusBar />
              <iframe
                key={run}
                src={`/c/${encodeURIComponent(handle)}?embed=1`}
                title="Your Collab Concierge link, as a creator sees it"
                className="absolute left-0 w-full border-0 bg-white"
                style={{ top: STATUS, height: PT_H - STATUS - BAR }}
              />
              <SafariBar />
            </div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/iphone-16-pro.png" alt="" draggable={false} className="pointer-events-none absolute inset-0 h-full w-full" />
        </motion.div>
      </div>

      {/* under lg the copy column hides, so the way back sits above the phone */}
      <Link href={share} className="absolute left-5 top-5 inline-flex h-10 items-center gap-1.5 rounded-full bg-white/85 px-4 text-[14px] font-semibold text-ink shadow-[inset_0_0_0_1px_rgba(22,26,53,0.08)] lg:hidden">
        <RiArrowLeftLine size={16} aria-hidden="true" /> Back
      </Link>
    </div>
  );
}

/* iOS 26 Safari, compact tabs: back, the address capsule, and the page menu, floating in glass */
function SafariBar() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 bg-white" style={{ height: BAR }} aria-hidden="true">
      <div className="flex items-center gap-[10px] px-[14px] pt-[6px]">
        <span className="grid h-[44px] w-[44px] shrink-0 place-items-center rounded-full" style={IOS_GLASS}>
          <svg width="12" height="20" viewBox="0 0 12 20" fill="none"><path d="M10 2 2 10l8 8" stroke="#000" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </span>
        <span className="relative flex h-[44px] min-w-0 flex-1 items-center justify-center rounded-full" style={IOS_GLASS}>
          <svg className="absolute left-[14px]" width="20" height="16" viewBox="0 0 20 16" fill="none"><rect x="1" y="1" width="18" height="14" rx="3.5" stroke="#000" strokeWidth="1.6" /><path d="M5 5.5h10M5 8h10M5 10.5h6" stroke="#000" strokeWidth="1.4" strokeLinecap="round" /></svg>
          <span className="flex items-center gap-[4px] text-[15px] font-medium tracking-[-0.2px] text-black">
            <svg width="9" height="12" viewBox="0 0 9 12" fill="none"><rect x="0.5" y="5" width="8" height="6.5" rx="1.4" fill="#000" /><path d="M2.2 5V3.6a2.3 2.3 0 0 1 4.6 0V5" stroke="#000" strokeWidth="1.3" /></svg>
            benable.com
          </span>
          <svg className="absolute right-[14px]" width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M20 12a8 8 0 1 1-2.6-5.9M20 4v4.5h-4.5" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </span>
        <span className="grid h-[44px] w-[44px] shrink-0 place-items-center rounded-full" style={IOS_GLASS}>
          <svg width="20" height="4" viewBox="0 0 20 4" fill="#000"><circle cx="2" cy="2" r="2" /><circle cx="10" cy="2" r="2" /><circle cx="18" cy="2" r="2" /></svg>
        </span>
      </div>
      <div className="absolute bottom-[8px] left-1/2 h-[5px] w-[134px] -translate-x-1/2 rounded-full bg-black" />
    </div>
  );
}
