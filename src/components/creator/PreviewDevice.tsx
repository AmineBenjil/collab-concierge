"use client";

import { RiArrowLeftLine, RiRefreshLine } from "@remixicon/react";
import { motion } from "motion/react";
import Link from "next/link";
import { useLayoutEffect, useRef, useState, type Ref } from "react";
import { FRAME_RATIO, PT_H, PT_W, SCREEN, StatusBar } from "../Phone";

/*
  Desktop "see what creators see": the real flow, running in a phone-sized iframe (so it gets a true
  mobile viewport, its own scrolling and its own sheets) inside the same iPhone 16 Pro frame as the
  landing page, under the iOS status bar and Chrome's address bar (Design Labs 15526:88239).
*/

const EASE = [0.22, 1, 0.36, 1] as const;
const CHROME = 94; // status bar plus Chrome's top address bar

export default function PreviewDevice({ handle, draftKey }: { handle: string; draftKey: string }) {
  const [run, setRun] = useState(0);

  const restart = () => {
    try {
      localStorage.removeItem(draftKey);
    } catch {}
    setRun((r) => r + 1);
  };

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

        <motion.div className="shrink-0" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: EASE, delay: 0.1 }}>
          <CreatorPhone key={run} src={`/c/${encodeURIComponent(handle)}?embed=1`} className="h-[min(880px,calc(100svh-80px))]" />
        </motion.div>
      </div>

      {/* under lg the copy column hides, so the way back sits above the phone */}
      <Link href={share} className="absolute left-5 top-5 inline-flex h-10 items-center gap-1.5 rounded-full bg-white/85 px-4 text-[14px] font-semibold text-ink shadow-[inset_0_0_0_1px_rgba(22,26,53,0.08)] lg:hidden">
        <RiArrowLeftLine size={16} aria-hidden="true" /> Back
      </Link>
    </div>
  );
}

/* The phone itself: a creator's link running in an iframe at true iPhone points, scaled into the real
   frame PNG. Its height comes from className; the width follows the frame's ratio. Customize reuses it. */
export function CreatorPhone({ src, className = "", frameRef }: { src: string; className?: string; frameRef?: Ref<HTMLIFrameElement> }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const measure = () => setScale((el.getBoundingClientRect().width * (SCREEN.width / 100)) / PT_W);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const s = scale ?? 0.8;
  const screenBox = { left: `${SCREEN.left}%`, top: `${SCREEN.top}%`, width: `${SCREEN.width}%`, height: `${SCREEN.height}%`, borderRadius: 51 * s };

  return (
    <div ref={wrap} className={`relative ${className}`} style={{ aspectRatio: `1 / ${FRAME_RATIO}` }}>
      <div className="pointer-events-none absolute inset-x-[10%] bottom-[2%] top-[6%] rounded-[60px] bg-[rgba(50,25,140,0.35)] blur-[40px]" />
      <div className="absolute bg-black" style={screenBox} />
      <div className="absolute overflow-hidden bg-white" style={{ ...screenBox, isolation: "isolate" }}>
        <div className="ios absolute left-0 top-0 origin-top-left overflow-hidden bg-white" style={{ width: PT_W, height: PT_H, transform: `scale(${s})`, opacity: scale === null ? 0 : 1 }}>
          <ChromeBar />
          <StatusBar />
          <iframe ref={frameRef} src={src} title="Your Collab Concierge link, as a creator sees it" className="absolute left-0 w-full border-0 bg-white" style={{ top: CHROME, height: PT_H - CHROME }} />
        </div>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/img/iphone-16-pro.png" alt="" draggable={false} className="pointer-events-none absolute inset-0 h-full w-full" />
    </div>
  );
}

/* Chrome on iOS, address bar on top: the grey capsule with the lock and domain, share on the right (Figma's own glyphs) */
function ChromeBar() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-white shadow-[0_0.4px_0_0_#ccc]" style={{ height: CHROME }} aria-hidden="true">
      <div className="absolute bottom-[10px] left-[11px] right-[10px] h-[36px] rounded-[30px] bg-[#e8eaed]" />
      <div className="absolute bottom-[18px] left-[calc(50%+0.41px)] flex -translate-x-1/2 items-center gap-[7px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/creator/chrome-lock.svg" alt="" width={7.828} height={11.432} className="block" />
        <span className="whitespace-nowrap text-[18px] leading-[normal] tracking-[-0.18px] text-[#202124]">benable.com</span>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/img/creator/chrome-share.svg" alt="" width={13.455} height={16.97} className="absolute bottom-[20.47px] right-[26.68px] block" />
    </div>
  );
}
