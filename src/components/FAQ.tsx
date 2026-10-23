"use client";

import { RiArrowDownSLine } from "@remixicon/react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import Reveal from "./Reveal";
import { SectionHead } from "./ui";

const ITEMS = [
  { q: "Does the creator need a Benable account?", a: "No. They open your link, answer a few questions and add their Instagram. If they already use Benable, we recognise them and skip the typing." },
  { q: "What happens after I say yes?", a: "We tell the creator it's a yes, share the times you gave us and what they get, and remind them what they agreed to post. You just show up and host." },
  { q: "And if I say no?", a: "We decline for you, kindly and without the reason. The creator never sees the vetting, and you never have to write the awkward DM." },
  { q: "How do you check where their audience is?", a: "We look at their followers, not their bio. A creator in your city with an audience somewhere else is a pass for a free visit, and we'll say so." },
  { q: "What does it cost?", a: "Free for local businesses while we roll out. If you later want us to run paid collabs end to end, we'll quote that separately." },
];

export default function FAQ() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="relative scroll-mt-24 bg-white py-24 sm:py-32">
      <div className="container-x">
        <SectionHead
          label="FAQ"
          title={
            <>
              Questions <span className="grad-text">businesses</span> ask us
            </>
          }
        />
        <Reveal className="mx-auto mt-14 flex max-w-[760px] flex-col gap-3">
          {ITEMS.map((it, i) => {
            const on = open === i;
            return (
              <div key={it.q} className={`rounded-[18px] border bg-white transition-all duration-300 ${on ? "border-[#d9d4fb] shadow-[0_20px_40px_-28px_rgba(80,60,200,0.45)]" : "border-line"}`}>
                <button onClick={() => setOpen(on ? -1 : i)} className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left text-[17px] font-semibold" aria-expanded={on}>
                  {it.q}
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line transition-transform duration-300 ${on ? "rotate-180 bg-ink text-white" : ""}`}>
                    <RiArrowDownSLine size={18} aria-hidden="true" />
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {on && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-6 text-[16px] leading-relaxed text-ink-2">{it.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}
