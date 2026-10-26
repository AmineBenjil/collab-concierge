"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useIntro } from "./IntroContext";
import { BrandIcon } from "./Logo";
import { usePhoneBrand } from "./handle";

/*
  Real iPhone 16 Pro frame (Apple Design Resources PNG). The screen is built on
  the 375 x 812 Instagram DM layout from the Figma file (Outreach assets, "IG UI"),
  then scaled to the frame's screen cutout. 375 x 815 matches the 16 Pro screen
  shape to within half a percent.

  Story: new DM arrives -> open thread -> tap composer (keyboard up) -> long-press
  -> Paste -> send -> Mia replies -> keyboard down -> swipe back to inbox ->
  another DM arrives -> Benable notification: Mia is checked, see her in your dashboard.
*/
export const SCREEN = { left: 7.255, top: 3.579, width: 85.775, height: 92.842 };
export const PT_W = 375;
export const PT_H = 815;
export const FRAME_RATIO = 1411 / 703;
const IOS_EASE = [0.32, 0.72, 0, 1] as const;
const KB_EASE = [0.25, 0.9, 0.3, 1] as const;
const SOFT = { type: "spring", stiffness: 240, damping: 32, mass: 0.9 } as const;
const UI = "/img/ig/ui";

const KB_H = 336; // predictive bar + keys + bottom bar, iPhone Face ID layout
const REST_BOTTOM = 36; // composer pill bottom gap with no keyboard (Figma)
const KB_BOTTOM = KB_H + 6;
const PILL_MIN = 42;
const PILL_MAX = 100;

// Figma tokens
const C = {
  ink: "#0f1014",
  bubbleText: "#0f1316",
  grey: "#6b7074",
  headerGrey: "#666e79",
  stamp: "#6f7376",
  incoming: "#f1f2f6",
  outgoing: "#5e49f0",
  hairline: "#eaeaec",
  placeholder: "#686e7c",
};

type Msg = { id: string; from: "them" | "me"; text: string; link?: boolean };
type Touch = { x: number; y: number; hold?: boolean } | null;

type State = {
  scene: "inbox" | "thread";
  back: boolean;
  newRow: boolean;
  pressed: boolean;
  kb: boolean;
  menu: boolean;
  typed: boolean;
  msgs: Msg[];
  seen: boolean;
  typing: boolean;
  miaAnswered: boolean;
  nextDm: boolean;
  banner: boolean;
  touch: Touch;
};

const OPENING: Msg[] = [
  { id: "a", from: "them", text: "hiii!! obsessed with your place 😍 i'm a Lisbon food creator (24.1K) and would LOVE to collab. gifted visit for a reel + 3 stories? 💜" },
];
const REPLY_TEXT = "Thanks for reaching out! We handle collab requests here, takes a couple minutes and we'll get back to you";
const reply = (handle: string) => `${REPLY_TEXT} benable.com/c/${handle}`;
const REPLY_MSG: Msg = { id: "c", from: "me", text: REPLY_TEXT, link: true };
const THANKS = "done!! that was so easy ✨";
const THANKS_MSG: Msg = { id: "d", from: "them", text: THANKS };

const INITIAL: State = {
  scene: "inbox",
  back: false,
  newRow: false,
  pressed: false,
  kb: false,
  menu: false,
  typed: false,
  msgs: OPENING,
  seen: false,
  typing: false,
  miaAnswered: false,
  nextDm: false,
  banner: false,
  touch: null,
};

const FINAL: State = { ...INITIAL, scene: "inbox", back: true, newRow: true, miaAnswered: true, nextDm: true, banner: true, msgs: [...OPENING, REPLY_MSG, THANKS_MSG] };

// tap targets, in 375-pt canvas coordinates
const T = {
  miaRow: { x: 190, y: 340 },
  composer: { x: 140, y: 758 },
  composerUp: { x: 140, y: PT_H - KB_BOTTOM - 21 },
  paste: { x: 116, y: PT_H - KB_BOTTOM - PILL_MIN - 30 },
  send: { x: 346, y: PT_H - KB_BOTTOM - 21 },
};

