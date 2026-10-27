"use client";

import { RiCupLine } from "@remixicon/react";
import { useInView } from "motion/react";
import { useRef } from "react";
import { GLOBE_DOTS } from "./globe-dots";

/*
  A white globe with dotted land, the café pinned in Lisbon and follower faces popping
  up on other continents. Static SVG plus CSS keyframes: no per-frame JavaScript, and
  the faces only animate while the globe is on screen.
*/

// depth bands from limb to centre (see globe-dots.ts)
const BAND_OPACITY = [0.16, 0.34, 0.55, 0.75];

// pin positions in the 300 x 300 globe box, projected with the dots
const CAFE = { x: 201, y: 80.1 };
const FACES = [
  { img: "ana", x: 78.4, y: 72.7 }, // New York
  { img: "rafa", x: 203.4, y: 51.1 }, // London
  { img: "clara", x: 242.6, y: 157.7 }, // Lagos
  { img: "tiago", x: 72.1, y: 149.3 }, // Caracas
  { img: "beatriz", x: 164.9, y: 31.3 }, // Reykjavik
  { img: "ines", x: 150.3, y: 201.4 }, // Recife
];

export default function Globe({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const live = useInView(ref, { margin: "-40px" });
  return (
    <div ref={ref} className={`relative h-[300px] w-[300px] ${live ? "globe-live" : ""} ${className}`} aria-hidden="true">
      <div className="absolute inset-0 rounded-full shadow-[0_30px_60px_-30px_rgba(40,30,110,0.35)]" />
      <svg viewBox="0 0 300 300" className="absolute inset-0 h-full w-full">
        <defs>
          {/* lit from the top left, darkening softly toward the lower right rim */}
          <radialGradient id="globe-shade" cx="38%" cy="32%" r="72%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="62%" stopColor="#f7f7fa" />
            <stop offset="100%" stopColor="#e6e7ee" />
          </radialGradient>
        </defs>
        <circle cx="150" cy="150" r="149.5" fill="url(#globe-shade)" stroke="#e6e6ec" strokeWidth="1" />
        {GLOBE_DOTS.map((d, i) => (
          <path key={i} d={d} stroke="#161a35" strokeOpacity={BAND_OPACITY[i]} strokeWidth="1.9" strokeLinecap="round" fill="none" />
        ))}
      </svg>

      {/* the café, with a slow ping so the eye finds home first */}
      <span className="absolute" style={{ left: CAFE.x, top: CAFE.y }}>
        <span className="globe-pulse absolute -left-[15px] -top-[15px] h-[30px] w-[30px] rounded-full bg-ink" />
        <span className="absolute -left-[15px] -top-[15px] grid h-[30px] w-[30px] place-items-center rounded-full border-2 border-white bg-ink text-white shadow-[0_6px_14px_-4px_rgba(22,26,53,0.5)]">
          <RiCupLine size={14} />
        </span>
      </span>

      {FACES.map((f, i) => (
        <span key={f.img} className="absolute" style={{ left: f.x, top: f.y }}>
          <span className="absolute -left-[3px] -top-[3px] h-[6px] w-[6px] rounded-full bg-violet ring-2 ring-white" />
          <span className="globe-pop absolute -left-[16px] -top-[40px] block h-8 w-8" style={{ animationDelay: `${i * 1.1}s` }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/img/ig/${f.img}.jpg`}
              alt=""
              className="h-8 w-8 rounded-full border-2 border-white object-cover shadow-[0_6px_14px_-4px_rgba(22,26,53,0.45)]"
            />
          </span>
        </span>
      ))}
    </div>
  );
}
