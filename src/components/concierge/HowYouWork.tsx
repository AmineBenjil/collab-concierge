"use client";

import { RiBox3Line, RiGift2Line, RiMapPin2Line, type RemixiconComponentType } from "@remixicon/react";
import { useId, type ReactNode } from "react";
import type { AddressAsk } from "../controls";

/*
  The "How you work with creators" stage on Customize: two settings that shape what creators are asked, each
  under its own label. How they meet the business (it ships them products, or they come by) picks the
  address step; leaning on gifted collabs adds a note to the payment question. Icons sit in one column on
  the left of both, the control on the right.
*/

type Mode = { id: AddressAsk; title: string; hint: string; icon: RemixiconComponentType };
const MODES: Mode[] = [
  { id: "shipping", title: "Ship them products", hint: "Creators give a shipping address.", icon: RiBox3Line },
  { id: "local", title: "They visit in person", hint: "Creators say how far they’d come from.", icon: RiMapPin2Line },
];

export const modeTitle = (a: AddressAsk) => MODES.find((m) => m.id === a)!.title;

const HAIRLINE = "rounded-[16px] shadow-[inset_0_0_0_0.5px_#e3e3e3]";
const ROW = "flex w-full items-center gap-3.5 px-4 py-3.5 text-left";

export default function HowYouWork({ address, onAddress, gifted, onGifted }: { address: AddressAsk; onAddress: (v: AddressAsk) => void; gifted: boolean; onGifted: (v: boolean) => void }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-5">
      <Group id={`${id}-mode`} label="How creators work with you">
        {/* the hairline is drawn over the rows (they carry their own fill), so the lit row doesn't paint over it */}
        <div role="radiogroup" aria-labelledby={`${id}-mode`} className="relative overflow-hidden rounded-[16px] bg-[#fafafa]">
          {MODES.map((m, i) => {
            const on = address === m.id;
            return (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => onAddress(m.id)}
                className={`${ROW} transition-colors duration-200 ${i < MODES.length - 1 ? "border-b border-[#fcfcfc]" : ""} ${on ? "bg-lilac" : "hover:bg-[#f4f4f6]"}`}
              >
                <Icon icon={m.icon} on={on} tile="bg-white" />
                <Text title={m.title} hint={m.hint} />
                {/* a grey ring when off; filled purple around a white dot when on */}
                <span
                  aria-hidden="true"
                  className={`size-4 shrink-0 rounded-full bg-white transition-[box-shadow] duration-200 ${on ? "shadow-[inset_0_0_0_5px_#7a5cfa]" : "shadow-[inset_0_0_0_1.5px_#c6c6c6]"}`}
                />
              </button>
            );
          })}
          <span aria-hidden="true" className={`pointer-events-none absolute inset-0 ${HAIRLINE}`} />
        </div>
      </Group>

      <Group id={`${id}-pay`} label="Payment">
        <label className={`${HAIRLINE} ${ROW} cursor-pointer bg-[#fcfcfc]`}>
          <Icon icon={RiGift2Line} on={gifted} tile={gifted ? "bg-lilac" : "bg-white"} />
          <Text title="We usually prioritize gifted collabs" hint="Adds a note to the payment question that no payment is usually required." />
          <span className="relative shrink-0">
            <input type="checkbox" role="switch" aria-describedby={`${id}-pay`} checked={gifted} onChange={(e) => onGifted(e.target.checked)} className="peer sr-only" />
            <span className={`block h-6 w-[45px] rounded-full transition-colors duration-200 peer-focus-visible:ring-[3px] peer-focus-visible:ring-[#b9a8ff] ${gifted ? "bg-[#2baf87]" : "bg-[#dcdde3]"}`} />
            <span className={`absolute left-[2px] top-[2px] size-5 rounded-full bg-white transition-transform duration-200 ${gifted ? "translate-x-[21px]" : ""}`} />
          </span>
        </label>
      </Group>
    </div>
  );
}

function Group({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div>
      <p id={id} className="mb-2 text-[13px] font-semibold leading-5 text-ink-2">
        {label}
      </p>
      {children}
    </div>
  );
}

/* the same tile in both groups, so the icons line up down the left; the icon turns purple when its option is on */
function Icon({ icon: I, on, tile }: { icon: RemixiconComponentType; on: boolean; tile: string }) {
  return (
    <span className={`grid size-10 shrink-0 place-items-center rounded-full transition-colors duration-200 ${tile} ${on ? "text-[#7a5cfa]" : "text-ink-2"}`}>
      <I size={20} aria-hidden="true" />
    </span>
  );
}

function Text({ title, hint }: { title: string; hint: string }) {
  return (
    <span className="min-w-0 flex-1 leading-snug">
      <span className="block text-[15px] font-semibold text-ink">{title}</span>
      <span className="block text-[13px] text-muted">{hint}</span>
    </span>
  );
}