const TIMELINE: { at: number; set: (s: State) => State }[] = [
  { at: 900, set: (s) => ({ ...s, newRow: true }) },
  { at: 2300, set: (s) => ({ ...s, touch: T.miaRow, pressed: true }) },
  { at: 2650, set: (s) => ({ ...s, touch: null, pressed: false, scene: "thread" }) },
  { at: 3700, set: (s) => ({ ...s, touch: T.composer }) },
  { at: 3900, set: (s) => ({ ...s, touch: null, kb: true }) },
  { at: 4800, set: (s) => ({ ...s, touch: { ...T.composerUp, hold: true } }) },
  { at: 5400, set: (s) => ({ ...s, touch: null, menu: true }) },
  { at: 6100, set: (s) => ({ ...s, touch: T.paste }) },
  { at: 6300, set: (s) => ({ ...s, touch: null, menu: false, typed: true }) },
  { at: 7500, set: (s) => ({ ...s, touch: { ...T.send, y: PT_H - KB_BOTTOM - 19 } }) },
  { at: 7700, set: (s) => ({ ...s, touch: null, typed: false, msgs: [...s.msgs, REPLY_MSG] }) },
  { at: 8800, set: (s) => ({ ...s, seen: true }) },
  { at: 9500, set: (s) => ({ ...s, typing: true }) },
  { at: 11000, set: (s) => ({ ...s, typing: false, seen: false, msgs: [...s.msgs, THANKS_MSG] }) },
  { at: 12300, set: (s) => ({ ...s, kb: false }) },
  { at: 12800, set: (s) => ({ ...s, scene: "inbox", back: true, miaAnswered: true }) },
  { at: 14200, set: (s) => ({ ...s, nextDm: true }) },
  { at: 15600, set: (s) => ({ ...s, banner: true }) },
  { at: 20600, set: (s) => ({ ...s, banner: false }) },
];
const LOOP = 21600;

type Exit = { scene: State["scene"]; back: boolean };

export default function Phone({ className = "", onPhase }: { className?: string; onPhase?: (phase: number) => void }) {
  const { done, reduced } = useIntro();
  const [state, setState] = useState<State>(INITIAL);
  const [run, setRun] = useState(0);
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

  useEffect(() => {
    if (!done || reduced) return;
    const timers = TIMELINE.map(({ at, set }) => setTimeout(() => setState(set), at));
    timers.push(
      setTimeout(() => {
        setState(INITIAL);
        setRun((r) => r + 1);
      }, LOOP)
    );
    return () => timers.forEach(clearTimeout);
  }, [done, reduced, run]);

  const view = reduced ? FINAL : state;
  const phase = view.banner ? 4 : view.miaAnswered || view.seen || view.typing || view.msgs.length > 2 ? 3 : view.scene === "thread" ? 2 : 1;
  useEffect(() => {
    onPhase?.(phase);
  }, [phase, onPhase]);
  const s = scale ?? 0.8;
  const screenBox = {
    left: `${SCREEN.left}%`,
    top: `${SCREEN.top}%`,
    width: `${SCREEN.width}%`,
    height: `${SCREEN.height}%`,
    borderRadius: 51 * s,
  };
  const exitInfo: Exit = { scene: view.scene, back: view.back };

  return (
    <div
      ref={wrap}
      className={`relative select-none ${className}`}
      style={{ aspectRatio: `1 / ${FRAME_RATIO}` }}
      role="img"
      aria-label="Found Coffee's Instagram inbox. A creator named Mia asks for a collab, the café pastes its Benable link, Mia fills it in, a new DM arrives, and and Collab Concierge reports 18 collab requests reviewed and fully vetted."
    >
      {/* soft static shadow (a filter on the frame would repaint every frame) */}
      <div className="pointer-events-none absolute inset-x-[10%] bottom-[2%] top-[6%] rounded-[60px] bg-[rgba(50,25,140,0.35)] blur-[40px]" />
      <div className="absolute bg-black" style={screenBox} />
      <div className="absolute overflow-hidden bg-white" style={{ ...screenBox, isolation: "isolate" }}>
        <div
          className="ios absolute left-0 top-0 origin-top-left overflow-hidden"
          style={{ width: PT_W, height: PT_H, transform: `scale(${s})`, opacity: scale === null ? 0 : 1 }}
        >
          <AnimatePresence initial={false} custom={exitInfo}>
            {view.scene === "inbox" ? (
              <motion.div
                key={`inbox-${run}`}
                custom={exitInfo}
                variants={{
                  // forward push to the thread: slide left with iOS parallax; loop reset: fade
                  exit: (c: Exit) =>
                    c.scene === "thread"
                      ? { x: -110, transition: { duration: 0.5, ease: IOS_EASE } }
                      : { opacity: 0, transition: { duration: 0.45 } },
                }}
                initial={view.back ? { x: -110 } : { opacity: 0 }}
                animate={{ x: 0, opacity: 1, transition: { duration: view.back ? 0.5 : 0.45, ease: IOS_EASE } }}
                exit="exit"
                className="absolute inset-0 bg-white"
              >
                <Inbox view={view} />
              </motion.div>
            ) : (
              <motion.div
                key={`thread-${run}`}
                custom={exitInfo}
                variants={{
                  // pop back: slide off to the right, like iOS
                  exit: (c: Exit) =>
                    c.back ? { x: PT_W, transition: { duration: 0.5, ease: IOS_EASE } } : { opacity: 0, transition: { duration: 0.45 } },
                }}
                initial={{ x: PT_W }}
                animate={{ x: 0, transition: { duration: 0.5, ease: IOS_EASE } }}
                exit="exit"
                className="absolute inset-0 z-10 bg-white shadow-[-10px_0_24px_rgba(0,0,0,0.1)]"
              >
                <Thread state={view} />
              </motion.div>
            )}
          </AnimatePresence>

          <StatusBar />

          <AnimatePresence>
            {view.banner && (
              <motion.div
                key="banner"
                className="absolute left-[8px] right-[8px] top-[52px] z-30"
                initial={{ y: -160, scale: 0.96 }}
                animate={{ y: 0, scale: 1 }}
                exit={{ y: -160, transition: { duration: 0.45, ease: IOS_EASE } }}
                transition={{ type: "spring", stiffness: 210, damping: 26 }}
              >
                <BenableBanner />
              </motion.div>
            )}
          </AnimatePresence>

          <TouchDot touch={view.touch} />

          <div className="absolute bottom-[8px] left-1/2 z-40 h-[5px] w-[134px] -translate-x-1/2 rounded-full bg-black" />
        </div>
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/img/iphone-16-pro.png" alt="" draggable={false} className="pointer-events-none absolute inset-0 h-full w-full" />
    </div>
  );
}

