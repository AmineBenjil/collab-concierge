"use client";

/*
  Creators: event photos that fan out from a stack on their own the first time the section scrolls
  into view, while the centre heading counts up to 1,000,000+ creators in step with the spread.
  It plays once and stays open; scrolling back up never folds it again.
  Ported from Hyperiux Vault's "stack-spread" (vault.hyperiux.com). The mechanism and every number
  (positions, angles, scales, parallax) are the original's; only the photos, copy,
  colours and card radius are ours, and the "Scroll" hint is dropped.
  The previous Creators (chart) and Community sections are kept in ./archive.
*/

import {
  animate,
  motion,
  useTransform,
  useReducedMotion,
  useMotionValue,
  useSpring,
  useMotionValueEvent,
  useInView,
  type MotionValue,
} from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";

const IMG = "/img/events";

// per-image rest scale, keyed by slot (1 = front of the stack, 8 = back). default 1, drop below to shrink.
// The four biggest cards (slots 3, 5, 6, 7) are 20% under their original 0.9 / 0.8.
const SCALE: Partial<Record<number, number>> = {
  1: 0.9,
  2: 0.8,
  3: 0.72,
  4: 0.8,
  5: 0.64,
  6: 0.72,
  7: 0.72,
  8: 0.7,
};
const s = (i: number) => SCALE[i] ?? 1;

// array order = stack order, back (z 2) -> front (z 9). Each slot starts on its first photo; all the photos
// together form one pool that the slots draw new cards from once the stack has spread (see ROTATE_MS).
const CARDS: StackSpreadCard[] = [
  // top-left — sm row 1 left
  {
    items: [
      { src: `${IMG}/kc-lineup.jpg`, alt: "Eight creators lined up in front of a mural at a Benable event in Kansas City", position: "50% 40%" },
      { src: `${IMG}/vancouver-toast.jpg`, alt: "Three creators raising a toast at a table in Vancouver", position: "50% 35%" },
    ],
    stackOffset: { x: -8, y: -10 },
    stackRotate: -18,
    target: { x: -20, y: -34, rotate: 0, scale: s(8), w: 17, h: 22 },
    targetSm: { x: -22, y: -40 },
    z: 2,
  },
  // top-right — sm row 1 right
  {
    items: [
      { src: `${IMG}/austin-bags-trio.jpg`, alt: "Three creators holding Benable gift bags in Austin", position: "50% 40%" },
      { src: `${IMG}/kc-duo.jpg`, alt: "Two creators posing together among Benable gift bags", position: "50% 30%" },
    ],
    stackOffset: { x: 14, y: -10 },
    stackRotate: 20,
    target: { x: 32, y: -30, rotate: 0, scale: s(7), w: 18, h: 32 },
    targetSm: { x: 22, y: -40 },
    z: 3,
  },
  // mid-left — sm row 2 left
  {
    items: [
      { src: `${IMG}/bag-pyramid.jpg`, alt: "Two creators stacking Benable gift bags into a pyramid" },
      { src: `${IMG}/kc-bag-smile.jpg`, alt: "A creator smiling with her Benable gift bag", position: "50% 30%" },
    ],
    stackOffset: { x: -16, y: 0 },
    stackRotate: -4,
    target: { x: -36, y: -2, rotate: 0, scale: s(6), w: 15, h: 32 },
    targetSm: { x: -22, y: -23 },
    z: 4,
  },
  // top-centre — sm row 2 right
  {
    items: [
      { src: `${IMG}/bar-group.jpg`, alt: "Five creators posing together at a launch night", position: "50% 30%" },
      { src: `${IMG}/vancouver-bag-wall.jpg`, alt: "Three creators posing in front of a wall of Benable gift bags in Vancouver", position: "50% 30%" },
    ],
    stackOffset: { x: 1, y: -10 },
    stackRotate: -2,
    target: { x: 6, y: -32, rotate: 0, scale: s(5), w: 25, h: 30 },
    targetSm: { x: 22, y: -23 },
    z: 5,
  },
  // mid-right — sm row 3 left
  {
    items: [
      { src: `${IMG}/austin-bags-checker.jpg`, alt: "Three creators with Benable gift bags on a checkered floor in Austin", position: "50% 35%" },
      { src: `${IMG}/kc-bag-trio.jpg`, alt: "Three creators in sunglasses holding a Benable gift bag", position: "50% 35%" },
    ],
    stackOffset: { x: 18, y: 1 },
    stackRotate: 6,
    target: { x: 37, y: 6, rotate: 0, scale: s(4), w: 18, h: 32 },
    targetSm: { x: -22, y: 24 },
    z: 6,
  },
  // bottom-left — sm row 3 right
  {
    items: [
      { src: `${IMG}/kc-group-bags.jpg`, alt: "A group of creators holding up Benable gift bags on a string-lit patio", position: "50% 55%" },
      { src: `${IMG}/austin-duo.jpg`, alt: "Two creators with drinks at a Benable event in Austin", position: "50% 30%" },
    ],
    stackOffset: { x: -6, y: 10 },
    stackRotate: 6,
    target: { x: -24, y: 34, rotate: 0, scale: s(3), w: 22, h: 25 },
    targetSm: { x: 22, y: 24 },
    z: 7,
  },
  // bottom-centre — sm row 4 left
  {
    items: [
      { src: `${IMG}/bag-trio.jpg`, alt: "Three creators holding drinks and a Benable gift bag", position: "50% 35%" },
      { src: `${IMG}/vancouver-stage.jpg`, alt: "Five creators on a small stage holding Benable gift bags in Vancouver", position: "50% 45%" },
    ],
    stackOffset: { x: 8, y: 7 },
    stackRotate: 3,
    target: { x: 2, y: 36, rotate: 0, scale: s(2), w: 20, h: 26 },
    targetSm: { x: -22, y: 40 },
    z: 8,
  },
  // bottom-right — sm row 4 right
  {
    items: [
      { src: `${IMG}/vineyard.jpg`, alt: "Three creators holding Benable gift bags in a vineyard", position: "50% 55%" },
      { src: `${IMG}/austin-crafting.jpg`, alt: "Creators making jewelry at a Benable workshop in Austin", position: "50% 45%" },
    ],
    stackOffset: { x: 20, y: 12 },
    stackRotate: -7,
    target: { x: 30, y: 34, rotate: 0, scale: s(1), w: 16, h: 20 },
    targetSm: { x: 22, y: 40 },
    z: 9,
  },
];

