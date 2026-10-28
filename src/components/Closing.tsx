"use client";

import HandleForm from "./HandleForm";
import Logo from "./Logo";
import Reveal from "./Reveal";

export default function Closing() {
  return (
    <footer id="claim" className="relative scroll-mt-24 overflow-hidden">
      <div className="pointer-events-none absolute left-1/2 top-24 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(143,108,247,0.22),transparent)] blur-2xl" />
      <div className="dot-grid pointer-events-none absolute inset-x-0 top-0 h-[700px]" />

      <div className="container-x relative pt-28 sm:pt-36">
        <Reveal className="mx-auto flex max-w-[720px] flex-col items-center text-center">
          <span className="pill-label">Get started</span>
          <h2 className="section-title mt-6">
            Every collab DM, <span className="grad-text">handled.</span>
          </h2>
          <p className="section-sub mt-6">
            Send creators one link. We check who they really are. You just say yes or no.
          </p>
        </Reveal>

        <Reveal delay={0.1} className="mx-auto mt-10 flex max-w-[520px] justify-center">
          <HandleForm tone="light" />
        </Reveal>
      </div>

      {/* giant wordmark */}
      <div className="relative mt-20 sm:mt-28">
        <div className="container-x relative">
          <div
            className="mx-auto aspect-[146.26/29.76] w-full max-w-[1100px] bg-[linear-gradient(to_bottom,#d9d2ff,#f7f5ff)]"
            style={{ mask: "url(/img/brand/wordmark.svg) center / contain no-repeat", WebkitMask: "url(/img/brand/wordmark.svg) center / contain no-repeat" }}
            aria-hidden="true"
          />
        </div>

        {/* footer card */}
        <div className="container-x relative z-10 mt-4 pb-8 sm:-mt-16">
          <div className="rounded-[28px] border border-white/70 bg-white/75 p-7 shadow-[0_30px_60px_-30px_rgba(40,30,110,0.35)] backdrop-blur-xl sm:p-9">
            <div className="grid gap-8 sm:grid-cols-[1.3fr_1fr_1fr_1fr]">
              <div>
                <Logo className="text-ink" />
                <p className="mt-3 max-w-[280px] text-[14px] leading-relaxed text-ink-2">
                  Collab Concierge is a Benable product for brands and businesses. Benable is where a million creators share what they love.
                </p>
              </div>
              {[
                { h: "Product", l: [["How it works", "#how"], ["What we check", "#checks"], ["FAQ", "#faq"]] },
                { h: "Benable", l: [["benable.com", "https://benable.com"], ["Creators", "#creators"], ["Contact us", "https://benable.com"]] },
                { h: "Legal", l: [["Terms of Service", "https://benable.com"], ["Privacy Policy", "https://benable.com"]] },
              ].map((col) => (
                <div key={col.h}>
                  <div className="text-[14px] font-semibold">{col.h}</div>
                  <ul className="mt-3 space-y-2 text-[14px] text-ink-2">
                    {col.l.map(([t, h]) => (
                      <li key={t}>
                        <a href={h} className="transition-colors hover:text-ink">{t}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-col justify-between gap-2 border-t border-line pt-5 text-[13px] text-muted sm:flex-row">
              <span>© 2026 Happy Ventures Public Benefit Corporation</span>
              <span>For things worth sharing</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