/* ---------- finger indicator so viewers can follow taps ---------- */

function TouchDot({ touch }: { touch: Touch }) {
  return (
    <AnimatePresence>
      {touch && (
        <motion.span
          key={`${touch.x}-${touch.y}`}
          className="pointer-events-none absolute z-50 h-[44px] w-[44px] rounded-full border border-white/70 bg-black/20"
          style={{ left: touch.x - 22, top: touch.y - 22 }}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: touch.hold ? 1.15 : 1, opacity: 1, transition: { duration: touch.hold ? 0.5 : 0.15 } }}
          exit={{ scale: 1.3, opacity: 0, transition: { duration: 0.25 } }}
        />
      )}
    </AnimatePresence>
  );
}

/* ---------- iOS status bar (Figma: Status Bar - iPhone) ---------- */

export function StatusBar() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-[54px]">
      <span className="absolute left-0 top-[14.3px] w-[134px] text-center text-[17px] font-semibold leading-[22px] text-black">9:41</span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`${UI}/cellular.svg`} alt="" width={19.2} height={12.2264} className="absolute left-[268px] top-[18.5px]" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`${UI}/wifi.svg`} alt="" width={17.1417} height={12.3283} className="absolute left-[294.7px] top-[18.6px]" />
      <span className="absolute left-[319px] top-[18px] h-[13px] w-[25px] rounded-[4.3px] border border-black opacity-35" />
      <span className="absolute left-[321px] top-[20px] h-[9px] w-[21px] rounded-[2.5px] bg-[#b3b3b3]" />
      <span className="absolute left-[321px] top-[20px] h-[9px] w-[15.6px] rounded-l-[2.5px] bg-black" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`${UI}/battery-cap.svg`} alt="" width={1.32804} height={4.07547} className="absolute left-[345px] top-[22.8px]" />
    </div>
  );
}

/* ---------- iOS notification banner (system material) ---------- */

function BenableBanner() {
  return (
    <div
      className="flex gap-[12px] rounded-[22px] px-[14px] pb-[13px] pt-[12px]"
      style={{
        background: "rgba(250,250,250,0.78)",
        backdropFilter: "blur(30px) saturate(180%)",
        WebkitBackdropFilter: "blur(30px) saturate(180%)",
        boxShadow: "0 10px 30px -8px rgba(0,0,0,0.22), inset 0 0 0 0.5px rgba(255,255,255,0.6)",
      }}
    >
      {/* Collab Concierge app icon */}
      <BrandIcon size={38} className="mt-[2px]" />
      <div className="min-w-0 flex-1 text-black">
        <div className="flex items-baseline justify-between gap-2 text-[12.5px] uppercase tracking-[0.02em]" style={{ color: "rgba(60,60,67,0.6)" }}>
          <span className="truncate">Collab Concierge</span>
          <span className="shrink-0">now</span>
        </div>
        <div className="mt-[3px] text-[15px] font-semibold leading-[19px] tracking-[-0.24px]">18 collab requests reviewed and fully vetted.</div>
        <div className="mt-[2px] text-[14.5px] leading-[19px] tracking-[-0.2px] text-[#3c3c43]">3 strong fits, 2 worth a look. Ready whenever you are.</div>
      </div>
    </div>
  );
}

