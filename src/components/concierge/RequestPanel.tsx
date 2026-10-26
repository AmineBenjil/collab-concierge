"use client";

import { RiArrowGoBackLine, RiArrowRightLine, RiCheckLine } from "@remixicon/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode, type RefObject } from "react";
import { forwardMessage, longDate, shortDate, type Check, type Creator, type Fit, type Social, type Status } from "./data";
import { useToast } from "./Shell";
import { getDeclineMessage, saveDeclineMessage } from "./store";
import { copyText, EASE } from "./ui";

type Props = {
  creator: Creator;
  status: Status;
  business: string;
  position: { index: number; total: number };
  onPrev?: () => void;
  onNext?: () => void;
  onClose: () => void;
  onDecide: (s: Status, sent?: boolean) => void;
};

/*
  One request, built to the Figma "Dialog (Dashboard · Collab Concierge)" frame: white cards
  stacked on a grey sheet. Who it is, the fit checker, what they want, Benable's review,
  how to reach them, then a note back to the Concierge.
  A side panel, so the list stays in view and ← → steps through requests.
*/
export default function RequestPanel(props: Props) {
  const { creator, onClose } = props;
  const reduce = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  /* scrolled: the content has moved under the header (shows the separator).
     compact: the bio is about to slide under it, so the header takes over the name */
  const [scrolled, setScrolled] = useState(false);
  const [compact, setCompact] = useState(false);

  /* hold the page still underneath, start keyboard focus on the panel, give it back on close */
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    const html = document.documentElement;
    const overflow = html.style.overflow;
    html.style.overflow = "hidden";
    html.style.setProperty("--toast-lift", "76px"); // toasts float above the panel's buttons
    closeRef.current?.focus({ preventScroll: true });
    return () => {
      html.style.overflow = overflow;
      html.style.removeProperty("--toast-lift");
      before?.focus?.({ preventScroll: true });
    };
  }, []);

  return (
    <motion.div className="fixed inset-0 z-[60]" initial="hidden" animate="shown" exit="hidden">
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 bg-black/30"
        variants={{ hidden: { opacity: 0 }, shown: { opacity: 1 } }}
        transition={{ duration: 0.35 }}
        onClick={onClose}
      />
      <motion.aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="absolute inset-y-0 right-0 flex w-full flex-col overflow-hidden bg-[#f2f2f2] leading-[normal] shadow-[0_40px_80px_-30px_rgba(22,26,53,0.45)] sm:inset-y-3 sm:right-3 sm:w-[min(540px,calc(100vw-24px))] sm:rounded-[24px]"
        variants={reduce ? { hidden: { opacity: 0 }, shown: { opacity: 1 } } : { hidden: { x: "104%" }, shown: { x: 0 } }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <header
          className={`relative z-10 mx-px mt-px flex h-16 shrink-0 items-center gap-3 border-b-[0.5px] bg-white pl-6 pr-2.5 transition-colors duration-200 sm:rounded-t-[23px] ${scrolled ? "border-[#e3e3e3]" : "border-transparent"}`}
        >
          <span id={titleId} className="sr-only">
            Collab request from {creator.name}
          </span>
          <AnimatePresence initial={false}>
            {compact && (
              <motion.div
                key={creator.id}
                aria-hidden="true"
                className="flex min-w-0 items-center gap-2.5"
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
                transition={{ duration: 0.24, ease: EASE }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={creator.avatar} alt="" className="size-8 shrink-0 rounded-full border border-white object-cover drop-shadow-[0_4px_7px_rgba(0,0,0,0.08)]" />
                <span className="truncate text-[15px]/[18px] font-semibold text-black">{creator.name}</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/img/request/verified.svg" alt="" width={16} height={16} className="shrink-0" />
              </motion.div>
            )}
          </AnimatePresence>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="ml-auto grid size-9 place-items-center rounded-[10px] transition-colors hover:bg-[#f1f1f4]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/request/close.svg" alt="" width={20} height={20} />
          </button>
        </header>

        <AnimatePresence mode="wait" initial={false}>
          <Body
            key={creator.id}
            {...props}
            onScrollState={(s, c) => {
              setScrolled(s);
              setCompact(c);
            }}
          />
        </AnimatePresence>
      </motion.aside>
    </motion.div>
  );
}

/* keyed by creator, so stepping to the next one starts fresh at the top */
function Body({ creator: c, status, business, onPrev, onNext, onClose, onDecide, onScrollState }: Props & { onScrollState: (scrolled: boolean, compact: boolean) => void }) {
  const [sheet, setSheet] = useState<null | "decline" | "forward">(null);
  const scroller = useRef<HTMLDivElement>(null);
  const bio = useRef<HTMLParagraphElement>(null);
  const report = useRef(onScrollState);
  useEffect(() => {
    report.current = onScrollState;
  });

  /* the header picks up the creator once the bio's last line is about to slide under it */
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const update = () => {
      const top = el.getBoundingClientRect().top;
      const end = bio.current?.getBoundingClientRect().bottom ?? Infinity;
      report.current(el.scrollTop > 0, end - top < 8);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    return () => el.removeEventListener("scroll", update);
  }, []);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (sheet) setSheet(null);
        else onClose();
        return;
      }
      const typing = (e.target as HTMLElement | null)?.closest?.("input, textarea, select, [contenteditable]");
      if (sheet || typing || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "ArrowLeft") onPrev?.();
      if (e.key === "ArrowRight") onNext?.();
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [sheet, onClose, onPrev, onNext]);

  return (
    <motion.div className="flex min-h-0 flex-1 flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
      <div ref={scroller} className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain">
        <Profile creator={c} bioRef={bio} />
        <FitChecker creator={c} status={status} />
        <Section className="flex flex-col gap-4">
          <Asking creator={c} />
          <Wants creator={c} />
        </Section>
        <Review creator={c} />
        <Section>
          <div className="flex flex-col gap-3">
            <Heading>Contact</Heading>
            <Contacts creator={c} />
          </div>
        </Section>
        <Feedback />
      </div>

      <Footer creator={c} status={status} onNext={onNext} onDecide={onDecide} onOpen={setSheet} />

      <AnimatePresence>
        {sheet === "decline" && (
          <Sheet key="decline" label={`Decline ${c.first}`} onClose={() => setSheet(null)}>
            <DeclineSheet
              creator={c}
              business={business}
              onCancel={() => setSheet(null)}
              onConfirm={() => {
                setSheet(null);
                onDecide("declined");
              }}
            />
          </Sheet>
        )}
        {sheet === "forward" && (
          <Sheet key="forward" label={`Move ${c.first} forward`} onClose={() => setSheet(null)}>
            <ForwardSheet
              creator={c}
              business={business}
              onCancel={() => setSheet(null)}
              onConfirm={(sent) => {
                setSheet(null);
                onDecide("forward", sent);
              }}
            />
          </Sheet>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ---------- pieces ---------- */

function Section({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`shrink-0 bg-white p-6 ${className}`}>{children}</section>;
}

/* 12px grey labels inside the profile card */
function Label({ children }: { children: ReactNode }) {
  return <p className="text-[12px]/[15px] font-medium text-[#73747a]">{children}</p>;
}

/* the 14px titles that head every other card */
function Heading({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 text-[14px] leading-4">
      <h3 className="font-semibold text-[#1c1c1c]">{children}</h3>
      {aside}
    </div>
  );
}

/* a hairline between rows, the Figma line asset */
function Rule({ src = "rule" }: { src?: "rule" | "rule-contact" }) {
  return (
    <div aria-hidden="true" className="relative h-0 w-full">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/img/request/${src}.svg`} alt="" width={468} height={0.5} className="absolute inset-x-0 top-[-0.5px] block h-[0.5px] w-full" />
    </div>
  );
}

/* "**4.8%** true engagement" → bold figures, as the review shows them */
function Rich({ text }: { text: string }) {
  return text.split(/\*\*(.+?)\*\*/).map((part, i) =>
    i % 2 ? (
      <b key={i} className="font-semibold text-[#3e3e3e]">
        {part}
      </b>
    ) : (
      part
    ),
  );
}

const SOCIAL: Record<Social, { label: string; href: (h: string) => string; icon: string }> = {
  instagram: { label: "Instagram", href: (h) => `https://www.instagram.com/${h}`, icon: "/img/request/ig.svg" },
  tiktok: { label: "TikTok", href: (h) => `https://www.tiktok.com/@${h}`, icon: "/img/request/tiktok.svg" },
};

function Socials({ list, handle }: { list: Social[]; handle: string }) {
  return (
    <ul className="flex h-6 shrink-0 items-center gap-3" aria-label="Social accounts">
      {list.map((s) => {
        const { label, href, icon } = SOCIAL[s];
        return (
          <li key={s}>
            <a href={href(handle)} target="_blank" rel="noreferrer" title={label} className="block size-6 transition-opacity hover:opacity-80">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={icon} alt={label} width={24} height={24} />
            </a>
          </li>
        );
      })}
    </ul>
  );
}

/* the Audience box reads short: "68% Los Angeles" → "Los Angeles", "82% women" → "Female" */
const strip = (s: string) => s.replace(/^[\d.]+%\s*/, "");
function audience(c: Creator) {
  const where = strip(c.audience);
  const location = c.audience === "Unknown" ? "—" : where === "United States" ? "USA" : where.charAt(0).toUpperCase() + where.slice(1);
  const age = c.age === "Unknown" ? "—" : c.age.replace(/\s*to\s*/, "-");
  const gender = /women/.test(c.gender) ? "Female" : /men/.test(c.gender) ? "Male" : "—";
  return { location, age, gender };
}

function Stat({ label, children, className = "" }: { label: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-center gap-1 text-[10px]/[12px] text-[#717171]">{label}</div>
      <div className="text-[13px] font-semibold leading-[15.6px] text-[#222]">{children}</div>
    </div>
  );
}

const statBox = "flex h-[60px] items-center justify-between rounded-[12px] border-[0.5px] border-[#e3e3e3] bg-[#fafafa]";

function Profile({ creator: c, bioRef }: { creator: Creator; bioRef: RefObject<HTMLParagraphElement | null> }) {
  const a = audience(c);
  return (
    <section className="flex shrink-0 flex-col gap-5 bg-white px-6 pb-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="size-14 shrink-0 overflow-hidden rounded-full border border-white bg-white drop-shadow-[0_4px_7px_rgba(0,0,0,0.08)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.avatar} alt="" className="size-full object-cover" />
          </span>
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-[16px]/[19px] font-semibold text-black">{c.name}</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/img/request/verified.svg" alt="Verified" width={16} height={16} className="shrink-0" />
            </div>
            <span className="truncate text-[12px]/[15px] text-[#999]">@{c.handle}</span>
          </div>
        </div>
        <Socials list={c.socials} handle={c.handle} />
      </div>

      <div className="flex flex-col gap-[7px]">
        <Label>Bio</Label>
        <p ref={bioRef} className="text-[14px]/[17px] text-[#1c1c1c]">{c.bio}</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-3 sm:w-[200px] sm:shrink-0">
          <Label>Social Stats</Label>
          <div className={`${statBox} px-[15.5px]`}>
            <Stat label="Followers">{c.followers}</Stat>
            <Stat
              label={
                <>
                  Engagement
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/img/request/info.svg" alt="" width={12} height={12} title="Average engagement on recent Instagram posts" />
                </>
              }
            >
              <span className="flex items-center gap-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/img/request/ig-small.svg" alt="Instagram" width={13} height={13} className="-m-[0.5px]" />
                {c.engagement}
              </span>
            </Stat>
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <Label>Audience</Label>
          <div className={`${statBox} pl-[15.5px] pr-[19.5px]`}>
            <Stat label="Location">{a.location}</Stat>
            <Stat label="Age Range">{a.age}</Stat>
            <Stat label="Gender">{a.gender}</Stat>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Label>Top verticals</Label>
        <ul className="flex flex-wrap gap-2">
          {c.verticals.map((v) => (
            <li key={v} className="flex h-[25px] items-center rounded-[30px] border-[0.5px] border-[#ebebf5] bg-[#f4f4f7] px-3 text-[12px] font-medium leading-none text-[#161a35]">
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-[12px] font-medium leading-[14px] text-[#73747a]">Recent content</p>
        <div className="flex h-[118px] gap-3">
          {c.posts.map((p) => (
            <div key={p} className="min-w-0 flex-1 overflow-hidden rounded-[8px] border-[0.5px] border-[#e3e3e3] bg-[#f1f1f4]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p} alt="" loading="lazy" className="size-full object-cover" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/*
  The fit gauge: four arcs on one circle, the active one in full color, a needle pointing at it.
  Geometry is the Figma frame's, measured: 95×75 box, arcs r 43.45 around (47.45, 46.55),
  needle pivots on the dot at (47.45, 42.75).
*/
const ARCS: { from: number; to: number; pale: string }[] = [
  { from: 149.99, to: 200.39, pale: "#FFDADE" },
  { from: -147.51, to: -97.11, pale: "#F4E6D3" },
  { from: -82.77, to: -32.37, pale: "#EDF5CE" },
  { from: -20.42, to: 29.98, pale: "#D8EDDB" },
];

const GAUGE: Record<Fit, { label: string; arc: number; color: string; needle: number; box: string; boxText: string; pill: string }> = {
  strong: { label: "Strong fit", arc: 3, color: "#3CA44F", needle: 7.48, box: "#f2fef7", boxText: "#3f5c3a", pill: "#3ca44f" },
  maybe: { label: "Maybe", arc: 1, color: "#E9A23B", needle: -122.3, box: "#fff9ef", boxText: "#6b4b16", pill: "#e9a23b" },
  no: { label: "Not a fit", arc: 0, color: "#E5484D", needle: 175.2, box: "#fff4f5", boxText: "#7d2f39", pill: "#e5484d" },
};

const CX = 47.455;
const CY = 46.55;
const R = 43.45;
const PIVOT = { x: 47.45, y: 42.75 };

function arcPath(from: number, to: number) {
  const pt = (deg: number) => {
    const r = (deg * Math.PI) / 180;
    return `${(CX + R * Math.cos(r)).toFixed(2)} ${(CY + R * Math.sin(r)).toFixed(2)}`;
  };
  return `M ${pt(from)} A ${R} ${R} 0 0 1 ${pt(to)}`;
}

function Gauge({ fit }: { fit: Fit }) {
  const g = GAUGE[fit];
  const reduce = useReducedMotion();
  const rad = (g.needle * Math.PI) / 180;
  const at = (d: number) => ({ x: PIVOT.x + d * Math.cos(rad), y: PIVOT.y + d * Math.sin(rad) });
  const [a, b] = [at(3.25), at(42.1)];
  return (
    <svg width={95} height={75} viewBox="0 0 95 75" overflow="visible" aria-hidden="true">
      {ARCS.map((arc, i) => (
        <path key={i} d={arcPath(arc.from, arc.to)} stroke={i === g.arc ? g.color : arc.pale} strokeWidth={7} strokeLinecap="round" fill="none" />
      ))}
      <motion.line
        x1={a.x}
        y1={a.y}
        x2={b.x}
        y2={b.y}
        stroke="black"
        strokeWidth={3}
        strokeLinecap="round"
        style={{ transformOrigin: `${PIVOT.x}px ${PIVOT.y}px`, transformBox: "view-box" }}
        initial={reduce ? false : { rotate: 175.2 - g.needle }}
        animate={{ rotate: 0 }}
        transition={{ duration: 1.1, ease: EASE, delay: 0.2 }}
      />
      <circle cx={PIVOT.x} cy={PIVOT.y} r={4} fill="white" stroke="black" strokeWidth={2} />
    </svg>
  );
}

function FitChecker({ creator: c, status }: { creator: Creator; status: Status }) {
  const g = GAUGE[c.fit];
  const aside =
    status === "forward" ? (
      <span className="inline-flex items-center gap-1 font-medium text-[#3ca44f]">
        <RiCheckLine size={15} aria-hidden="true" /> Moving forward
      </span>
    ) : status === "declined" ? (
      <span className="font-medium text-[#aaa]">Declined</span>
    ) : (
      <span className="text-[#aaa]">{longDate(c.requested)}</span>
    );
  return (
    <Section>
      <div className="flex flex-col gap-3">
        <Heading aside={aside}>Fit checker</Heading>
        <div className="relative z-10 grid h-[153px] place-items-center rounded-[12px] border-[0.5px] border-[#e3e3e3] bg-white">
          <div className="flex w-[95px] flex-col items-center gap-3">
            <Gauge fit={c.fit} />
            <p className="w-full text-center text-[16px]/[19px] font-bold" style={{ color: g.color }}>
              {g.label}
            </p>
          </div>
        </div>
      </div>
      <p
        className="-mt-[39px] rounded-b-[12px] outline-solid outline-[0.5px] -outline-offset-[0.5px] outline-[#e3e3e3] px-[25px] pb-[11px] pt-[51px] text-center text-[14px]/[17px]"
        style={{ background: g.box, color: g.boxText }}
      >
        {c.verdict}
      </p>
    </Section>
  );
}

/* a stable, made-up time for the DM stamp, so it doesn't change between renders */
function stamp(c: Creator) {
  const n = [...c.id].reduce((s, ch) => s + ch.charCodeAt(0), 0);
  return `${shortDate(c.requested).toUpperCase()} AT ${9 + (n % 9)}:${String(n % 60).padStart(2, "0")}`;
}

function Asking({ creator: c }: { creator: Creator }) {
  return (
    <div className="flex flex-col gap-3">
      <Heading>What they&apos;re asking</Heading>
      <div className="flex flex-col gap-4 rounded-[12px] outline-solid outline-[0.5px] -outline-offset-[0.5px] outline-[#e3e3e3] bg-[#fafafa] pb-[15px] pt-5 font-[-apple-system,'SF_Pro_Text','SF_Pro','Helvetica_Neue',Inter,sans-serif]">
        <p className="text-center text-[10px]/[12px] text-[#6f7376]">{stamp(c)}</p>
        <div className="flex items-end gap-2.5 pl-3 pr-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={c.avatar} alt="" width={24} height={24} className="size-6 shrink-0 rounded-full object-cover" />
          <p className="min-w-0 flex-1 rounded-[16px] bg-[#eef2f5] p-3 text-[14px]/[17px] tracking-[-0.3px] text-[#0f1316]">{c.proposal.create}</p>
        </div>
      </div>
    </div>
  );
}

/* an icon, a bold label, and the value tucked under it */
function Row({ icon, label, children }: { icon: string; label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={icon} alt="" width={20} height={20} className="shrink-0" />
        <span className="text-[14px]/[17px] font-semibold text-[#1c1c1c]">{label}</span>
      </div>
      <div className="pl-8 text-[14px]/[17px] text-[#717171]">{children}</div>
    </div>
  );
}

function Wants({ creator: c }: { creator: Creator }) {
  const rows = [
    { icon: "/img/request/want.svg", label: "They'd like", value: c.proposal.want },
    { icon: "/img/request/payment.svg", label: "Payment", value: c.proposal.payment, warn: c.proposal.payment.startsWith("Yes") },
    { icon: "/img/request/based.svg", label: "Based in", value: c.proposal.based },
    ...(c.proposal.extra ? [{ icon: "/img/request/extra.svg", label: "Anything else", value: c.proposal.extra }] : []),
  ];
  return (
    <div className="flex flex-col gap-3">
      <Heading>What they&apos;d like from you</Heading>
      <div className="flex flex-col gap-[13.33px] rounded-[12px] outline-solid outline-[0.5px] -outline-offset-[0.5px] outline-[#e3e3e3] bg-[#fafafa] p-3">
        {rows.map((r, i) => (
          <div key={r.label} className="contents">
            {i > 0 && <Rule />}
            <Row icon={r.icon} label={r.label}>
              <span className={r.warn ? "font-medium text-[#c23a56]" : undefined}>{r.value}</span>
            </Row>
          </div>
        ))}
      </div>
    </div>
  );
}

const GRADE: Record<Check["tone"], string> = {
  good: "border-[#c7e1c6] bg-[#e3f9e2] text-[#175412]",
  ok: "border-[#f1dcb5] bg-[#fdf3e1] text-[#8a5208]",
  bad: "border-[#f4c9d1] bg-[#fde9ec] text-[#a3243f]",
  unknown: "border-[#ebebf5] bg-[#f4f4f7] text-[#73747a]",
};

function Review({ creator: c }: { creator: Creator }) {
  const g = GAUGE[c.fit];
  return (
    <Section>
      <div className="flex flex-col gap-3">
        <Heading
          aside={
            <span className="flex h-[30px] items-center rounded-full border border-white px-4 text-[14px] font-medium leading-none text-white" style={{ background: g.pill }}>
              {g.label}
            </span>
          }
        >
          In-depth Benable review
        </Heading>
        <ul className="flex flex-col gap-2 rounded-[12px] outline-solid outline-[0.5px] -outline-offset-[0.5px] outline-[#e3e3e3] bg-[#fafafa] p-3">
          {c.review.map((r, i) => (
            <li key={r.label} className="contents">
              {i > 0 && <Rule />}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[14px]/[17px] font-semibold text-[#1c1c1c]">{r.label}</span>
                  <span className={`flex h-[23px] shrink-0 items-center rounded-[6px] border-[0.5px] px-2.5 text-[12px] font-medium leading-none ${GRADE[r.tone]}`}>{r.grade}</span>
                </div>
                <p className="text-[12px]/[15px] text-[#717171]">
                  <Rich text={r.note} />
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

function CopyLink({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const t = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(t.current), []);
  return (
    <button
      type="button"
      aria-label={copied ? `Copied ${label}` : `Copy ${label}`}
      onClick={() =>
        copyText(text, () => {
          setCopied(true);
          clearTimeout(t.current);
          t.current = setTimeout(() => setCopied(false), 1800);
        })
      }
      className="shrink-0 text-[14px]/[17px] font-semibold text-[#7a5cfa] transition-opacity hover:opacity-75"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function Contacts({ creator: c, className = "" }: { creator: Creator; className?: string }) {
  const rows: { label: string; value: string; href?: string; icon: string }[] = [{ label: "Email", value: c.email, href: `mailto:${c.email}`, icon: "/img/request/email.svg" }];
  if (c.phone) rows.push({ label: "Phone", value: c.phone, href: `tel:${c.phone.replace(/[^\d+]/g, "")}`, icon: "/img/request/phone.svg" });
  rows.push({ label: "Instagram", value: `@${c.handle}`, href: `https://www.instagram.com/${c.handle}`, icon: "/img/request/instagram.svg" });

  return (
    <ul className={`flex flex-col items-center gap-0.5 rounded-[12px] outline-solid outline-[0.5px] -outline-offset-[0.5px] outline-[#e3e3e3] bg-[#fafafa] px-3 py-1 ${className}`}>
      {rows.map(({ label, value, href, icon }, i) => (
        <li key={label} className="contents">
          {i > 0 && <Rule src="rule-contact" />}
          <div className="flex w-full items-center justify-between gap-3 py-2">
            <Row icon={icon} label={label}>
              <a href={href} target={href?.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="block truncate underline-offset-4 hover:underline">
                {value}
              </a>
            </Row>
            <CopyLink text={value} label={label.toLowerCase()} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function Feedback() {
  const say = useToast();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const send = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    say("Thanks. Your Concierge will use that next time.");
    setText("");
    setOpen(false);
  };
  return (
    <Section>
      <div className="flex flex-col items-start gap-3">
        <Heading>Make your Concierge smarter</Heading>
        <p className="text-[14px] leading-[22.75px] text-[#717171]">Tell it what you liked or didn&apos;t about this creator, or about its take on them. Every note sharpens the next one.</p>
        {open ? (
          <form onSubmit={send} className="w-full">
            <textarea
              autoFocus
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What was right, what was off, what it should weigh more next time"
              className="w-full resize-none rounded-[12px] border-[0.5px] border-[#e3e3e3] bg-[#fafafa] px-3.5 py-3 text-[14px] leading-relaxed text-[#1c1c1c] outline-2 outline-transparent transition-[outline-color] duration-200 placeholder:text-[#aaa] focus:outline-[#7a5cfa]"
            />
            <div className="mt-2 flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className={soft}>
                Cancel
              </button>
              <button type="submit" disabled={!text.trim()} className={`${solid} disabled:opacity-25`}>
                Send
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex h-10 items-center justify-center rounded-[12px] border border-[#e3e3e3] bg-white px-4 text-[14.5px] font-medium leading-[21.75px] text-[#161a35] transition-colors hover:bg-[#fafafa]"
          >
            Give us feedback
          </button>
        )}
      </div>
    </Section>
  );
}

/* the two buttons from the Figma footer: soft grey, and solid violet */
const soft = "inline-flex h-10 items-center justify-center gap-1.5 rounded-[11px] bg-[#f1f1f1] px-4 text-[14.5px] font-medium leading-[21.75px] text-[#161a35] transition-colors hover:bg-[#e8e8e8]";
const solid = "inline-flex h-10 items-center justify-center gap-1.5 rounded-[11px] bg-[#7a5cfa] px-4 text-[14.5px] font-medium leading-[21.75px] text-white transition-[background-color,transform] duration-200 hover:bg-[#6c4ef0] active:scale-[0.985]";

function Footer({ creator: c, status, onNext, onDecide, onOpen }: { creator: Creator; status: Status; onNext?: () => void; onDecide: Props["onDecide"]; onOpen: (s: "decline" | "forward") => void }) {
  const next = onNext && (
    <button type="button" onClick={onNext} aria-label="Next request" className={`${soft} !px-3`}>
      <RiArrowRightLine size={17} aria-hidden="true" />
    </button>
  );
  const back = (
    <button type="button" onClick={() => onDecide("new")} className={soft}>
      <RiArrowGoBackLine size={15} aria-hidden="true" />
      Back to requests
    </button>
  );

  return (
    <div className="flex shrink-0 items-center justify-end gap-2 border-t border-[#ececf1] bg-white px-6 pb-[max(14px,env(safe-area-inset-bottom))] pt-3.5">
      {status === "new" ? (
        <>
          <button type="button" onClick={() => onOpen("decline")} className={soft}>
            Decline
          </button>
          <button type="button" onClick={() => onOpen("forward")} className={`${solid} w-[216px]`}>
            Move forward
          </button>
        </>
      ) : status === "forward" ? (
        <>
          {back}
          <a href={`mailto:${c.email}`} className={`${solid} ml-auto`}>
            Email {c.first}
          </a>
          {next}
        </>
      ) : (
        <>
          <span className="mr-auto min-w-0 truncate text-[13.5px] text-[#717171]">Declined. Your message went out.</span>
          {back}
          {next}
        </>
      )}
    </div>
  );
}

/* a sheet that rises inside the panel, over a dimmed request */
function Sheet({ label, onClose, children }: { label: string; onClose: () => void; children: ReactNode }) {
  return (
    <motion.div className="absolute inset-0 z-10 flex flex-col justify-end" initial="hidden" animate="shown" exit="hidden">
      <motion.div aria-hidden="true" className="absolute inset-0 bg-[#161a35]/20" variants={{ hidden: { opacity: 0 }, shown: { opacity: 1 } }} transition={{ duration: 0.3 }} onClick={onClose} />
      <motion.div
        role="dialog"
        aria-label={label}
        className="relative max-h-[90%] overflow-y-auto rounded-t-[24px] bg-white px-6 pb-[max(20px,env(safe-area-inset-bottom))] pt-6 shadow-[0_-24px_60px_-24px_rgba(22,26,53,0.35)] sm:px-8"
        variants={{ hidden: { y: "100%" }, shown: { y: 0 } }}
        transition={{ duration: 0.45, ease: EASE }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

function SheetTitle({ title, sub }: { title: string; sub: string }) {
  return (
    <>
      <div className="text-[19px] font-medium tracking-[-0.015em] text-ink">{title}</div>
      <p className="mt-1 text-[14.5px] text-muted">{sub}</p>
    </>
  );
}

const box = "w-full resize-none rounded-[14px] border border-[#ececf1] bg-[#f9f9fb] px-4 py-3 text-[14.5px] leading-relaxed text-ink outline-2 outline-transparent transition-[outline-color] duration-200 focus:outline-[#8f7cf7]";

function DeclineSheet({ creator: c, business, onCancel, onConfirm }: { creator: Creator; business: string; onCancel: () => void; onConfirm: () => void }) {
  const [msg, setMsg] = useState(() => getDeclineMessage(business));
  const [editing, setEditing] = useState(false);
  return (
    <>
      <SheetTitle title={`Decline ${c.first}?`} sub={`Your Concierge sends this to ${c.first} right away.`} />
      {editing ? (
        <textarea autoFocus rows={4} value={msg} onChange={(e) => setMsg(e.target.value)} aria-label="Your decline message" className={`${box} mt-4`} />
      ) : (
        <p className="mt-4 rounded-[14px] border border-[#ececf1] bg-[#f9f9fb] px-4 py-3 text-[14.5px] leading-relaxed text-ink">{msg}</p>
      )}
      {!editing && (
        <button type="button" onClick={() => setEditing(true)} className="mt-2.5 text-[14px] font-medium text-ink-2 underline decoration-[#d8d8df] underline-offset-4 hover:text-ink hover:decoration-ink">
          Edit your decline message
        </button>
      )}
      <div className="mt-6 flex justify-between gap-2">
        <button type="button" onClick={onCancel} className={soft}>
          Cancel
        </button>
        <button
          type="button"
          autoFocus={!editing}
          disabled={!msg.trim()}
          onClick={() => {
            if (editing) saveDeclineMessage(msg);
            onConfirm();
          }}
          className={`${solid} disabled:opacity-25`}
        >
          Decline and send
        </button>
      </div>
    </>
  );
}

function ForwardSheet({ creator: c, business, onCancel, onConfirm }: { creator: Creator; business: string; onCancel: () => void; onConfirm: (sent: boolean) => void }) {
  const [notify, setNotify] = useState(true);
  const [msg, setMsg] = useState(() => forwardMessage(c.first, business));
  const id = useId();
  return (
    <>
      <SheetTitle title={`Great news for ${c.first} 🎉`} sub={`Here's how to reach ${c.first} directly. Tap to open, or copy.`} />
      <Contacts creator={c} className="mt-4" />
      <label htmlFor={id} className="mt-5 flex cursor-pointer items-center gap-3">
        <input id={id} type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="h-[18px] w-[18px] shrink-0 cursor-pointer accent-[#111]" />
        <span className="text-[14.5px] text-ink">Also let {c.first} know you&apos;re moving forward</span>
      </label>
      <AnimatePresence initial={false}>
        {notify && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: EASE }} className="overflow-hidden">
            <textarea rows={3} value={msg} onChange={(e) => setMsg(e.target.value)} aria-label={`Message to ${c.first}`} className={`${box} mt-3`} />
          </motion.div>
        )}
      </AnimatePresence>
      <div className="mt-6 flex justify-between gap-2">
        <button type="button" onClick={onCancel} className={soft}>
          Cancel
        </button>
        <button type="button" autoFocus onClick={() => onConfirm(notify && !!msg.trim())} className={solid}>
          Move forward
        </button>
      </div>
    </>
  );
}
