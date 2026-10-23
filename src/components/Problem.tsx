"use client";

import { RiCupLine } from "@remixicon/react";
import { motion } from "motion/react";
import Reveal from "./Reveal";
import { SectionHead } from "./ui";

const EASE = [0.22, 1, 0.36, 1] as const;

const DMS = [
  { who: "joao.films", img: "joao", text: "hii love your feed 💕 collab?", t: "9:02" },
  { who: "ana.ribeiro", img: "ana", text: "can I come film this week?", t: "11:40" },
  { who: "travel.with.jon", img: "roasters", text: "free dinner for 4 + €150 for a post", t: "14:15" },
  { who: "mia.eats.lisbon", img: "mia", text: "gifted visit for me + 1? 🙏", t: "16:58" },
];

function Avatar({ img, size = 28 }: { img: string; size?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`/img/ig/${img}.jpg`} alt="" className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />;
}

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
              <div className="flex flex-col gap-2.5">
                {DMS.map((d, i) => (
                  <motion.div
                    key={d.who}
                    initial={{ opacity: 0, x: 24 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.7, ease: EASE, delay: 0.2 + i * 0.14 }}
                    className="flex items-center gap-3 rounded-2xl border border-line bg-white/90 px-3 py-2.5 shadow-[0_8px_20px_-16px_rgba(40,30,110,0.4)]"
                  >
                    <Avatar img={d.img} size={32} />
                    <div className="min-w-0 flex-1 leading-tight">
                      <div className="flex justify-between text-[12px]">
                        <span className="font-semibold">{d.who}</span>
                        <span className="text-muted">{d.t}</span>
                      </div>
                      <div className="truncate text-[14px] text-ink-2">{d.text}</div>
                    </div>
                  </motion.div>
                ))}
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

          {/* local */}
          <Reveal delay={0.04} className="card relative overflow-hidden p-7">
            <span className="text-[13px] font-semibold text-violet">Question 3</span>
            <h3 className="mt-2 text-[24px] sm:text-[26px]">Is their audience local?</h3>
            <div className="relative mx-auto mt-6 h-[150px] w-[150px]">
              {[1, 0.7, 0.42].map((s, i) => (
                <span key={i} className="absolute inset-0 m-auto rounded-full border border-dashed border-violet/25" style={{ width: `${s * 100}%`, height: `${s * 100}%` }} />
              ))}
              <span className="absolute left-1/2 top-1/2 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-ink text-white shadow-lg"><RiCupLine size={17} aria-hidden="true" /></span>
              {[
                [8, 18], [88, 12], [92, 70], [4, 78], [70, 94], [22, 96], [96, 40], [40, 2], [60, 6], [14, 44],
              ].map(([x, y], i) => (
                <motion.span
                  key={i}
                  className="absolute h-2 w-2 rounded-full bg-violet/60"
                  style={{ left: `${x}%`, top: `${y}%` }}
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.05 }}
                />
              ))}
            </div>
            <p className="mt-6 text-[15px] leading-relaxed text-ink-2">A creator in your city can still have an audience on another continent. We look at the followers, not the bio.</p>
          </Reveal>

          {/* worth it */}
          <Reveal delay={0.12} className="card relative overflow-hidden p-7 lg:col-span-2">
            <div className="grid gap-8 sm:grid-cols-[0.9fr_1.1fr] sm:items-center">
              <div>
                <span className="text-[13px] font-semibold text-violet">Question 4</span>
                <h3 className="mt-2 text-[24px] sm:text-[28px]">Are they worth a free visit?</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
                  A gifted brunch for two costs you real money. We look at how their last café collabs actually performed, so you know what you&rsquo;re getting.
                </p>
              </div>
              <div className="flex flex-col gap-4">
                {[
                  { who: "mia.eats.lisbon", img: "mia", views: "38K local views", pct: 0.92, tone: "var(--mint)" },
                  { who: "joao.films", img: "joao", views: "12K local views", pct: 0.42, tone: "#8f6cf7" },
                  { who: "travel.with.jon", img: "roasters", views: "900 local views", pct: 0.06, tone: "var(--rose)" },
                ].map((r, i) => (
                  <div key={r.who}>
                    <div className="mb-1.5 flex items-center justify-between text-[13px]">
                      <span className="flex items-center gap-2 font-semibold"><Avatar img={r.img} size={22} />{r.who}</span>
                      <span className="text-muted">{r.views}</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-[#eef0f6]">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: r.tone }}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${Math.max(r.pct * 100, 3)}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.2, ease: EASE, delay: 0.3 + i * 0.15 }}
                      />
                    </div>
                  </div>
                ))}
                <p className="text-[12px] text-muted">Average views on each creator&rsquo;s last café collab, from people within 15 km.</p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