// ---------------------------------------------------------------------------
// Mechanism
// ---------------------------------------------------------------------------

// once spread, every ROTATE_MS one card fades out and a new photo from the pool fades in nearby, at a
// slightly different spot and size. Slots go in ROTATE_ORDER so neighbours never change back to back.
const ROTATE_MS = 4000;
const FADE_MS = 1400;
const ROTATE_ORDER = [3, 0, 6, 1, 5, 2, 7, 4];
// how far a new card may sit from its slot (vw / vh) and how much it may grow or shrink (its shape never changes)
const JITTER_X = 3.5;
const JITTER_Y = 3.5;
const SIZE_MIN = 0.85;
const SIZE_MAX = 1.15;

/*
  Card sizes are designed on a 1440 x 900 screen, where 1vw and 1.6vh are the same 14.4px. Each card keeps
  that shape (its aspect ratio) at every size, and its width is the smaller of w vw and w * 1.6 vh, so a
  tall screen and a short wide one both scale the card down instead of stretching it.
*/
const VH_PER_VW = 1.6;

/** what a slot is showing right now: its photo, where it sits relative to the slot, and whether it's fading out */
interface Slot {
  item: StackSpreadItem;
  dx: number;
  dy: number;
  /** size multiplier for this photo */
  size: number;
  out: boolean;
}

const rand = (min: number, max: number) => min + Math.random() * (max - min);

// how long the stack takes to spread once it's in view, and how much of the section must show first
const SPREAD_S = 2.6;
const SPREAD_EASE = [0.65, 0, 0.35, 1] as const;
const TRIGGER_AMOUNT = 0.5;

const PARALLAX_X = 2.6;
const PARALLAX_Y = 2.2;
const PARALLAX_SPRING = { stiffness: 90, damping: 22, mass: 0.6 };
const parallaxDepth = (i: number, total: number) => (total <= 1 ? 1 : 0.55 + (i / (total - 1)) * 0.75);

const SUB = "Our analysis is based on billions of data points from over 1,000,000 creators.";

const FROM = 800_000;
const TO = 1_000_000;
const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

