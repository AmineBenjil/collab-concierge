/* Brand strip from Figma (Design Labs, node 15426:43325): 1512x142 frame, logos looping right to left. */

type Logo = { src: string; alt: string; w: number; h: number; crop?: { w: string; h: string; left: string; top: string } };

const VRBO: Logo = { src: "/img/brands/vrbo.png", alt: "Vrbo", w: 89.279, h: 34.984, crop: { w: "118.7%", h: "201.95%", left: "-9.2%", top: "-51.97%" } };
const WAYFAIR: Logo = { src: "/img/brands/wayfair.png", alt: "Wayfair", w: 93.186, h: 20.348 };
const REVOLVE: Logo = { src: "/img/brands/revolve.png", alt: "Revolve", w: 128.936, h: 18.607, crop: { w: "97.32%", h: "100%", left: "0.6%", top: "0" } };
const EBAY: Logo = { src: "/img/brands/ebay.png", alt: "eBay", w: 81.012, h: 25.712 };

const LOGOS: Logo[] = [
  VRBO,
  WAYFAIR,
  { src: "/img/brands/etsy.svg", alt: "Etsy", w: 69.183, h: 32.222 },
  WAYFAIR,
  VRBO,
  { src: "/img/brands/asos.svg", alt: "ASOS", w: 71.92, h: 16.04 },
  { src: "/img/brands/skims.png", alt: "Skims", w: 67, h: 19 },
  EBAY,
  REVOLVE,
  { src: "/img/brands/the-ordinary.png", alt: "The Ordinary", w: 89.558, h: 31.985 },
  REVOLVE,
  EBAY,
];

function Row({ hidden }: { hidden?: boolean }) {
  return (
    <ul className="flex shrink-0 items-center gap-[43px] pr-[43px]" aria-hidden={hidden || undefined}>
      {LOGOS.map((l, i) => (
        <li key={i} className="relative shrink-0 overflow-hidden" style={{ width: l.w, height: l.h }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={l.src}
            alt={hidden ? "" : l.alt}
            className={l.crop ? "absolute max-w-none" : "absolute inset-0 size-full max-w-none object-contain"}
            style={l.crop ? { width: l.crop.w, height: l.crop.h, left: l.crop.left, top: l.crop.top } : undefined}
          />
        </li>
      ))}
    </ul>
  );
}

export default function BrandStrip() {
  return (
    <section aria-label="Brands on Benable" className="relative h-[142px] overflow-hidden bg-[#f4f4f4]">
      <p className="absolute left-[calc(50%-0.5px)] top-[39.51px] -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-center text-[20px] leading-[normal] tracking-[-0.5px] text-[#1c1c1c]">
        Trusted by over <span className="font-semibold">30k+</span> businesses and brands
      </p>
      <div className="absolute inset-x-0 top-[79.51px]">
        <div className="marquee-x flex w-max items-center">
          <Row />
          <Row hidden />
        </div>
      </div>
    </section>
  );
}
