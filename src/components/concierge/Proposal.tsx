"use client";

import type { Creator } from "./data";

/*
  "Their proposal": the creator's answers from the apply form, laid out for the brand.
  Tony asked for options, so the section comes in versions the reviewer can flip between
  (the switcher sits beside the dialog). "now" is the original Design Labs 15524:60982 build.
*/
export type ProposalVersion = "now" | "deal" | "quote";

export const PROPOSAL_VERSIONS: { id: ProposalVersion; name: string }[] = [
  { id: "now", name: "Current" },
  { id: "deal", name: "Option A" },
  { id: "quote", name: "Option B" },
];

/* the form's answers, with "Not stated" read as no answer */
function read(c: Creator) {
  const p = c.proposal;
  const paid = p.payment.startsWith("Yes");
  const stated = (s?: string) => (s && s !== "Not stated" ? s : null);
  return { paid, create: p.create, want: stated(p.want), extra: stated(p.extra) };
}

export default function Proposal({ creator: c, version }: { creator: Creator; version: ProposalVersion }) {
  if (version === "deal") return <Deal creator={c} />;
  if (version === "quote") return <Quote creator={c} />;
  return <Now creator={c} />;
}

function Title() {
  return <h3 className="text-[16px]/[16px] font-bold text-[#1c1c1c]">Their proposal</h3>;
}

/* ---------- Current: each answer under its question, in grey boxes ---------- */

function Now({ creator: c }: { creator: Creator }) {
  const rows = [
    { label: "Payment", value: c.proposal.payment, warn: c.proposal.payment.startsWith("Yes") },
    { label: "What they'd create or do for you", value: c.proposal.create },
    { label: "What they'd like from you", value: c.proposal.want },
    ...(c.proposal.extra ? [{ label: "Anything else", value: c.proposal.extra }] : []),
  ];
  return (
    <section className="flex shrink-0 flex-col gap-4 bg-white p-6">
      <Title />
      {rows.map((r) => (
        <div key={r.label} className="flex flex-col gap-2">
          <p className="text-[14px]/[16px] font-medium text-[#1c1c1c]">{r.label}</p>
          <p
            className={`rounded-[8px] border-[0.5px] border-[#e3e3e3] bg-[#f4f4f4] p-3 text-[14px] leading-[normal] shadow-[0_4px_32px_0_rgba(0,0,0,0.04)] ${r.warn ? "font-medium text-[#c23a56]" : "text-[#717171]"}`}
          >
            {r.value}
          </p>
        </div>
      ))}
    </section>
  );
}

/* ---------- Option A (P-B mockup): the form's answers in a two-column list, payment as a pill ---------- */

