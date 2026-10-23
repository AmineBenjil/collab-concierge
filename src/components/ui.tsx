import { RiArrowRightLine, RiCheckLine, RiCloseLine } from "@remixicon/react";
import type { ReactNode } from "react";
import Reveal from "./Reveal";

export function Arrow({ dark = false }: { dark?: boolean }) {
  return (
    <span className="btn-arrow" style={{ background: dark ? "var(--ink)" : "#fff" }}>
      <RiArrowRightLine size={14} color={dark ? "#fff" : "var(--ink)"} aria-hidden="true" />
    </span>
  );
}

export function SectionHead({
  label,
  title,
  sub,
  dark = false,
  className = "",
}: {
  label: string;
  title: ReactNode;
  sub?: ReactNode;
  dark?: boolean;
  className?: string;
}) {
  return (
    <Reveal className={`mx-auto flex max-w-[820px] flex-col items-center text-center ${className}`}>
      <span className={`pill-label ${dark ? "pill-label-dark" : ""}`}>{label}</span>
      <h2 className={`section-title mt-6 ${dark ? "on-dark" : ""}`}>{title}</h2>
      {sub && <p className={`section-sub mt-6 ${dark ? "on-dark" : ""}`}>{sub}</p>}
    </Reveal>
  );
}

export function Check({ tone = "mint" }: { tone?: "mint" | "rose" }) {
  return (
    <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-white ${tone === "mint" ? "bg-mint" : "bg-rose"}`}>
      {tone === "mint" ? (
        <RiCheckLine size={13} color="#fff" aria-hidden="true" />
      ) : (
        <RiCloseLine size={13} color="#fff" aria-hidden="true" />
      )}
    </span>
  );
}
