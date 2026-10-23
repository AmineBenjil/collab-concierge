"use client";

import { motion, useMotionValueEvent, useScroll } from "motion/react";
import { useState } from "react";
import Logo from "./Logo";
import { useControls } from "./controls";
import { useIntro } from "./IntroContext";

const LINKS = [
  { href: "#how", label: "How it works" },
  { href: "#checks", label: "What we check" },
  { href: "#creators", label: "Creators" },
  { href: "#faq", label: "FAQ" },
];

export default function Nav() {
  const { done } = useIntro();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  // over the light hero (V2) the nav reads dark from the start
  const { heroBg } = useControls();
  const dark = scrolled || heroBg === "v2";
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 40));

  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={done ? { opacity: 1, y: 0 } : { opacity: 0, y: -16 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
      className="fixed inset-x-0 top-3 z-50 flex justify-center px-2 sm:top-4"
    >
      <nav
        aria-label="Main"
        className={`flex h-[58px] w-full items-center justify-between rounded-[18px] border pl-4 pr-2 transition-all duration-500 ease-[cubic-bezier(.22,1,.36,1)] ${
          scrolled
            ? "max-w-[860px] border-[#e5e7eb]/70 bg-white/70 text-ink shadow-[0_20px_32px_-12px_rgba(50,38,98,0.22)] backdrop-blur-xl"
            : dark
              ? "max-w-[1120px] border-ink/10 bg-white/50 text-ink backdrop-blur-md"
              : "max-w-[1120px] border-white/12 bg-white/[0.06] text-white backdrop-blur-md"
        }`}
      >
        <a href="#" className="flex items-center gap-3" aria-label="Benable Collab Concierge home">
          <Logo className={dark ? "text-ink" : "text-white"} />
          <span className={`hidden h-4 w-px sm:block ${dark ? "bg-ink/15" : "bg-white/25"}`} />
          <span className="hidden text-[14px] font-semibold sm:block">Collab Concierge</span>
        </a>
        <div className="hidden items-center gap-7 text-[14px] font-medium md:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className={`transition-opacity hover:opacity-100 ${scrolled ? "opacity-70" : "opacity-75"}`}>
              {l.label}
            </a>
          ))}
        </div>
        <a href="#claim" className={`btn !rounded-[12px] !py-[9px] !pl-4 !pr-4 text-[14px] ${dark ? "btn-dark" : "btn-light"}`}>
          Get your link
        </a>
      </nav>
    </motion.header>
  );
}
