"use client";

/*
  Community: event photos that fan out from a stack as you scroll.
  Ported from Hyperiux Vault's "stack-spread" (vault.hyperiux.com). The mechanism and every number
  (positions, angles, scales, scroll ranges, parallax) are the original's; only the photos, copy,
  colours and card radius are ours, and the "Scroll" hint is dropped.
*/

import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  useMotionValue,
  useSpring,
  useMotionValueEvent,
  type MotionValue,
} from "motion/react";
import { useEffect, useRef, useState } from "react";

const IMG = "/img/events";

// per-image rest scale, keyed by slot (1 = front of the stack, 8 = back). default 1, drop below to shrink.
const SCALE: Partial<Record<number, number>> = {
  1: 0.9,
  2: 0.8,
  3: 0.9,
  4: 0.8,
  5: 0.8,
  6: 0.9,
  7: 0.9,
  8: 0.7,
};
const s = (i: number) => SCALE[i] ?? 1;

// array order = stack order, back (z 2) -> front (z 9). The two Benable-bag shots sit on top of the stack.
const CARDS: StackSpreadCard[] = [
  // top-left — sm row 1 left
  {
    item: { src: `${IMG}/boat-flag.jpg`, alt: "Creators chatting on the deck under a Benable flag", position: "50% 25%" },
    stackOffset: { x: -8, y: -10 },
    stackRotate: -18,
    target: { x: -20, y: -34, rotate: 0, scale: s(8), w: 17, h: 22 },
    targetSm: { x: -22, y: -40 },
    z: 2,
  },
  // top-right — sm row 1 right
  {
    item: { src: `${IMG}/boat-banner.jpg`, alt: "Two creators on a boat in front of the Benable banner", position: "50% 30%" },
    stackOffset: { x: 14, y: -10 },
    stackRotate: 20,
    target: { x: 32, y: -30, rotate: 0, scale: s(7), w: 18, h: 32 },
    targetSm: { x: 22, y: -40 },
    z: 3,
  },
  // mid-left — sm row 2 left
  {
    item: { src: `${IMG}/bag-pyramid.jpg`, alt: "Two creators stacking Benable gift bags into a pyramid" },
    stackOffset: { x: -16, y: 0 },
    stackRotate: -4,
    target: { x: -36, y: -2, rotate: 0, scale: s(6), w: 15, h: 32 },
    targetSm: { x: -22, y: -19 },
    z: 4,
  },
  // top-centre — sm row 2 right
  {
    item: { src: `${IMG}/bar-group.jpg`, alt: "Five creators posing together at a launch night", position: "50% 30%" },
    stackOffset: { x: 1, y: -10 },
    stackRotate: -2,
    target: { x: 6, y: -32, rotate: 0, scale: s(5), w: 25, h: 30 },
    targetSm: { x: 22, y: -19 },
    z: 5,
  },
  // mid-right — sm row 3 left
  {
    item: { src: `${IMG}/boat-duo.jpg`, alt: "Two creators taking a selfie with rosé on a boat", position: "50% 35%" },
    stackOffset: { x: 18, y: 1 },
    stackRotate: 6,
    target: { x: 37, y: 6, rotate: 0, scale: s(4), w: 18, h: 32 },
    targetSm: { x: -22, y: 20 },
    z: 6,
  },
  // bottom-left — sm row 3 right
  {
    item: { src: `${IMG}/boat-selfie.jpg`, alt: "A group of creators taking a selfie on a boat, in black and white", position: "50% 30%" },
    stackOffset: { x: -6, y: 10 },
    stackRotate: 6,
    target: { x: -24, y: 34, rotate: 0, scale: s(3), w: 22, h: 25 },
    targetSm: { x: 22, y: 20 },
    z: 7,
  },
  // bottom-centre — sm row 4 left
  {
    item: { src: `${IMG}/bag-trio.jpg`, alt: "Three creators holding drinks and a Benable gift bag", position: "50% 35%" },
    stackOffset: { x: 8, y: 7 },
    stackRotate: 3,
    target: { x: 2, y: 36, rotate: 0, scale: s(2), w: 20, h: 26 },
    targetSm: { x: -22, y: 40 },
    z: 8,
  },
  // bottom-right — sm row 4 right
  {
    item: { src: `${IMG}/vineyard.jpg`, alt: "Three creators holding Benable gift bags in a vineyard", position: "50% 55%" },
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

// Scroll progress where the cluster starts scattering and where it finishes.
const SCATTER_START = 0.12;
const SCATTER_END = 0.9;

const PARALLAX_X = 2.6;
const PARALLAX_Y = 2.2;
const PARALLAX_SPRING = { stiffness: 90, damping: 22, mass: 0.6 };
const parallaxDepth = (i: number, total: number) => (total <= 1 ? 1 : 0.55 + (i / (total - 1)) * 0.75);

const SUB = "Boat days, vineyard tastings, launch nights. We host our creators all year and know them by name.";

const RESPONSIVE = {
  desktop: {
    scale: null as number | null,
    small: false,
    colX: null as number | null,
    card: null as { w: number; h: number } | null,
  },
  small: {
    scale: 0.72,
    small: true,
    colX: 22,
    card: { w: 40, h: 20 },
  },
};

function useResponsive() {
  const [r, setR] = useState(RESPONSIVE.desktop);
  useEffect(() => {
    // Touch vs. mouse, not raw width: a narrow but mouse-driven window keeps the desktop scatter +
    // pointer parallax; only real touch devices drop to the stacked column layout.
    const mq = window.matchMedia("(pointer: coarse)");
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
  item: StackSpreadItem;
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
}: {
  card: StackSpreadCard;
  progress: MotionValue<number>;
  reduce: boolean | null;
  clusterRotation: boolean;
  /** uniform rest-scale for every card; null = use each card's own scale */
  scaleMul: number | null;
  isSmall: boolean;
  colX: number | null;
  fixedCard: { w: number; h: number } | null;
  /** scale of the cards while clustered, before the scatter */
  stackScale: number;
  /** corner radius on each card, in px (desktop) */
  cardRadius: number;
  pointer: { x: MotionValue<number>; y: MotionValue<number> };
  depth: number;
}) {
  const { item, target } = card;

  const flat = reduce === true;
  const stackRotate = flat ? 0 : clusterRotation ? (card.stackRotate ?? 0) : 0;
  const stackOffset = card.stackOffset ?? { x: 0, y: 0 };
  const restScale = scaleMul ?? target.scale ?? 1;

  // final resting spot: column grid on small screens, scatter on desktop
  const sm = isSmall && card.targetSm ? card.targetSm : null;
  const endX = sm ? (colX != null ? Math.sign(sm.x) * colX : sm.x) : target.x;
  const endY = sm ? sm.y : target.y;
  const endRotate = flat || isSmall ? 0 : target.rotate;

  // -50% keeps card centred on its anchor
  const translate = useTransform([progress, pointer.x, pointer.y], ([p, px, py]: number[]) => {
    const tx = stackOffset.x + (endX - stackOffset.x) * p;
    const ty = stackOffset.y + (endY - stackOffset.y) * p;
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
        width: `${fixedCard ? fixedCard.w : target.w}vw`,
        height: `${fixedCard ? fixedCard.h : target.h}vh`,
        zIndex: card.z ?? 1,
        translate,
        rotate,
        scale,
      }}
    >
      <CardFace item={item} cardRadius={cardRadius} />
    </motion.div>
  );
}

function CardFace({ item, cardRadius }: { item: StackSpreadItem; cardRadius: number }) {
  return (
    <div className="relative h-full w-full overflow-hidden max-md:rounded-[4vw]" style={{ borderRadius: `${cardRadius}px` }}>
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
  /** scatter scroll distance, in vh */
  scrollLength?: number;
  bgColor?: string;
  /** fan the clustered stack (default) or start flat */
  clusterRotation?: boolean;
  /** scale of the cards while clustered, before the scatter */
  stackScale?: number;
  /** corner radius on each card, in px (desktop only — mobile keeps its responsive radius) */
  cardRadius?: number;
  /** scroll progress (0-1) where the centre text starts fading in */
  textFadeStart?: number;
}

function StackSpreadStage({
  cards,
  scrollLength = 350,
  bgColor = "#ffffff",
  clusterRotation = true,
  stackScale = 0.82,
  cardRadius = 20,
  textFadeStart = 0.3,
}: StackSpreadStageProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scale: scaleMul, small: isSmall, colX, card: fixedCard } = useResponsive();

  const { scrollYProgress } = useScroll({
    target: wrapRef,
    offset: ["start start", "end end"],
  });

  // hold, scatter, then settle
  const progress = useTransform(scrollYProgress, [0, SCATTER_START, SCATTER_END, 1], [0, 0, 1, 1]);

  // centre text always fades in on scroll; the scale-in is dropped only when
  // reduced motion is confirmed (`true`), not on the null SSR value.
  const [spread, setSpread] = useState(false);
  useMotionValueEvent(progress, "change", (p) => {
    setSpread((was) => (was ? p > 0.985 : p >= 0.999));
  });
  const parallaxEnabled = reduce !== true && !isSmall;
  const pointer = usePointerParallax(spread, parallaxEnabled);

  const noScale = reduce === true;
  const copyOpacity = useTransform(progress, [textFadeStart, textFadeStart + 0.35], [0, 1]);
  const copyScale = useTransform(progress, [textFadeStart, 0.9], [0.85, 1]);


  return (
    <section id="community" ref={wrapRef} className="relative w-full" style={{ height: `${scrollLength}vh`, backgroundColor: bgColor }}>
      <div className="sticky top-0 h-screen w-full overflow-hidden">
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
          <span className="pill-label max-md:!hidden">Our community</span>
          {/* the heading sets the block's width; the subtext fills exactly that width */}
          <div className="inline-flex flex-col items-center">
            <h2 className="section-title mt-6 max-md:mt-0">
              Meet the <span className="grad-text">Benable community</span>
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
            />
          ))}
        </div>

      </div>
    </section>
  );
}

export default function Community() {
  return <StackSpreadStage cards={CARDS} />;
}