/* ---------- iOS keyboard (light, Face ID layout) ---------- */

const ROW1 = "QWERTYUIOP".split("");
const ROW2 = "ASDFGHJKL".split("");
const ROW3 = "ZXCVBNM".split("");

function Key({ children, w, grey, className = "" }: { children?: React.ReactNode; w?: number; grey?: boolean; className?: string }) {
  return (
    <span
      className={`flex h-[42px] items-center justify-center rounded-[5px] text-[22px] leading-none text-black shadow-[0_1px_0_rgba(0,0,0,0.3)] ${className}`}
      style={{ width: w, background: grey ? "#abb0ba" : "#fff" }}
    >
      {children}
    </span>
  );
}

function Keyboard() {
  const keyW = 31.5;
  return (
    <div className="h-full w-full bg-[#d1d3d9]">
      {/* predictive bar */}
      <div className="flex h-[44px] items-center text-[16px] text-black">
        {["“I”", "The", "I'm"].map((w, i) => (
          <span key={w} className="relative flex-1 text-center">
            {w}
            {i < 2 && <span className="absolute right-0 top-1/2 h-[24px] w-px -translate-y-1/2 bg-[#b5b8be]" />}
          </span>
        ))}
      </div>
      <div className="flex flex-col gap-[12px] px-[3px] pt-[6px]">
        <div className="flex justify-between">{ROW1.map((k) => <Key key={k} w={keyW}>{k}</Key>)}</div>
        <div className="flex justify-center gap-[6px]">{ROW2.map((k) => <Key key={k} w={keyW}>{k}</Key>)}</div>
        <div className="flex items-center justify-between">
          <Key w={42}>
            <svg width="20" height="18" viewBox="0 0 20 18" aria-hidden="true"><path d="M10 1 1.5 10H6v7h8v-7h4.5z" fill="#000" /></svg>
          </Key>
          <div className="flex gap-[6px]">{ROW3.map((k) => <Key key={k} w={keyW}>{k}</Key>)}</div>
          <Key w={42} grey>
            <svg width="24" height="18" viewBox="0 0 24 18" fill="none" aria-hidden="true"><path d="M7.5 1.5h13a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-13L1.5 9z" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" /><path d="m11 6 6 6m0-6-6 6" stroke="#000" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </Key>
        </div>
        <div className="flex gap-[6px]">
          <Key w={87} grey className="text-[16px]">123</Key>
          <Key className="flex-1 text-[16px]">space</Key>
          <Key w={87} grey className="text-[16px]">return</Key>
        </div>
      </div>
      {/* bottom bar: emoji + dictation */}
      <div className="relative mt-[4px] h-[60px]">
        <svg className="absolute left-[24px] top-[12px]" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#50555c" strokeWidth="1.6" aria-hidden="true"><circle cx="12" cy="12" r="9.5" /><path d="M8 14.5c1 1.4 2.4 2 4 2s3-.6 4-2" strokeLinecap="round" /><circle cx="9" cy="10" r="1" fill="#50555c" stroke="none" /><circle cx="15" cy="10" r="1" fill="#50555c" stroke="none" /></svg>
        <svg className="absolute right-[24px] top-[12px]" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#50555c" strokeWidth="1.6" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" strokeLinecap="round" /></svg>
      </div>
    </div>
  );
}

/* ---------- Instagram inbox, filled to the bottom ---------- */

const ROWS = [
  { img: "ana", name: "Ana Ribeiro", preview: "Do you have oat milk?", time: "1h" },
  { img: "nata", name: "Nata Lab", preview: "Sent an attachment", time: "3h" },
  { img: "joao", name: "João Pereira", preview: "Loved the cortado 😍", time: "5h" },
  { img: "ines", name: "Inês Martins", preview: "Are you open on Sunday?", time: "8h" },
  { img: "roasters", name: "Lisbon Roasters", preview: "Invoice for October is ready", time: "1d" },
  { img: "tiago", name: "Tiago Alves", preview: "Can I book the back room for 12?", time: "1d" },
  { img: "rafa", name: "Rafa Costa", preview: "Reacted ❤️ to your message", time: "2d" },
  { img: "beatriz", name: "Beatriz Lopes", preview: "Thank you for the croissants!", time: "2d" },
  { img: "cafe", name: "Barista Guild PT", preview: "Latte art night is on 🎉", time: "3d" },
  { img: "ana", name: "Marta Sousa", preview: "Do you sell your beans?", time: "4d" },
  { img: "joao", name: "Pedro Nunes", preview: "Seen", time: "5d" },
];

