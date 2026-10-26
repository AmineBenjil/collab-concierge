"use client";

import { RiArrowRightUpLine, RiEqualizerLine, RiEyeLine } from "@remixicon/react";
import { displayName } from "../names";
import { useToast } from "./Shell";
import { useHandle } from "./store";
import { CopyButton, Rise } from "./ui";

/* the dashboard's request card: hairline border, no resting shadow */
const BOX = "rounded-[18px] border border-[#ececf1] bg-white";

/* The Concierge is live: the link, a way to try it as a creator, and the reply to paste into DMs. */
export default function Share() {
  const handle = useHandle();
  const name = displayName(handle);
  const say = useToast();
  const link = `benable.com/c/${handle}`;
  const reply = `Thanks for reaching out! We handle collab requests here: ${link}. Takes a couple minutes and we'll get back to you.`;

  return (
    <main className="relative mx-auto w-full max-w-[600px] px-5 pb-24 pt-[112px] sm:pt-[140px]">
      <Rise i={0}>
        {/* the same title, spacing and alignment as the Dashboard tab */}
        <h1 className="dash-title">
          Your Collab Concierge is <span className="grad-text">live.</span>
        </h1>
      </Rise>

      <Rise i={1} className="mt-6">
        {/* three white panels on a grey card; the grey shows through as the gaps between them */}
        <div className="flex flex-col gap-1 overflow-hidden rounded-[24px] border border-[#ececf1] bg-[#f2f2f2]">
          <div className="flex items-center justify-between gap-3 bg-white px-5 py-5 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/img/ig/foundcoffee.jpg" alt="" className="h-14 w-14 shrink-0 rounded-full border border-white object-cover drop-shadow-[0_4px_7px_rgba(0,0,0,0.08)]" />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-[16px] font-semibold leading-[19px] text-black">{name}</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/img/share/verified.svg" alt="Verified" width={16} height={16} className="shrink-0" />
                </div>
                <div className="mt-1 truncate text-[12px] leading-[15px] text-[#999]">@{handle}</div>
              </div>
            </div>
            <a href={`https://instagram.com/${encodeURIComponent(handle)}`} target="_blank" rel="noopener" aria-label={`Open ${name} on Instagram`} className="shrink-0 transition-opacity hover:opacity-80">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/img/share/instagram.svg" alt="" width={24} height={24} />
            </a>
          </div>

          <div className="bg-white px-5 py-5 sm:px-6">
            <div className="text-[14px] font-semibold leading-4 text-[#1c1c1c]">Your link</div>
            {/* the link sits in a pill with its copy button; phones stack the button so the link stays whole */}
            <div className="mt-3 flex flex-col gap-1.5 rounded-[24px] border-[0.5px] border-[#e3e3e3] bg-[#fafafa] p-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:rounded-full sm:p-[5.5px] sm:pl-[23.5px]">
              <span className="min-w-0 truncate px-3 py-2 text-[16px] font-semibold leading-[19px] text-ink sm:p-0">{link}</span>
              <CopyButton text={link} label="Copy link" dark />
            </div>
            {/* opens the creator side in a new tab, in preview mode */}
            <a
              href={`/c/${encodeURIComponent(handle)}?preview=1`}
              target="_blank"
              rel="noopener"
              className="group mt-3 flex items-center gap-3.5 rounded-[16px] border-[0.5px] border-[#c6c6c6] bg-white px-4 py-3.5 transition-shadow duration-200 hover:shadow-[0_10px_28px_-18px_rgba(22,26,53,0.3)]"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#f1f1f4] text-ink-2">
                <RiEyeLine size={18} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15.5px] font-medium leading-[22px] text-ink">Test your link</span>
                <span className="block text-[13px] leading-[18px] text-muted">See exactly what creators see</span>
              </span>
              <RiArrowRightUpLine size={18} aria-hidden="true" className="shrink-0 text-muted transition-colors group-hover:text-ink" />
            </a>
          </div>

          <div className="bg-white px-5 py-5 sm:px-6">
            <p className="text-[14px] font-semibold leading-snug text-[#1c1c1c] sm:leading-4">When a creator DMs you, reply with this. Your link handles the rest.</p>
            {/* a little DM thread, so it's obvious where the reply goes */}
            <div className="mt-3 flex flex-col gap-4 rounded-[20px] border-[0.5px] border-[#e3e3e3] bg-[#fafafa] px-[11.5px] pb-[11.5px] pt-[15.5px]">
              <div className="flex items-end gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/img/ig/ana.jpg" alt="" className="h-7 w-7 shrink-0 rounded-full object-cover" />
                <span className="rounded-[18px] rounded-bl-[6px] bg-[#eef2f5] px-3.5 py-2 text-[14px] leading-[21px] text-ink">hii! would love to collab 💜</span>
              </div>
              <div className="flex justify-end">
                <div className="max-w-[88%] rounded-[16px] sm:max-w-[428px] rounded-br-[4px] bg-[#5e49f0] px-4 py-3 text-[14.5px] leading-[20px] text-white">{reply}</div>
              </div>
              <div className="flex justify-end">
                <CopyButton text={reply} label="Copy reply" />
              </div>
            </div>
          </div>
        </div>
      </Rise>

      <Rise i={2} className="mt-4">
        <div className={`flex items-center gap-3.5 px-4 py-3.5 ${BOX}`}>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#f1f1f4] text-ink-2">
            <RiEqualizerLine size={18} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1 leading-snug">
            <div className="text-[15.5px] font-medium text-ink">Make it yours</div>
            <div className="text-[13px] text-muted">The questions creators answer, your dealbreakers, the collabs you want.</div>
          </div>
          <button type="button" onClick={() => say("Customize is next on the build list.")} className="shrink-0 rounded-full bg-[#111] px-4 py-2 text-[14px] font-semibold text-white transition-colors hover:bg-black">
            Customize
          </button>
        </div>
      </Rise>
    </main>
  );
}
