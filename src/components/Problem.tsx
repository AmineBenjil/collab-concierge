"use client";

import { RiVerifiedBadgeFill } from "@remixicon/react";
import { motion } from "motion/react";
import { FIT } from "./concierge/data";
import AudienceVenn from "./AudienceVenn";
import InboxPhone from "./InboxPhone";
import Reveal from "./Reveal";
import { SectionHead } from "./ui";

const EASE = [0.22, 1, 0.36, 1] as const;

const WORTH = [
  { name: "Jon Reyes", who: "travel.with.jon", img: "roasters", post: "Dinner story", views: "900", fit: "no" },
  { name: "Mia Duarte", who: "mia.eats.la", img: "mia", post: "Product reel", views: "38K", fit: "strong" },
  { name: "Joey Park", who: "joey.films", img: "joao", post: "Café reel", views: "12K", fit: "maybe" },
] as const;
// how far each card behind the front one sits above it
const STACK_STEP = 50;

export default function Problem() {
  return (
    <section className="relative pt-14 pb-24 sm:pt-20 sm:pb-32">
      <div className="container-x">
        <SectionHead
          label="Sound familiar?"
          title={
            <>
              Every collab DM is a <span className="grad-text">small investigation</span>
            </>
          }
          sub="Each one raises the same four questions. Benable answers them before you reply."
        />

        <div className="mt-16 grid gap-5 lg:grid-cols-3">
          {/* what do they want */}
          <Reveal className="card relative overflow-hidden p-7 lg:col-span-2">
            <div className="dot-grid pointer-events-none absolute inset-0 opacity-60" />
            <div className="relative grid gap-8 sm:grid-cols-[0.9fr_1.1fr]">
              <div>
                <span className="text-[13px] font-semibold text-violet">Question 1</span>
                <h3 className="mt-2 text-[24px] sm:text-[28px]">What do they actually want?</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
                  Gifted or paid? One story or a reel? Every DM is vague, so you end up asking. We ask for you, in a two-minute form.
                </p>
              </div>
              {/* the phone's top half rises out of the card's bottom edge, which crops the rest */}
              <div className="relative -mb-7 h-[300px] sm:-mt-7 sm:h-[calc(100%+28px)] sm:min-h-[300px]">
                <motion.div
                  initial={{ y: 140 }}
                  whileInView={{ y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 1.1, ease: EASE, delay: 0.15 }}
                  className="absolute left-1/2 top-2 w-[250px] -translate-x-1/2 sm:top-10 sm:w-[270px]"
                >
                  <InboxPhone />
                </motion.div>
              </div>
            </div>
          </Reveal>

          {/* are they real */}
          <Reveal delay={0.08} className="card relative overflow-hidden p-7">
            <span className="text-[13px] font-semibold text-violet">Question 2</span>
            <h3 className="mt-2 text-[24px] sm:text-[26px]">Are they even real?</h3>
            <div className="mt-6 flex items-center gap-5">
              <svg width="112" height="112" viewBox="0 0 120 120" className="shrink-0 -rotate-90" aria-hidden="true">
                <circle cx="60" cy="60" r="48" fill="none" stroke="#eef0f6" strokeWidth="14" />
                <motion.circle
                  cx="60" cy="60" r="48" fill="none" stroke="var(--rose)" strokeWidth="14" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 48}
                  initial={{ strokeDashoffset: 2 * Math.PI * 48 }}
                  whileInView={{ strokeDashoffset: 2 * Math.PI * 48 * (1 - 0.41) }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.4, ease: EASE, delay: 0.3 }}
                />
              </svg>
              <div>
                <div className="display text-[40px] leading-none">41%</div>
                <p className="mt-1 text-[14px] leading-snug text-ink-2">of one creator&rsquo;s followers looked bought.</p>
              </div>
            </div>
            <p className="mt-6 text-[15px] leading-relaxed text-ink-2">Follower counts are easy to fake. We check who&rsquo;s actually behind the number.</p>
          </Reveal>

          {/* audience fit: your customers and their followers, overlapping (or not) */}
          <Reveal delay={0.04} className="card relative flex flex-col overflow-hidden p-7">
            <span className="text-[13px] font-semibold text-violet">Question 3</span>
            <h3 className="mt-2 text-[24px] sm:text-[26px]">Is their audience a fit?</h3>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-2">The creator can be a great fit and their audience still miss. We look at the followers, not the bio.</p>
            <div className="mt-6 flex flex-1 items-end">
              <AudienceVenn />
            </div>
          </Reveal>

          {/* worth it */}
          <Reveal delay={0.12} className="card relative overflow-hidden p-7 lg:col-span-2">
            <div className="grid h-full gap-8 sm:grid-cols-[0.85fr_1.15fr]">
              <div className="flex min-w-0 flex-col">
                <span className="text-[13px] font-semibold text-violet">Question 4</span>
                <h3 className="mt-2 text-[24px] sm:text-[28px]">Worth a free product or experience?</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
                  Every gifted product or visit costs you real money. We look at how their last collabs actually performed, so you know what you&rsquo;re getting.
                </p>
              </div>
              {/* each creator's last collab, stacked on a lilac panel: the first in front, the rest tucked behind */}
              <div className="relative flex min-h-[300px] min-w-0 items-center justify-center overflow-hidden rounded-[22px] bg-[linear-gradient(180deg,#f7f5ff_0%,#ebe5ff_55%,#dcd1fd_100%)] px-4 py-8 sm:px-6">
                <div className="dot-grid pointer-events-none absolute inset-0 opacity-70" />
                <div className="pointer-events-none absolute inset-x-8 bottom-6 h-24 rounded-full bg-[#8f6cf7]/35 blur-3xl" />
                <div className="relative w-full max-w-[400px]" style={{ paddingTop: (WORTH.length - 1) * STACK_STEP }}>
                  {WORTH.map((r, i) => ({ r, i }))
                    .reverse()
                    .map(({ r, i }) => {
                      const fit = FIT[r.fit];
                      const front = i === 0;
                      return (
                        <motion.div
                          key={r.who}
                          className={`${front ? "relative" : "absolute inset-x-0 bottom-0"} flex items-center gap-3 rounded-[22px] px-4 py-3.5 ${
                            front
                              ? "bg-white shadow-[0_24px_40px_-18px_rgba(107,78,240,0.55),0_0_0_0.5px_rgba(22,26,53,0.06)]"
                              : "bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(255,255,255,0.6))] shadow-[0_10px_24px_-16px_rgba(107,78,240,0.45),0_0_0_0.5px_rgba(255,255,255,0.9)] backdrop-blur-md"
                          }`}
                          style={{ originY: 1, zIndex: WORTH.length - i }}
                          initial={{ opacity: 0, y: front ? 18 : 0, scale: front ? 1 : 0.9 }}
                          whileInView={{ opacity: 1, y: -i * STACK_STEP, scale: 1 - i * 0.09 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.8, ease: EASE, delay: front ? 0.15 : 0.45 + i * 0.12 }}
                        >
                          <div className={`flex min-w-0 flex-1 items-center gap-3 ${front ? "" : i === 1 ? "opacity-60" : "opacity-40"}`}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={`/img/ig/${r.img}.jpg`} alt="" className="h-10 w-10 shrink-0 rounded-full border border-white object-cover drop-shadow-[0_4px_7px_rgba(0,0,0,0.08)]" />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1 text-[14px] font-semibold leading-[17px] text-black">
                                <span className="truncate">{r.name}</span>
                                <RiVerifiedBadgeFill size={15} color="#3897f0" aria-label="Verified" className="shrink-0" />
                              </div>
                              <div className="mt-1 truncate text-[12px] leading-[15px] text-[#999]">
                                {r.post} · <span className="font-semibold text-[#1c1c1c]">{r.views}</span> views
                              </div>
                            </div>
                            <span className={`inline-flex h-[23px] shrink-0 items-center rounded-[6px] border-[0.5px] px-[9.5px] text-[12px] font-medium leading-none whitespace-nowrap ${fit.tag}`}>{fit.label}</span>
                          </div>
                        </motion.div>
                      );
                    })}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
