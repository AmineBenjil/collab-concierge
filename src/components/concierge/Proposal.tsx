"use client";

import type { Creator } from "./data";

/*
  "Their proposal": the creator's answers from the apply form, laid out for the brand as a two-column
  list (the P-B mockup Tony picked), payment as a pill. "Not stated" reads as no answer.
*/
export default function Proposal({ creator: c }: { creator: Creator }) {
  const p = c.proposal;
  const paid = p.payment.startsWith("Yes");
  const stated = (s?: string) => (s && s !== "Not stated" ? s : null);
  const want = stated(p.want);
  const extra = stated(p.extra);
  const rows = [
    {
      label: "Payment",
      value: (
        <span
          className={`inline-flex h-[23px] items-center rounded-[6px] border-[0.5px] px-2.5 text-[12px] font-medium leading-none ${paid ? "border-[#ecd6a9] bg-[#fdf3e1] text-[#7a4806]" : "border-[#c7e1c6] bg-[#e3f9e2] text-[#175412]"}`}
        >
          {paid ? p.payment : "No fee"}
        </span>
      ),
    },
    { label: "Their offer", value: p.create },
    { label: "Their ask", value: want ?? <span className="text-[#8a8a92]">Not stated</span> },
    ...(extra ? [{ label: "Anything else", value: extra }] : []),
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
