"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";

/*
  Threads-style spoiler: drifting specks cover every line of text inside until `revealed`, then scatter
  and fade while the text comes up underneath. Specks are seeded per line of text (and per [data-spoil-box]
  element, for things like a barcode), so they follow the shape of the copy instead of one big block.
  Text inside [data-spoil-skip] or .sr-only is left out.
*/

type Box = { x: number; y: number; w: number; h: number };
type Speck = { x: number; y: number; vx: number; vy: number; s: number; a: number; w: number; p: number; b: Box };

const BLEED = 48; // canvas reaches past the text so scattering specks can leave before they fade
const SCATTER_MS = 900;
const DENSITY = 0.26;

function measure(root: HTMLElement): Box[] {
  const base = root.getBoundingClientRect();
  // a scaled ancestor (the receipt on phones) shrinks client rects; the canvas draws in layout pixels
  const k = base.width / (root.offsetWidth || 1);
  const boxes: Box[] = [];
  const add = (r: DOMRect) => {
    if (r.width < 4 || r.height < 4) return;
    // trim the line box toward the glyphs
    const inset = r.height * 0.14;
    boxes.push({ x: (r.left - base.left) / k, y: (r.top - base.top + inset) / k, w: r.width / k, h: (r.height - inset * 2) / k });
  };
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) =>
      !n.textContent?.trim() || n.parentElement?.closest("[data-spoil-skip], .sr-only") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
  });
  const range = document.createRange();
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    range.selectNodeContents(n);
    Array.from(range.getClientRects()).forEach(add);
  }
  root.querySelectorAll("[data-spoil-box]").forEach((el) => add(el.getBoundingClientRect()));
  return boxes;
}

function seed(boxes: Box[]): Speck[] {
  const specks: Speck[] = [];
  for (const b of boxes) {
    // bigger type gets bigger specks, so a 100px "$0" doesn't turn into fog
    const s = Math.min(2, Math.max(1.1, b.h / 14));
    const n = Math.round((b.w * b.h * DENSITY) / (s * s));
    for (let i = 0; i < n; i++) {
      specks.push({
        x: b.x + Math.random() * b.w,
        y: b.y + Math.random() * b.h,
        vx: (Math.random() - 0.5) * 14,
        vy: (Math.random() - 0.5) * 14,
        s: s * (0.6 + Math.random() * 0.6),
        a: 0.3 + Math.random() * 0.6,
        w: 1.5 + Math.random() * 3,
        p: Math.random() * Math.PI * 2,
        b,
      });
    }
  }
  return specks;
}

export default function Spoiler({
  revealed,
  children,
  color = "#1c1c1c",
  className = "",
}: {
  revealed: boolean;
  children: ReactNode;
  color?: string;
  className?: string;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const revealAt = useRef(0);
  const scatter = useRef<() => void>(() => {});
  const reduce = useReducedMotion() ?? false;

  useEffect(() => {
    const root = contentRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!root || !canvas || !ctx) return;

    let specks: Speck[] = [];
    let raf = 0;
    let last = 0;
    let onScreen = false;
    let done = false;

    const draw = (now: number) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      const t = now / 1000;
      const fade = revealAt.current ? Math.min(1, (now - revealAt.current) / SCATTER_MS) : 0;
      ctx.clearRect(-BLEED, -BLEED, canvas.width, canvas.height);
      ctx.fillStyle = color;
      for (const sp of specks) {
        sp.x += sp.vx * dt;
        sp.y += sp.vy * dt;
        if (!revealAt.current) {
          // drift inside the line it covers
          const { x, y, w, h } = sp.b;
          if (sp.x < x || sp.x > x + w) sp.vx *= -1;
          if (sp.y < y || sp.y > y + h) sp.vy *= -1;
          sp.x = Math.min(x + w, Math.max(x, sp.x));
          sp.y = Math.min(y + h, Math.max(y, sp.y));
        }
        ctx.globalAlpha = sp.a * (0.55 + 0.45 * Math.sin(t * sp.w + sp.p)) * (1 - fade) ** 1.5;
        ctx.fillRect(sp.x - sp.s / 2, sp.y - sp.s / 2, sp.s, sp.s);
      }
      if (fade >= 1) {
        done = true;
        ctx.clearRect(-BLEED, -BLEED, canvas.width, canvas.height);
        return;
      }
      if (!reduce && onScreen) raf = requestAnimationFrame(draw);
    };

    const start = () => {
      if (done) return;
      cancelAnimationFrame(raf);
      last = 0;
      raf = requestAnimationFrame(draw);
    };

    const layout = () => {
      if (done) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = root.offsetWidth + BLEED * 2;
      const h = root.offsetHeight + BLEED * 2;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, BLEED * dpr, BLEED * dpr);
      specks = seed(measure(root));
      start();
    };

    scatter.current = () => {
      if (done) return;
      revealAt.current = performance.now();
      if (reduce) {
        done = true;
        ctx.clearRect(-BLEED, -BLEED, canvas.width, canvas.height);
        return;
      }
      // blow each speck out from the middle of its line, a little upward
      for (const sp of specks) {
        const dx = sp.x - (sp.b.x + sp.b.w / 2);
        const dy = sp.y - (sp.b.y + sp.b.h / 2);
        const len = Math.hypot(dx, dy) || 1;
        const speed = 40 + Math.random() * 140;
        sp.vx = (dx / len) * speed + (Math.random() - 0.5) * 40;
        sp.vy = (dy / len) * speed * 0.6 - 20 - Math.random() * 40;
      }
      start();
    };

    const io = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting;
      if (onScreen) start();
    });
    const ro = new ResizeObserver(layout);
    io.observe(root);
    ro.observe(root);
    document.fonts?.ready.then(layout);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
    };
  }, [color, reduce]);

  useEffect(() => {
    if (revealed) scatter.current();
  }, [revealed]);

  return (
    <div className={`relative ${className}`}>
      <motion.div
        ref={contentRef}
        initial={false}
        animate={revealed ? { opacity: 1, filter: "blur(0px)" } : { opacity: 0, filter: "blur(6px)" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: revealed ? 0.15 : 0 }}
      >
        {children}
      </motion.div>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute"
        style={{ left: -BLEED, top: -BLEED, width: `calc(100% + ${BLEED * 2}px)`, height: `calc(100% + ${BLEED * 2}px)` }}
      />
    </div>
  );
}