/* the headline number climbs from 800,000 to 1,000,000+ as the photos spread, tied to scroll */
function CountUp({ progress, start, reduce }: { progress: MotionValue<number>; start: number; reduce: boolean | null }) {
  const count = useTransform(progress, [start, 1], [FROM, TO]);
  const [n, setN] = useState(() => count.get());
  useMotionValueEvent(count, "change", setN);
  const shown = reduce === true ? TO : n;
  return (
    <span className="tabular-nums">
      <span className="sr-only">1,000,000+</span>
      {/* the final figure holds the width, so the heading doesn't reflow while it counts */}
      <span aria-hidden="true" className="inline-grid justify-items-center">
        <span className="invisible col-start-1 row-start-1">{fmt(TO)}+</span>
        <span className="grad-text col-start-1 row-start-1">
          {fmt(shown)}
          {shown >= TO ? "+" : ""}
        </span>
      </span>
    </span>
  );
}

const RESPONSIVE = {
  desktop: {
    scale: null as number | null,
    small: false,
    colX: null as number | null,
    card: null as { w: number } | null,
  },
  small: {
    scale: 0.72,
    small: true,
    colX: 22,
    card: { w: 30 },
  },
};

function useResponsive() {
  const [r, setR] = useState(RESPONSIVE.desktop);
  useEffect(() => {
    // Touch devices and phone-width windows drop to the stacked column layout; anything wider with a
    // mouse keeps the desktop scatter + pointer parallax.
    const mq = window.matchMedia("(pointer: coarse), (max-width: 639px)");
    const read = () => setR(mq.matches ? RESPONSIVE.small : RESPONSIVE.desktop);
    read();
    mq.addEventListener("change", read);
    return () => mq.removeEventListener("change", read);
  }, []);
  return r;
}