function Inbox({ view }: { view: State }) {
  const brand = usePhoneBrand();
  return (
    <div className="absolute inset-0 overflow-hidden pt-[54px]" style={{ color: C.ink }}>
      <div className="relative flex h-[45px] items-center px-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${UI}/back.svg`} alt="" width={24} height={24} />
        <span className="ml-3 max-w-[200px] truncate text-[20px] font-bold tracking-[-0.4px]">{brand.handle}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" className="ml-1" aria-hidden="true"><path d="m5 9 7 7 7-7" fill="none" stroke={C.ink} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        <span className="ml-auto flex items-center gap-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 17l6-6 4 4 8-8" /><path d="M15 7h6v6" /></svg>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3H6a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3v-6" /><path d="M18.4 2.6a2 2 0 0 1 2.9 2.9L12 14.8l-4 1 1-4z" /></svg>
        </span>
      </div>

      <div className="mx-4 mt-1 flex h-[36px] items-center gap-2 rounded-[10px] px-3 text-[15px]" style={{ background: C.incoming, color: C.grey }}>
        <span className="h-[18px] w-[18px] rounded-full bg-[conic-gradient(from_200deg,#3c7bff,#a33cf2,#ff4f8b,#3c7bff)] p-[3px]">
          <span className="block h-full w-full rounded-full" style={{ background: C.incoming }} />
        </span>
        Ask Meta AI or Search
      </div>

      <div className="mt-3 flex gap-3 px-4">
        <Note img="foundcoffee" label="Your note" note="new oat flat white ☕" own />
        <Note img="ana" label="Ana" note="🎧 Fado night" />
        <Note img="nata" label="Nata Lab" note="fresh batch 6pm" />
        <Note img="joao" label="João" />
      </div>

      <div className="mt-3 flex items-center justify-between px-4">
        <span className="text-[16px] font-bold">Messages</span>
        <span className="text-[14px] font-semibold text-[#0095f6]">Requests (3)</span>
      </div>

      <div className="mt-1">
        <Arriving show={view.nextDm}>
          <Row img="clara" name="Clara Mendes" preview="Hi! I'd love to feature your pastries 🥐" time="now" unread />
        </Arriving>
        <Arriving show={view.newRow}>
          {view.miaAnswered ? (
            <Row img="mia" name="Mia Duarte" preview={THANKS} time="now" />
          ) : (
            <Row img="mia" name="Mia Duarte" preview="hiii!! obsessed with your place 😍…" time="now" unread pressed={view.pressed} />
          )}
        </Arriving>
        {ROWS.map((r) => (
          <Row key={r.name} {...r} />
        ))}
      </div>
    </div>
  );
}

function Arriving({ show, children }: { show: boolean; children: React.ReactNode }) {
  return (
    <motion.div
      initial={false}
      animate={{ height: show ? 70 : 0, opacity: show ? 1 : 0 }}
      transition={{ duration: 0.55, ease: IOS_EASE }}
      className="overflow-hidden"
    >
      {children}
    </motion.div>
  );
}

