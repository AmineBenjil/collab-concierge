"use client";

import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import CreatorGrowth from "./CreatorGrowth";
import { SectionHead } from "../ui";

const FROM = 800_000;
const TO = 1_000_000;
const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

/* the headline number climbs from 800,000 to 1,000,000+ the first time it scrolls into view */
function CountUp() {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const reduce = useReducedMotion();
  const [n, setN] = useState(FROM);
  useEffect(() => {
    if (!inView) return;
    const a = animate(FROM, TO, { duration: reduce ? 0 : 1.8, ease: [0.16, 1, 0.3, 1], onUpdate: setN });
    return () => a.stop();
  }, [inView, reduce]);
  return (
    <span ref={ref} className="grad-text tabular-nums">
      <span className="sr-only">1,000,000+</span>
      <span aria-hidden="true">
        {fmt(n)}
        {n >= TO ? "+" : ""}
      </span>
    </span>
  );
}

/* Creators: same head as before, then a year of creator growth drawn in a How it works-style box. */
export default function Creators() {
  return (
    <section id="creators" className="relative scroll-mt-24 py-24 sm:py-28">
      <div className="container-x">
        <SectionHead label="Our creators" title={
            <>
              Over <CountUp /> creators already assessed.
            </>
          } sub="Our analysis is based on working with every one of them, so each recommendation comes from real data, not a follower count." />
        <div className="mt-16">
          <CreatorGrowth />
        </div>
      </div>
    </section>
  );
}
