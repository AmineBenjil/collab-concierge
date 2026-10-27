"use client";

import { motion, useMotionValueEvent, useScroll } from "motion/react";
import { useState, type MouseEvent } from "react";
import { focusHandleInput } from "./HandleForm";
import Logo from "./Logo";
import { useControls } from "./controls";
import { useIntro } from "./IntroContext";

const LINKS = [
  { href: "#how", label: "How it works" },
  { href: "#checks", label: "What we check" },
  { href: "#creators", label: "Creators" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

// "Get your link" goes to the hero's handle field instead of jumping to the form at the bottom of the page
function focusHeroInput(e: MouseEvent<HTMLAnchorElement>) {
  if (focusHandleInput("#hero-claim")) e.preventDefault();
}

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
      className="fixed inset-x-0 top-0 z-50 flex justify-center sm:top-4 sm:px-2"
    >
      <nav
        aria-label="Main"
        // phones: an edge-to-edge bar pinned to the top (bottom hairline only); wider screens: the floating pill.
        // Scrolled, the pill narrows a little (1120 -> 1000) so the links keep their breathing room.
        className={`flex h-[58px] w-full items-center justify-between gap-6 rounded-[18px] border pl-4 pr-2 transition-all duration-500 ease-[cubic-bezier(.22,1,.36,1)] max-sm:h-14 max-sm:max-w-none max-sm:rounded-none max-sm:border-x-0 max-sm:border-t-0 max-sm:pr-3 ${
          scrolled
            ? "max-w-[1000px] border-[#e5e7eb]/70 bg-white/70 text-ink shadow-[0_20px_32px_-12px_rgba(50,38,98,0.22)] backdrop-blur-xl max-sm:bg-white/85 max-sm:shadow-[0_8px_20px_-14px_rgba(50,38,98,0.25)]"
            : dark
              ? "max-w-[1120px] border-ink/10 bg-white/50 text-ink backdrop-blur-md"
              : "max-w-[1120px] border-white/12 bg-white/[0.06] text-white backdrop-blur-md"
        }`}
      >
        <a href="#" className="flex shrink-0 items-center gap-3" aria-label="Benable Collab Concierge home">
          <Logo className={dark ? "text-ink" : "text-white"} />
          <span className={`hidden h-4 w-px sm:block ${dark ? "bg-ink/15" : "bg-white/25"}`} />
          <span className="hidden text-[14px] font-semibold sm:block">Collab Concierge</span>
        </a>
        <div className="hidden items-center gap-8 text-[14px] font-medium lg:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className={`transition-opacity hover:opacity-100 ${scrolled ? "opacity-70" : "opacity-75"}`}>
              {l.label}
            </a>
          ))}
        </div>
        <a href="#claim" onClick={focusHeroInput} className={`btn shrink-0 !rounded-[12px] !py-[9px] !pl-4 !pr-4 text-[14px] ${dark ? "btn-dark" : "btn-light"}`}>
          Get your link
        </a>
      </nav>
    </motion.header>
  );
}