function Note({ img, label, note, own }: { img: string; label: string; note?: string; own?: boolean }) {
  return (
    <div className="relative flex w-[78px] flex-col items-center pt-[28px]">
      {note && (
        <div className="absolute left-1/2 top-0 z-10 max-w-[90px] -translate-x-1/2 rounded-[14px] bg-white px-2.5 py-1.5 text-center text-[11px] leading-[1.2] shadow-[0_1px_6px_rgba(0,0,0,0.14)]">
          <span className="line-clamp-2">{note}</span>
        </div>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/img/ig/${img}.jpg`} alt="" className="h-[68px] w-[68px] rounded-full object-cover" />
      {own && (
        <span className="absolute bottom-[18px] right-[5px] grid h-5 w-5 place-items-center rounded-full border-2 border-white bg-[#0095f6] text-[14px] font-bold leading-none text-white">+</span>
      )}
      <span className="mt-1.5 max-w-full truncate text-[12px]" style={{ color: C.grey }}>{label}</span>
    </div>
  );
}

function Row({ img, name, preview, time, unread, pressed }: { img: string; name: string; preview: string; time: string; unread?: boolean; pressed?: boolean }) {
  return (
    <div className="flex h-[70px] items-center gap-3 px-4 transition-colors duration-200" style={{ background: pressed ? C.incoming : "transparent" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/img/ig/${img}.jpg`} alt="" className="h-[54px] w-[54px] shrink-0 rounded-full object-cover" />
      <div className="min-w-0 flex-1 leading-[1.3]">
        <div className={`truncate text-[14px] ${unread ? "font-bold" : ""}`}>{name}</div>
        <div className={`truncate text-[14px] tracking-[-0.14px] ${unread ? "font-semibold" : ""}`} style={{ color: unread ? C.ink : C.grey }}>
          {preview} <span className="font-normal" style={{ color: C.grey }}>· {time}</span>
        </div>
      </div>
      {unread ? (
        <span className="h-2 w-2 shrink-0 rounded-full bg-[#0095f6]" />
      ) : (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.grey} strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true"><path d="M3 8.5A2.5 2.5 0 0 1 5.5 6H7l1.5-2h7L17 6h1.5A2.5 2.5 0 0 1 21 8.5v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z" /><circle cx="12" cy="13" r="3.8" /></svg>
      )}
    </div>
  );
}

/* ---------- Instagram thread (Figma: IG UI 519:4568 + 516:2440) ---------- */

