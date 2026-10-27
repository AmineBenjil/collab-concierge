/*
  Confetti in the brand colours raining from the top of the screen to the bottom, drawn on a throwaway
  full-screen canvas that removes itself once the last piece has fallen out of view.
*/

const COLORS = ["#4d8dff", "#749bff", "#8f6cf7", "#cba0f6", "#f2869a", "#fbb647", "#22b07d"];
const MAX_MS = 7000;

export function confetti() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const W = window.innerWidth;
  const H = window.innerHeight;
  const canvas = document.createElement("canvas");
  Object.assign(canvas.style, { position: "fixed", inset: "0", width: "100vw", height: "100vh", pointerEvents: "none", zIndex: "60" });
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.scale(dpr, dpr);
  document.body.appendChild(canvas);

  // wider screens get more pieces; they start staggered above the top edge so they arrive as a shower
  const count = Math.min(220, Math.max(90, Math.round(W / 7)));
  const pieces = Array.from({ length: count }, () => ({
    x: Math.random() * W,
    y: -20 - Math.random() * H * 0.7,
    vx: (Math.random() - 0.5) * 1.2,
    vy: 1.5 + Math.random() * 2,
    max: 3.5 + Math.random() * 2.5,
    sway: Math.random() * Math.PI * 2,
    vs: 0.03 + Math.random() * 0.04,
    w: 6 + Math.random() * 5,
    h: 4 + Math.random() * 4,
    rot: Math.random() * Math.PI * 2,
    vr: (Math.random() - 0.5) * 0.2,
    tilt: Math.random() * Math.PI * 2,
    vt: 0.06 + Math.random() * 0.12,
    round: Math.random() < 0.3,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  }));

  const start = performance.now();
  let last = start;
  const frame = (now: number) => {
    // f is elapsed time in 60fps frames, so motion is the same on 120Hz screens
    const f = Math.min(3, (now - last) / (1000 / 60));
    last = now;
    ctx.clearRect(0, 0, W, H);
    let falling = false;
    for (const p of pieces) {
      p.vy = Math.min(p.max, p.vy + 0.06 * f);
      p.sway += p.vs * f;
      p.x += (p.vx + Math.sin(p.sway) * 0.9) * f;
      p.y += p.vy * f;
      p.rot += p.vr * f;
      p.tilt += p.vt * f;
      if (p.y < H + 20) falling = true;
      if (p.y < -20 || p.y > H + 20) continue;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      // flipping on one axis reads as a piece of paper tumbling
      ctx.scale(1, Math.cos(p.tilt));
      ctx.fillStyle = p.color;
      if (p.round) {
        ctx.beginPath();
        ctx.arc(0, 0, p.h / 1.6, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      }
      ctx.restore();
    }
    if (falling && now - start < MAX_MS) requestAnimationFrame(frame);
    else canvas.remove();
  };
  requestAnimationFrame(frame);
}

const EMOJI = ["😍", "🎉", "🥳", "✨", "🎊"];

/*
  A pop of emoji from one point (viewport coordinates): they fly out in every direction, a little upward,
  drift down as they fade, and clean themselves up.
*/
export function emojiBurst(x: number, y: number, count = 22) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const layer = document.createElement("div");
  Object.assign(layer.style, { position: "fixed", left: `${x}px`, top: `${y}px`, pointerEvents: "none", zIndex: "60" });
  document.body.appendChild(layer);

  let longest = 0;
  for (let i = 0; i < count; i++) {
    const el = document.createElement("span");
    el.textContent = EMOJI[i % EMOJI.length];
    Object.assign(el.style, { position: "absolute", left: "0", top: "0", fontSize: `${18 + Math.random() * 14}px`, lineHeight: "1" });
    layer.appendChild(el);

    const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
    const dist = 70 + Math.random() * 90;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist * 0.8 - 40;
    const spin = (Math.random() - 0.5) * 120;
    const ms = 1700 + Math.random() * 600;
    longest = Math.max(longest, ms);
    el.animate(
      [
        { transform: "translate(-50%, -50%) scale(0.3) rotate(0deg)", opacity: 1 },
        { transform: `translate(calc(-50% + ${dx * 0.8}px), calc(-50% + ${dy * 0.8}px)) scale(1.1) rotate(${spin * 0.5}deg)`, opacity: 1, offset: 0.35 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy + 50}px)) scale(0.9) rotate(${spin}deg)`, opacity: 0 },
      ],
      { duration: ms, easing: "cubic-bezier(0.25, 0.6, 0.35, 1)", fill: "forwards" },
    );
  }
  window.setTimeout(() => layer.remove(), longest + 50);
}