function usePointerParallax(active: boolean, enabled: boolean) {
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, PARALLAX_SPRING);
  const y = useSpring(rawY, PARALLAX_SPRING);

  useEffect(() => {
    if (!enabled) return;

    if (!active) {
      rawX.set(0);
      rawY.set(0);
      return;
    }

    const onMove = (event: PointerEvent) => {
      rawX.set((event.clientX / window.innerWidth) * 2 - 1);
      rawY.set((event.clientY / window.innerHeight) * 2 - 1);
    };
    const onLeave = () => {
      rawX.set(0);
      rawY.set(0);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, [active, enabled, rawX, rawY]);

  return { x, y };
}

interface StackSpreadItem {
  src: string;
  alt?: string;
  /** object-position, to keep faces in frame when a photo is cropped to its card */
  position?: string;
}

interface StackSpreadTarget {
  x: number;
  y: number;
  rotate: number;
  scale?: number;
  w: number;
  h: number;
}

interface StackSpreadCard {
  /** the first shows here at the start; all of them join the shared pool */
  items: StackSpreadItem[];
  target: StackSpreadTarget;
  /** final x/y (vw/vh) for tablet + mobile; falls back to `target` */
  targetSm?: { x: number; y: number };
  /** angle while clustered */
  stackRotate?: number;
  /** offset while clustered (vw/vh) */
  stackOffset?: { x: number; y: number };
  /** paint order, higher on top */
  z?: number;
}

function Card({
  card,
  progress,
  reduce,
  clusterRotation,
  scaleMul,
  isSmall,
  colX,
  fixedCard,
  stackScale,
  cardRadius,
  pointer,
  depth,
  slot,
}: {
  card: StackSpreadCard;
  progress: MotionValue<number>;
  reduce: boolean | null;
  clusterRotation: boolean;
  /** uniform rest-scale for every card; null = use each card's own scale */
  scaleMul: number | null;
  isSmall: boolean;
  colX: number | null;
  /** one width (vw) for every card on phones; each card still keeps its own shape */
  fixedCard: { w: number } | null;
  /** scale of the cards while clustered, before the scatter */
  stackScale: number;
  /** corner radius on each card, in px (desktop) */
  cardRadius: number;
  pointer: { x: MotionValue<number>; y: MotionValue<number> };
  depth: number;
  slot: Slot;
}) {
  const { target } = card;

  const flat = reduce === true;
  const stackRotate = flat ? 0 : clusterRotation ? (card.stackRotate ?? 0) : 0;
  const stackOffset = card.stackOffset ?? { x: 0, y: 0 };
  const restScale = scaleMul ?? target.scale ?? 1;

  // final resting spot: column grid on small screens, scatter on desktop
  const sm = isSmall && card.targetSm ? card.targetSm : null;
  const endX = sm ? (colX != null ? Math.sign(sm.x) * colX : sm.x) : target.x;
  const endY = sm ? sm.y : target.y;
  const endRotate = flat || isSmall ? 0 : target.rotate;

  // where the current photo sits relative to the slot; it only moves while the card is faded out
  const offX = useMotionValue(slot.dx);
  const offY = useMotionValue(slot.dy);
  useEffect(() => {
    offX.set(slot.dx);
    offY.set(slot.dy);
  }, [slot.dx, slot.dy, offX, offY]);

  // -50% keeps card centred on its anchor
  const translate = useTransform([progress, pointer.x, pointer.y, offX, offY], ([p, px, py, ox, oy]: number[]) => {
    const tx = stackOffset.x + (endX + ox - stackOffset.x) * p;
    const ty = stackOffset.y + (endY + oy - stackOffset.y) * p;
    const drift = depth * p;
    const dx = tx - px * PARALLAX_X * drift;
    const dy = ty - py * PARALLAX_Y * drift;
    return `calc(-50% + ${dx}vw) calc(-50% + ${dy}vh)`;
  });
  const rotate = useTransform(progress, [0, 1], [stackRotate, endRotate]);
  const scale = useTransform(progress, [0, 1], [stackScale, restScale]);

  return (
    <motion.div
      className="absolute left-1/2 top-1/2 will-change-transform"
      style={{
        width: fixedCard ? `${fixedCard.w * slot.size}vw` : `min(${target.w * slot.size}vw, ${target.w * VH_PER_VW * slot.size}vh)`,
        aspectRatio: (target.w * VH_PER_VW) / target.h,
        zIndex: card.z ?? 1,
        translate,
        rotate,
        scale,
      }}
    >
      <motion.div
        className="h-full w-full"
        initial={false}
        animate={slot.out ? { opacity: 0, scale: 0.94 } : { opacity: 1, scale: 1 }}
        transition={{ duration: FADE_MS / 1000, ease: "easeInOut" }}
      >
        <CardFace item={slot.item} cardRadius={cardRadius} border={2 / restScale} />
      </motion.div>
    </motion.div>
  );
}

// a white frame and a soft shadow; the frame is sized against the card's scale so it lands at 2px on screen
function CardFace({ item, cardRadius, border }: { item: StackSpreadItem; cardRadius: number; border: number }) {
  return (
    <div
      className="relative h-full w-full overflow-hidden border-solid border-white bg-white shadow-[0_10px_28px_-14px_rgba(22,26,53,0.28)] max-md:rounded-[4vw]"
      style={{ borderRadius: `${cardRadius}px`, borderWidth: border }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.src}
        alt={item.alt ?? ""}
        draggable={false}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: item.position }}
      />
    </div>
  );
}

interface StackSpreadStageProps {
  cards: StackSpreadCard[];
  bgColor?: string;
  /** fan the clustered stack (default) or start flat */
  clusterRotation?: boolean;
  /** scale of the cards while clustered, before the scatter */
  stackScale?: number;
  /** corner radius on each card, in px (desktop only — mobile keeps its responsive radius) */
  cardRadius?: number;
  /** spread progress (0-1) where the centre text starts fading in */
  textFadeStart?: number;
}