function Deal({ creator: c }: { creator: Creator }) {
  const p = read(c);
  const rows = [
    {
      label: "Payment",
      value: (
        <span
          className={`inline-flex h-[23px] items-center rounded-[6px] border-[0.5px] px-2.5 text-[12px] font-medium leading-none ${p.paid ? "border-[#ecd6a9] bg-[#fdf3e1] text-[#7a4806]" : "border-[#c7e1c6] bg-[#e3f9e2] text-[#175412]"}`}
        >
          {p.paid ? c.proposal.payment : "No fee"}
        </span>
      ),
    },
    { label: "They'd create", value: p.create },
    { label: "They'd like", value: p.want ?? <span className="text-[#8a8a92]">Not stated</span> },
    ...(p.extra ? [{ label: "Anything else", value: p.extra }] : []),
  ];
  return (
    <section className="flex shrink-0 flex-col gap-2 bg-white px-6 pb-3 pt-6">
      <h3 className="text-[16px]/[20px] font-bold text-[#1c1c1c]">Their proposal</h3>
      <dl className="flex flex-col">
        {rows.map((r, i) => (
          <div key={r.label} className={`grid grid-cols-[104px_minmax(0,1fr)] items-baseline gap-4 py-3 ${i > 0 ? "border-t-[0.5px] border-[#e3e3e3]" : ""}`}>
            <dt className="text-[13px]/[18px] text-[#6b6b73]">{r.label}</dt>
            <dd className="text-[15px]/[22px] text-[#1c1c1c]">{r.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/* ---------- Option B (Design Labs 15585:51673): a glowing payment banner, then the form's questions in order ---------- */

/* the banner's light rays, the Figma line assets placed as drawn on its 492×108 frame; the right fan mirrors the left */
const RAYS = [
  { src: "/img/proposal/ray-1.svg", box: "left-[21.19px] top-[-27.47px] h-[153.947px] w-[216.97px]", turn: "rotate-[144.56deg] scale-y-92 skew-x-[22.46deg]", line: "h-[6.539px] w-[259.509px]", inset: "inset-[-389.3%_-4.82%_-489.3%_-4.63%]" },
  { src: "/img/proposal/ray-4.svg", box: "left-[-34.19px] top-[-32px] h-[91.363px] w-[283.487px]", turn: "rotate-[162.8deg] scale-y-95 skew-x-[17.54deg]", line: "h-[5.605px] w-[293.413px]", inset: "inset-[-470.88%_-4.22%_-570.88%_-4.1%]" },
  { src: "/img/proposal/ray-3.svg", box: "left-[121.18px] top-[-28.01px] h-[192.954px] w-[123.959px]", turn: "rotate-[121.47deg] scale-y-96 skew-x-[16.19deg]", line: "h-[7.29px] w-[223.976px]", inset: "inset-[-338.81%_-5.65%_-438.81%_-5.37%]" },
  { src: "/img/proposal/ray-1.svg", box: "left-[253.84px] top-[-27.47px] h-[153.947px] w-[216.97px]", turn: "-scale-y-92 rotate-[35.44deg] skew-x-[-22.46deg]", line: "h-[6.539px] w-[259.509px]", inset: "inset-[-389.3%_-4.82%_-489.3%_-4.63%]" },
  { src: "/img/proposal/ray-4.svg", box: "left-[242.71px] top-[-32px] h-[91.363px] w-[283.487px]", turn: "-scale-y-95 rotate-[17.2deg] skew-x-[-17.54deg]", line: "h-[5.605px] w-[293.413px]", inset: "inset-[-470.88%_-4.22%_-570.88%_-4.1%]" },
  { src: "/img/proposal/ray-3.svg", box: "left-[246.87px] top-[-28.01px] h-[192.954px] w-[123.959px]", turn: "-scale-y-96 rotate-[58.53deg] skew-x-[-16.19deg]", line: "h-[7.29px] w-[223.976px]", inset: "inset-[-338.81%_-5.65%_-438.81%_-5.37%]" },
  { src: "/img/proposal/ray-2.svg", box: "left-[238.22px] top-[-30px] h-[206.389px] w-[7.598px]", turn: "rotate-90", line: "h-[7.598px] w-[206.389px]", inset: "inset-[-189.48%_-5.99%_-289.48%_-5.82%]" },
];

function Quote({ creator: c }: { creator: Creator }) {
  const p = read(c);
  const steps = [
    { q: "What they'd create or do for you", a: p.create },
    { q: "What they'd like from you", a: p.want },
    ...(p.extra ? [{ q: "Anything else they'd like to add", a: p.extra }] : []),
  ];
  return (
    <section className="flex shrink-0 flex-col gap-6 bg-white p-6">
      <div className="flex flex-col gap-4">
        <h3 className="text-[16px] font-bold leading-[normal] text-[#1c1c1c]">Their proposal</h3>
        <div className="relative h-[108px] w-full overflow-clip rounded-[12px] border-[0.5px] border-[#dec9f2]">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/proposal/glow.png" alt="" className="absolute left-[-1.62%] top-[-175.44%] h-[433.48%] w-[102.92%] max-w-none" />
            <div className="absolute inset-0 bg-white/70" />
            {/* held on the frame's 492px and centered, so the fan stays symmetric when a scrollbar narrows the card */}
            <div className="absolute inset-y-0 left-1/2 w-[492px] -translate-x-1/2">
              {RAYS.map((r, i) => (
                <div key={i} className={`absolute flex items-center justify-center ${r.box}`}>
                  <div className={`flex-none ${r.turn}`}>
                    <div className={`relative ${r.line}`}>
                      <div className={`absolute ${r.inset}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={r.src} alt="" className="block size-full max-w-none" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-3 whitespace-nowrap text-center leading-[normal]">
            <p className="text-[14px] font-medium text-[#776582]">Payment</p>
            <p className="font-display text-[32px] font-extrabold uppercase text-[#7a5cfa] [text-box-edge:cap_alphabetic] [text-box-trim:trim-both]">
              {p.paid ? c.proposal.payment.replace(/^Yes,\s*/, "") : "$0 fee"}
            </p>
          </div>
        </div>
      </div>
      <ol className="flex flex-col">
        {steps.map((s, i) => {
          const last = i === steps.length - 1;
          return (
            <li key={s.q} className="flex gap-[18px]">
              <div className="flex w-7 shrink-0 flex-col items-center">
                <span className="grid size-7 place-items-center rounded-full bg-[#f2f0ff] text-center text-[14px] font-semibold leading-[normal] text-[#645993]">{i + 1}</span>
                {!last && <span aria-hidden="true" className="w-px grow bg-[#f2f0ff]" />}
              </div>
              <div className={`flex min-w-0 flex-col gap-2 leading-[normal] ${last ? "" : "pb-6"}`}>
                <span className="text-[14px] font-medium text-[#645993]">{s.q}</span>
                <p className={`text-[16px] ${s.a ? "text-[#1c1c1c]" : "text-[#8a8a92]"}`}>{s.a ?? "Not stated"}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/* ---------- the version switcher, floated beside the dialog ---------- */

export function ProposalSwitcher({ value, onChange }: { value: ProposalVersion; onChange: (v: ProposalVersion) => void }) {
  return (
    <div role="radiogroup" aria-label="Proposal design" className="flex w-[148px] flex-col gap-1 rounded-[16px] bg-white p-2 shadow-[0_20px_40px_-20px_rgba(22,26,53,0.4)]">
      <p className="px-2 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#999]">Their proposal</p>
      {PROPOSAL_VERSIONS.map((v) => {
        const on = v.id === value;
        return (
          <button
            key={v.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(v.id)}
            className={`flex flex-col items-start rounded-[10px] px-2.5 py-2 text-left transition-colors ${on ? "bg-[#f3f0ff]" : "hover:bg-[#f6f6f8]"}`}
          >
            <span className={`text-[14px]/[17px] font-semibold ${on ? "text-[#5b3fe0]" : "text-[#1c1c1c]"}`}>{v.name}</span>
          </button>
        );
      })}
    </div>
  );
}
