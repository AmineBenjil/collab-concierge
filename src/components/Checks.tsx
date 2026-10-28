"use client";

import { AnimatePresence, motion, useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Check, SectionHead } from "./ui";

const EASE = [0.22, 1, 0.36, 1] as const;

const CHECKS = [
  { title: "Fake followers", body: "We look for bought followers and bot-like accounts behind the number.", stat: "2%", caption: "of Mia's followers look suspicious. Well under what we flag." },
  { title: "Real engagement", body: "Likes and comments that come from real people, at a rate that adds up.", stat: "6.4%", caption: "average engagement on her last 12 reels." },
  { title: "Audience fit", body: "Age, demographic and location fit with your business.", stat: "84%", caption: "of her audience is in the US, most of it in Los Angeles." },
  { title: "Content quality", body: "Well lit, on brand, consistent. Content you'd feel great about.", stat: "4×", caption: "a week she posts food content in a style that fits yours." },
  { title: "Red flags", body: "Hate speech, scams, trashing other businesses, serial freeloaders.", stat: "0", caption: "red flags found across her account history." },
  { title: "Past collabs", body: "How their previous collabs actually performed.", stat: "2", caption: "brand collabs in the last 6 months, both above her average." },
  { title: "Audience size", body: "Big enough to matter, not too big for a gifted collab.", stat: "24.1K", caption: "followers. Right-sized for a gifted product or visit." },
];

function Item({ i, active, onActive }: { i: number; active: boolean; onActive: (i: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-48% 0px -48% 0px" });
  useEffect(() => {
    if (inView) onActive(i);
  }, [inView, i, onActive]);
  const c = CHECKS[i];
  return (
    // clicking a check scrolls it to the middle of the screen, where the in-view watcher makes it active
    <div
      ref={ref}
      role="button"
      tabIndex={0}
      aria-current={active || undefined}
      onClick={() => ref.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
      onKeyDown={(e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }}
      className={`relative block w-full cursor-pointer rounded-[4px] py-7 pl-6 text-left lg:py-12 ${active ? "" : "hover:[&>div]:opacity-60"}`}
    >
      <span className={`absolute left-0 top-7 bottom-7 w-[2px] rounded-full bg-[#1c1c1c] transition-all duration-500 lg:top-12 lg:bottom-12 ${active ? "opacity-100" : "opacity-0"}`} />
      <div className={`transition-opacity duration-500 ${active ? "opacity-100" : "opacity-35"}`}>
        <div className={`text-[13px] font-semibold transition-colors duration-500 ${active ? "text-violet" : "text-[#8a8a96]"}`}>Check {i + 1} of 7</div>
        <h3 className="mt-1.5 text-[26px] sm:text-[30px]">{c.title}</h3>
        <p className="mt-2 max-w-[420px] text-[16px] leading-relaxed text-ink-2">{c.body}</p>
      </div>
    </div>
  );
}

export default function Checks() {
  const [active, setActive] = useState(0);
  const c = CHECKS[active];

  return (
    <section id="checks" className="relative scroll-mt-24 bg-white py-24 sm:py-32">
      <div className="container-x">
        <SectionHead
          label="What we check"
          title={
            <>
              7 checks before <span className="grad-text">you say yes</span>
            </>
          }
          sub="We run them as soon as a creator fills in your link, and you get a clear assessment."
        />

        <div className="mt-12 grid gap-10 lg:mt-20 lg:grid-cols-[1fr_1fr] lg:gap-16">
          <div className="lg:py-[18vh]">
            {CHECKS.map((_, i) => (
              <Item key={i} i={i} active={i === active} onActive={setActive} />
            ))}
          </div>

          {/* sticky report card */}
          <div className="hidden lg:block">
            <div className="sticky top-[14vh]">
              <div className="relative">
                <div className="pointer-events-none absolute -inset-10 rounded-full bg-[radial-gradient(closest-side,rgba(143,108,247,0.22),transparent)] blur-xl" />
                <div className="card relative overflow-hidden p-6">
                  <div className="flex items-center gap-4">
                    <span className="brand-grad rounded-full p-[2px]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/img/ig/mia.jpg" alt="" className="block h-14 w-14 rounded-full border-2 border-white object-cover" />
                    </span>
                    <div className="leading-tight">
                      <div className="text-[17px] font-semibold">Mia Duarte</div>
                      <div className="text-[13px] text-muted">@mia.eats.la, food creator in Los Angeles</div>
                    </div>
                  </div>

                  <div className="relative mt-5 h-[150px] overflow-hidden rounded-2xl bg-[#f6f5fc]">
                    <div className="dot-grid absolute inset-0" />
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={active}
                        className="absolute inset-0 flex items-center gap-5 px-6"
                        initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: -10, filter: "blur(6px)" }}
                        transition={{ duration: 0.45, ease: EASE }}
                      >
                        <span className="display grad-text text-[64px] leading-none">{c.stat}</span>
                        <span className="max-w-[200px] text-[15px] leading-snug text-ink-2">{c.caption}</span>
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  <ul className="mt-4">
                    {CHECKS.map((row, i) => (
                      <li
                        key={row.title}
                        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] transition-all duration-400 ${i === active ? "bg-lilac font-semibold text-ink" : i < active ? "text-ink-2" : "text-muted"}`}
                      >
                        {/* every row has an icon: a tick once checked, a spinner while it's still running */}
                        <span className="relative h-5 w-5 shrink-0">
                          <span className={`absolute inset-0 transition-[opacity,transform] duration-300 ${i <= active ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}>
                            <Check />
                          </span>
                          <span
                            className={`absolute inset-0.5 rounded-full border-2 border-violet/15 border-t-violet transition-opacity duration-300 ${i <= active ? "opacity-0" : "animate-spin opacity-100 motion-reduce:animate-none"}`}
                            aria-hidden="true"
                          />
                        </span>
                        <span>{row.title}</span>
                        <span className="ml-auto text-[13px] font-medium text-ink-2">{i <= active ? row.stat : ""}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