function StackSpreadStage({
  cards,
  bgColor = "#ffffff",
  clusterRotation = true,
  stackScale = 0.82,
  cardRadius = 20,
  textFadeStart = 0.3,
}: StackSpreadStageProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scale: scaleMul, small: isSmall, colX, card: fixedCard } = useResponsive();

  // the spread runs on its own once, the first time the section is half on screen, and stays open
  const progress = useMotionValue(0);
  const triggered = useInView(wrapRef, { once: true, amount: TRIGGER_AMOUNT });
  useEffect(() => {
    if (!triggered) return;
    const a = animate(progress, 1, { duration: reduce === true ? 0 : SPREAD_S, ease: SPREAD_EASE });
    return () => a.stop();
  }, [triggered, reduce, progress]);

  // centre text fades in with the spread; the scale-in is dropped only when
  // reduced motion is confirmed (`true`), not on the null SSR value.
  const [spread, setSpread] = useState(false);
  useMotionValueEvent(progress, "change", (p) => {
    if (p >= 0.999) setSpread(true);
  });
  const parallaxEnabled = reduce !== true && !isSmall;
  const pointer = usePointerParallax(spread, parallaxEnabled);

  // once spread and on screen, one card at a time fades out and a new photo from the pool fades in nearby
  const onScreen = useInView(wrapRef, { margin: "-20% 0px" });
  const pool = useMemo(() => cards.flatMap((c) => c.items), [cards]);
  const [slots, setSlots] = useState<Slot[]>(() => cards.map((c) => ({ item: c.items[0], dx: 0, dy: 0, size: 1, out: false })));
  const live = useRef(slots);
  useEffect(() => {
    live.current = slots;
  });
  const next = useRef(0);
  useEffect(() => {
    if (!spread || !onScreen || reduce === true) return;
    let turn = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const t = setInterval(() => {
      const k = ROTATE_ORDER[turn++ % ROTATE_ORDER.length] % cards.length;
      setSlots((all) => all.map((sl, i) => (i === k ? { ...sl, out: true } : sl)));
      timers.push(
        setTimeout(() => {
          // the next photo in the pool that isn't already on screen
          const showing = new Set(live.current.map((sl) => sl.item.src));
          let item = pool[next.current % pool.length];
          for (let n = 0; n < pool.length && showing.has(item.src); n++) item = pool[++next.current % pool.length];
          next.current++;
          // a new spot near the slot, clearly apart from the last one; phones keep their column grid
          const cur = live.current[k];
          let dx = 0;
          let dy = 0;
          if (!isSmall) {
            for (let n = 0; n < 8; n++) {
              dx = rand(-JITTER_X, JITTER_X);
              dy = rand(-JITTER_Y, JITTER_Y);
              if (Math.abs(dx - cur.dx) + Math.abs(dy - cur.dy) > 3) break;
            }
          }
          const size = isSmall ? 1 : rand(SIZE_MIN, SIZE_MAX);
          setSlots((all) => all.map((sl, i) => (i === k ? { item, dx, dy, size, out: false } : sl)));
        }, FADE_MS)
      );
    }, ROTATE_MS);
    return () => {
      clearInterval(t);
      timers.forEach(clearTimeout);
    };
  }, [spread, onScreen, reduce, cards, pool, isSmall]);

  const noScale = reduce === true;
  const copyOpacity = useTransform(progress, [textFadeStart, textFadeStart + 0.35], [0, 1]);
  const copyScale = useTransform(progress, [textFadeStart, 0.9], [0.85, 1]);


  return (
    <section id="creators" ref={wrapRef} className="relative w-full" style={{ backgroundColor: bgColor }}>
      <div className="relative h-screen w-full overflow-hidden">
        {/* centre text */}
        <motion.div
          className="pointer-events-none absolute inset-0 z-[5] flex flex-col items-center justify-center px-6 text-center max-md:px-8"
          style={{
            opacity: copyOpacity,
            scale: noScale ? 1 : copyScale,
          }}
        >
          {/* same label, heading and subtext styles as every other section head (see SectionHead) */}
          {/* phones: the rows of photos leave less room in the middle, so the pill drops and the gaps tighten */}
          <span className="pill-label max-md:!hidden">Our creators</span>
          {/* the heading sets the block's width; the subtext fills exactly that width */}
          <div className="inline-flex flex-col items-center">
            <h2 className="section-title mt-6 max-md:mt-0">
              Over <CountUp progress={progress} start={textFadeStart} reduce={reduce} /> creators
              <br />
              already assessed.
            </h2>
            <p className="section-sub mt-6 w-0 min-w-full !max-w-none max-md:mt-3">{SUB}</p>
          </div>
        </motion.div>

        {/* scattering cards */}
        <div className="absolute inset-0 z-10">
          {cards.map((card, i) => (
            <Card
              key={i}
              card={card}
              progress={progress}
              reduce={reduce}
              clusterRotation={clusterRotation}
              scaleMul={scaleMul}
              isSmall={isSmall}
              colX={colX}
              fixedCard={fixedCard}
              stackScale={stackScale}
              cardRadius={cardRadius}
              pointer={pointer}
              depth={parallaxEnabled ? parallaxDepth(i, cards.length) : 0}
              slot={slots[i]}
            />
          ))}
        </div>

      </div>
    </section>
  );
}

export default function Creators() {
  return <StackSpreadStage cards={CARDS} />;
}
