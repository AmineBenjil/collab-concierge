"use client";

import { motion } from "motion/react";
import { FIT } from "./concierge/data";
import Globe from "./Globe";
import InboxPhone from "./InboxPhone";
import Reveal from "./Reveal";
import { SectionHead } from "./ui";

const EASE = [0.22, 1, 0.36, 1] as const;

const WORTH = [
  { who: "mia.eats.lisbon", img: "mia", post: "Brunch reel", ago: "2 weeks ago", views: "38K", pct: 0.92, fit: "strong" },
  { who: "joao.films", img: "joao", post: "Café reel", ago: "last month", views: "12K", pct: 0.42, fit: "maybe" },
  { who: "travel.with.jon", img: "roasters", post: "Dinner story", ago: "3 weeks ago", views: "900", pct: 0.06, fit: "no" },
] as const;

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
            <div className="relative grid gap-8 sm:grid-cols-[0.9fr_1.1fr] sm:items-center">
              <div>
                <span className="text-[13px] font-semibold text-violet">Question 1</span>
                <h3 className="mt-2 text-[24px] sm:text-[28px]">What do they actually want?</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
                  Gifted or paid? One story or a reel? Every DM is vague, so you end up asking. We ask for you, in a two-minute form.
                </p>
              </div>
              {/* the phone's top half rises out of the card's bottom edge, which crops the rest */}
              <div className="relative -mb-7 h-[330px] sm:h-[380px]">
                <motion.div
                  initial={{ y: 140 }}
                  whileInView={{ y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 1.1, ease: EASE, delay: 0.15 }}
                  className="absolute left-1/2 top-2 w-[250px] -translate-x-1/2 sm:top-8 sm:w-[290px]"
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

          {/* local: the café on a globe, its followers popping up on other continents */}
          <Reveal delay={0.04} className="card relative flex flex-col overflow-hidden p-7">
            <span className="text-[13px] font-semibold text-violet">Question 3</span>
            <h3 className="mt-2 text-[24px] sm:text-[26px]">Is their audience local?</h3>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-2">A creator in your city can still have an audience on another continent. We look at the followers, not the bio.</p>
            {/* the globe's top rises out of the card's bottom edge, which crops the rest */}
            <div className="relative -mx-7 -mb-7 mt-6 min-h-[210px] flex-1">
              <div className="absolute left-1/2 top-3 -translate-x-1/2">
                <Globe />
              </div>
            </div>
          </Reveal>

          {/* worth it */}
          <Reveal delay={0.12} className="card relative overflow-hidden p-7 lg:col-span-2">
            <div className="grid gap-8 sm:grid-cols-[0.9fr_1.1fr]">
              <div className="flex min-w-0 flex-col justify-center">
                <span className="text-[13px] font-semibold text-violet">Question 4</span>
                <h3 className="mt-2 text-[24px] sm:text-[28px]">Are they worth a free visit?</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
                  A gifted brunch for two costs you real money. We look at how their last café collabs actually performed, so you know what you&rsquo;re getting.
                </p>
              </div>
              {/* same grey tray and white rows as the Concierge dashboard */}
              <div className="flex min-w-0 flex-col gap-2 rounded-[20px] border-[0.5px] border-[#e3e3e3] bg-[#fafafa] p-[7.5px]">
                <div className="flex items-baseline justify-between gap-3 px-2 pb-1 pt-1.5">
                  <span className="whitespace-nowrap text-[13px] font-semibold text-[#1c1c1c]">Last café collab</span>
                  <span className="whitespace-nowrap text-[12px] text-[#999]">
                    <span className="sm:hidden">Within 15 km</span>
                    <span className="hidden sm:inline">Views from within 15 km</span>
                  </span>
                </div>
                {WORTH.map((r, i) => {
                  const fit = FIT[r.fit];
                  return (
                    <div key={r.who} className="rounded-[14px] border-[0.5px] border-[#e3e3e3] bg-white p-[13.5px]">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={`/img/ig/${r.img}.jpg`} alt="" className="h-8 w-8 shrink-0 rounded-full border border-white object-cover drop-shadow-[0_4px_7px_rgba(0,0,0,0.08)]" />
                          <div className="min-w-0">
                            <div className="truncate text-[14px] font-semibold leading-[17px] text-black">{r.who}</div>
                            <div className="mt-1 truncate text-[12px] leading-[15px] text-[#999]">
                              {r.post}
                              {/* phones keep just the post type so the line never truncates */}
                              <span className="hidden sm:inline"> · {r.ago}</span>
                            </div>
                          </div>
                        </div>
                        <span className={`inline-flex h-[23px] shrink-0 items-center rounded-[6px] border-[0.5px] px-[9.5px] text-[12px] font-medium leading-none whitespace-nowrap ${fit.tag}`}>{fit.label}</span>
                      </div>
                      <div className="mt-3 flex items-center gap-3">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#eef0f6]">
                          <motion.div
                            className={`h-full rounded-full ${fit.bar}`}
                            initial={{ width: 0 }}
                            whileInView={{ width: `${Math.max(r.pct * 100, 3)}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 1.2, ease: EASE, delay: 0.3 + i * 0.15 }}
                          />
                        </div>
                        <span className="w-[74px] shrink-0 text-right text-[12px] tabular-nums text-[#717171]">
                          <span className="font-semibold text-[#1c1c1c]">{r.views}</span> views
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