function Thread({ state }: { state: State }) {
  const msgs = state.msgs;
  return (
    <div className="absolute inset-0" style={{ color: C.ink }}>
      {/* white behind the status bar, so content that scrolls up stays hidden */}
      <div className="absolute inset-x-0 top-0 z-10 h-[54px] bg-white" />

      {/* header: Figma 519:4610 */}
      <div className="absolute left-0 top-[54px] z-10 h-[45px] w-full overflow-hidden bg-white" style={{ borderBottom: `0.5px solid ${C.hairline}` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${UI}/back.svg`} alt="" width={24} height={24} className="absolute left-[20px] top-[6.25px]" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/ig/mia.jpg" alt="" className="absolute left-[58px] top-[2.79px] h-[31px] w-[31px] rounded-full object-cover" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${UI}/online-dot.svg`} alt="" width={15} height={15} className="absolute left-[76.72px] top-[22.04px]" />
        <div className="absolute left-[95.58px] top-[2.18px] flex h-[18px] items-center gap-[4px] p-[3px]">
          <span className="text-[15px] font-bold tracking-[-0.1px]" style={{ color: C.headerGrey }}>Mia Duarte</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${UI}/chevron-right.svg`} alt="" width={10} height={10} />
        </div>
        <span className="absolute left-[98.19px] top-[21.94px] text-[12px] tracking-[-0.18px]" style={{ color: C.headerGrey }}>Active now</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${UI}/add-people.svg`} alt="" width={24} height={24} className="absolute left-[251px] top-[6.25px]" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${UI}/call.svg`} alt="" width={24} height={24} className="absolute left-[291px] top-[6.25px]" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${UI}/video.svg`} alt="" width={24} height={24} className="absolute left-[331px] top-[6.25px]" />
      </div>

      {/* messages + composer ride on top of the keyboard */}
      <motion.div
        className="absolute inset-x-0 top-[99px] flex flex-col"
        initial={false}
        animate={{ bottom: state.kb ? KB_BOTTOM : REST_BOTTOM }}
        transition={{ duration: 0.42, ease: KB_EASE }}
      >
        <div className="relative min-h-0 flex-1 overflow-hidden">
          <div className="absolute inset-x-0 bottom-0 flex flex-col pb-[10px]">
            {/* profile card: Figma 516:2478 */}
            <motion.div layout="position" transition={SOFT} className="mx-auto flex w-[265px] flex-col items-center gap-[8px] pb-[28px] pt-[35px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/img/ig/mia.jpg" alt="" className="h-[80px] w-[80px] rounded-full object-cover" />
              <div className="flex w-full flex-col items-center gap-[16px]">
                <div className="flex w-full flex-col items-center gap-[8px] text-center">
                  <span className="text-[18px] font-bold tracking-[-1px]">Mia Duarte</span>
                  <div className="flex flex-col gap-[3px] text-[14px] tracking-[-0.14px]" style={{ color: C.grey }}>
                    <span>mia.eats.lisbon</span>
                    <span>24.1K followers · 318 posts</span>
                    <span>You don&rsquo;t follow each other on Instagram</span>
                  </div>
                </div>
                <span className="flex h-[27px] w-[97px] items-center justify-center rounded-[6px] text-[12px] font-semibold tracking-[0.096px]" style={{ background: C.incoming }}>
                  View profile
                </span>
              </div>
            </motion.div>

            <motion.p layout="position" transition={SOFT} className="pb-[16px] text-center text-[10px] uppercase" style={{ color: C.stamp }}>
              Today at 9:38
            </motion.p>

            <AnimatePresence initial={false}>
              {msgs.map((m, i) => {
                const next = msgs[i + 1];
                const lastOfGroup = (!next || next.from !== m.from) && !(m.from === "them" && state.typing && i === msgs.length - 1);
                const gapTop = i === 0 ? 0 : msgs[i - 1].from === m.from ? 4 : 10;
                return <Bubble key={m.id} m={m} showAvatar={lastOfGroup} gapTop={gapTop} seen={state.seen && i === msgs.length - 1 && m.from === "me"} />;
              })}
            </AnimatePresence>
            {state.typing && (
              <motion.div
                layout="position"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={SOFT}
                className="ml-[15px] mt-[10px] flex items-end gap-[10px]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/img/ig/mia.jpg" alt="" className="h-[24px] w-[24px] rounded-full object-cover" />
                <div className="flex items-center gap-[5px] rounded-[16px] px-[14px] py-[14px]" style={{ background: C.incoming }}>
                  {[0, 1, 2].map((d) => (
                    <span key={d} className="typing-dot block h-[7px] w-[7px] rounded-full bg-[#8e8e8e]" />
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>

        <Composer state={state} />
      </motion.div>

      {/* keyboard */}
      <motion.div
        className="absolute inset-x-0 bottom-0 z-20"
        style={{ height: KB_H }}
        initial={false}
        animate={{ y: state.kb ? 0 : KB_H }}
        transition={{ duration: 0.42, ease: KB_EASE }}
      >
        <Keyboard />
      </motion.div>
    </div>
  );
}

/* composer: Figma 519:4577; grows upward when text is pasted, icons stay pinned to the bottom */
function Composer({ state }: { state: State }) {
  const typed = state.typed;
  const brand = usePhoneBrand();
  return (
    <div className="relative mx-auto mt-[0px] w-[359px] shrink-0">
      {/* iOS edit menu */}
      <AnimatePresence>
        {state.menu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            transition={{ duration: 0.22, ease: IOS_EASE }}
            className="absolute bottom-[52px] left-[74px] z-10 flex items-center overflow-visible rounded-[10px] bg-white text-[15px] text-black shadow-[0_6px_24px_rgba(0,0,0,0.18),0_0_0_0.5px_rgba(0,0,0,0.06)]"
          >
            <span className="px-[14px] py-[9px]">Paste</span>
            <span className="h-[22px] w-px bg-black/15" />
            <span className="px-[14px] py-[9px]">AutoFill</span>
            <span className="h-[22px] w-px bg-black/15" />
            <span className="px-[10px] py-[9px] text-black/50">›</span>
            <span className="absolute -bottom-[5px] left-[34px] h-[10px] w-[10px] rotate-45 bg-white shadow-[2px_2px_3px_rgba(0,0,0,0.06)]" />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="relative overflow-hidden rounded-[22px] bg-[#f6f6f7]"
        initial={false}
        animate={{ height: typed ? PILL_MAX : PILL_MIN }}
        transition={{ duration: 0.3, ease: IOS_EASE }}
      >
        {/* left: camera button (idle) or plain purple search (typing) */}
        <div className="absolute bottom-[4px] left-[4px] h-[34px] w-[34px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${UI}/camera-button.svg`}
            alt=""
            width={34}
            height={34}
            className={`absolute inset-0 transition-[opacity,transform] duration-200 ${typed ? "scale-75 opacity-0" : "scale-100 opacity-100"}`}
          />
          <svg
            width="34"
            height="34"
            viewBox="0 0 34 34"
            fill="none"
            aria-hidden="true"
            className={`absolute inset-0 transition-[opacity,transform] duration-200 ${typed ? "scale-100 opacity-100" : "scale-75 opacity-0"}`}
          >
            <circle cx="15.5" cy="15.5" r="7" stroke={C.outgoing} strokeWidth="2.2" />
            <path d="m20.6 20.6 5.2 5.2" stroke={C.outgoing} strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </div>

        {/* text */}
        <div className="absolute bottom-[12px] left-[48px] right-[52px] text-[14px] leading-[18px] tracking-[0.21px]">
          {typed ? (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="line-clamp-4 block" style={{ color: C.ink }}>
              {reply(brand.handle)}
              <span className="caret ml-[1px] inline-block h-[16px] w-[2px] translate-y-[3px] rounded-full" style={{ background: C.outgoing }} />
            </motion.span>
          ) : (
            <span className="flex items-center" style={{ color: C.placeholder }}>
              {state.kb && <span className="caret mr-[1px] inline-block h-[18px] w-[2px] rounded-full" style={{ background: C.outgoing }} />}
              Message...
            </span>
          )}
        </div>

        {/* right: mic / photo / stickers / plus (idle) or purple send (typing) */}
        <div className={`absolute bottom-[9px] right-[18px] h-[24px] w-[138px] transition-opacity duration-200 ${typed ? "opacity-0" : "opacity-100"}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${UI}/mic.svg`} alt="" width={24} height={24} className="absolute left-0 top-0" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${UI}/photo.svg`} alt="" width={24} height={24} className="absolute left-[37px] top-0" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${UI}/stickers.svg`} alt="" width={24} height={24} className="absolute left-[76px] top-0" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${UI}/plus.svg`} alt="" width={24} height={24} className="absolute left-[114px] top-0" />
        </div>
        <span
          className={`absolute bottom-[4px] right-[4px] grid h-[34px] w-[44px] place-items-center rounded-full transition-[opacity,transform] duration-200 ${typed ? "scale-100 opacity-100" : "scale-75 opacity-0"}`}
          style={{ background: C.outgoing }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21 3 10.2 13.8M21 3l-6.6 18-4.2-7.2L3 9.6z" stroke="#fff" strokeWidth="2.1" strokeLinejoin="round" strokeLinecap="round" /></svg>
        </span>
      </motion.div>
    </div>
  );
}

function Bubble({ m, showAvatar, gapTop, seen }: { m: Msg; showAvatar: boolean; gapTop: number; seen: boolean }) {
  const me = m.from === "me";
  const brand = usePhoneBrand();
  const short = m.text.length < 28;

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: me ? 36 : 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SOFT}
      className={`flex flex-col ${me ? "items-end pr-[8px]" : "items-start pl-[15px]"}`}
      style={{ marginTop: gapTop }}
    >
      {me ? (
        <div className={`w-fit max-w-[261px] px-[12px] py-[10px] text-[14px] leading-[1.25] tracking-[-0.3px] text-white ${short ? "rounded-[88px]" : "rounded-[14px]"}`} style={{ background: C.outgoing }}>
          {m.text}
        </div>
      ) : (
        <div className="flex items-end gap-[10px]">
          <span className="h-[24px] w-[24px] shrink-0">
            {showAvatar && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src="/img/ig/mia.jpg" alt="" className="h-[24px] w-[24px] rounded-full object-cover" />
            )}
          </span>
          <div className={`max-w-[255px] py-[10px] pl-[10px] pr-[11px] text-[14px] leading-[1.25] tracking-[-0.3px] ${short ? "rounded-[88px] px-[12px]" : "rounded-[16px]"}`} style={{ background: C.incoming, color: C.bubbleText }}>
            {m.text}
          </div>
        </div>
      )}

      {m.link && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SOFT, delay: 0.3 }}
          className="mt-[4px] w-[230px] overflow-hidden rounded-[14px] bg-white"
          style={{ border: `1px solid ${C.hairline}` }}
        >
          <div className="relative flex h-[110px] flex-col justify-end bg-[linear-gradient(130deg,#4daeff_0%,#749bff_25%,#cba0f6_50%,#e9a8b1_70%,#fbb647_100%)] p-3">
            <BrandIcon size={28} className="absolute left-3 top-3" />
            <div className="text-[21px] font-bold leading-[1.05] tracking-[-0.03em] text-white">
              Collab with
              <br />
              <span className="line-clamp-1">{brand.name}</span>
            </div>
          </div>
          <div className="px-3 py-2 leading-[1.25]">
            <div className="truncate text-[13px] font-semibold">Collab with {brand.name}</div>
            <div className="text-[12px]" style={{ color: C.grey }}>benable.com</div>
          </div>
        </motion.div>
      )}

      {/* "Seen" keeps its space reserved so the list never jumps */}
      {me && (
        <span className={`mr-[4px] mt-[4px] h-[14px] text-[11px] transition-opacity duration-300 ${seen ? "opacity-100" : "opacity-0"}`} style={{ color: C.stamp }}>
          Seen
        </span>
      )}
    </motion.div>
  );
}
