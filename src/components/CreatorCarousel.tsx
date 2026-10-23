import Image from "next/image";
import { SectionHead } from "./ui";

/*
  Creators carousel from Figma (Design Labs, Creators 15426:46439). Each 250px tile has a
  colour backdrop and a cut-out photo taller than the tile, so heads pop out of the top.
  Hovering a tile lifts it to the 277px state with a white border; the loop pauses meanwhile.
*/

type Creator = {
  name: string;
  img: string;
  bg: string;
  icon: "instagram" | "instagram-2" | "tiktok" | "tiktok-lg" | "tiktok-2";
  // photo box, in px of the 250px tile, anchored to the tile's bottom centre
  w: number;
  h: number;
  dx?: number;
  // optional crop of the image inside that box, straight from Figma
  crop?: { w: string; h: string; left: string; top: string };
};

const CREATORS: Creator[] = [
  { name: "Megan McSherry", img: "megan", bg: "#9c926c", icon: "instagram", w: 245.067, h: 310.021, crop: { w: "128.27%", h: "134.35%", left: "-14.14%", top: "-3.58%" } },
  { name: "nana | sillylilbooks", img: "nana", bg: "#f6cec0", icon: "tiktok", w: 250, h: 276, dx: -0.5, crop: { w: "103.37%", h: "124.07%", left: "-13.78%", top: "0.88%" } },
  { name: "Mrs. Space Cadet", img: "space-cadet", bg: "#f1b0d0", icon: "tiktok-lg", w: 250, h: 291.25 },
  { name: "Always Asia", img: "always-asia", bg: "#9f9ac2", icon: "instagram-2", w: 249, h: 305, crop: { w: "98.6%", h: "106.66%", left: "1.06%", top: "7.12%" } },
  { name: "Amy Rauch", img: "amy", bg: "#bfafa4", icon: "tiktok", w: 250, h: 281.192, crop: { w: "131.58%", h: "124.57%", left: "-15.79%", top: "-18.88%" } },
  { name: "Hanah Bae", img: "hanah", bg: "#d57a8a", icon: "tiktok-2", w: 250, h: 346.511 },
  { name: "Vitolda Klein", img: "vitolda", bg: "#e6ccbf", icon: "tiktok-2", w: 249.751, h: 343.749 },
  { name: "Giano Currie", img: "giano", bg: "#dab4ad", icon: "tiktok-2", w: 225, h: 310, dx: 12.5 },
  { name: "Gabriel Silverio", img: "gabriel", bg: "#6c7e90", icon: "tiktok-2", w: 234, h: 322, dx: 8 },
];

const STATS = [
  { k: "2 million", v: "Users" },
  { k: "31,500+", v: "Videos delivered" },
  { k: "20,000+", v: "Partnerships completed" },
];

function Tile({ c, hidden }: { c: Creator; hidden?: boolean }) {
  return (
    <li
      className="relative size-[250px] shrink-0 rounded-[33.333px] transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(.22,1,.36,1)] hover:z-10 hover:scale-[1.1077] hover:shadow-[0_0_0_4px_#fff,0_16px_20px_rgba(0,0,0,0.08)]"
      style={{ background: c.bg }}
    >
      <div
        className="absolute bottom-0 overflow-hidden rounded-[33.333px]"
        style={{ width: c.w, height: c.h, left: `calc(50% - ${c.w / 2}px + ${c.dx ?? 0}px)` }}
      >
        <div className="absolute" style={c.crop ? { width: c.crop.w, height: c.crop.h, left: c.crop.left, top: c.crop.top } : { inset: 0 }}>
          <Image src={`/img/creators-carousel/${c.img}.png`} alt={hidden ? "" : c.name} fill sizes="300px" className={c.crop ? "object-fill" : "object-cover"} />
        </div>
      </div>
      <div
        className="absolute inset-x-0 bottom-0 flex h-[66.667px] items-end justify-between gap-2 rounded-b-[33.333px] px-4 pb-4"
        style={{ backgroundImage: "linear-gradient(179.73deg, rgba(0,0,0,0) 16.73%, rgba(0,0,0,0.5) 164.73%)" }}
      >
        <p className="truncate text-[18.75px] font-bold leading-[18.75px] text-white">{c.name}</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/img/creators-carousel/${c.icon}.svg`} alt="" className="size-[18.75px] shrink-0" />
      </div>
    </li>
  );
}

function Row({ hidden }: { hidden?: boolean }) {
  return (
    <ul className="flex shrink-0 items-end gap-8 pr-8" aria-hidden={hidden || undefined}>
      {CREATORS.map((c) => (
        <Tile key={c.name} c={c} hidden={hidden} />
      ))}
    </ul>
  );
}

export default function CreatorCarousel() {
  return (
    <section id="creators" className="relative scroll-mt-24 overflow-hidden py-24 sm:py-28">
      {/* kept from the previous section: soft violet-to-rose glow over the dot grid */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[1000px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(143,108,247,0.28),rgba(242,134,154,0.12)_55%,transparent)] blur-2xl" />
      <div className="dot-grid pointer-events-none absolute inset-0 opacity-70" />

      <div className="container-x relative">
        <SectionHead label="Our creators" title="Creators who already know what their audience wants" sub="Creators browse live offers and claim the ones that fit what they actually post about." />
      </div>

      {/* room above for the heads that pop out, and around for the hover lift */}
      <div className="group relative mt-2 overflow-hidden pb-10 pt-[110px]">
        <div className="marquee-x flex w-max [animation-duration:60s] group-hover:[animation-play-state:paused]">
          <Row />
          <Row hidden />
        </div>
      </div>

      <div className="container-x relative mt-[76px] flex justify-center">
        <div className="relative w-full max-w-[1154px] overflow-hidden rounded-[24px] border border-[#ebe0fc]">
          <div className="pointer-events-none absolute inset-0 opacity-60" aria-hidden="true">
            <Image src="/img/creators-carousel/stats-bg.png" alt="" fill sizes="1154px" className="object-cover" />
          </div>
          <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: "linear-gradient(87.71deg, rgba(255,255,255,0.7) 12.549%, rgba(255,255,255,0.4) 105.84%)" }} aria-hidden="true" />
          <dl className="relative grid grid-cols-1 sm:grid-cols-3">
            {STATS.map((s, i) => (
              <div
                key={s.v}
                className={`flex h-[130px] flex-col items-center justify-center gap-2 text-center text-[#4e1c7a] ${i === 1 ? "border-y border-white sm:border-x sm:border-y-0" : ""}`}
              >
                <dt className="order-2 text-[14px] font-semibold tracking-[-0.0762px]">{s.v}</dt>
                <dd className="order-1 text-[32px] font-black leading-[normal] tracking-[-1.6289px]">{s.k}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
