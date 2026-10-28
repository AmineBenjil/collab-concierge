/*
  Brand strip from Figma (Design Labs, node 15426:43325): 1512x142 frame, logos looping right to left.

  Logos are trimmed to their ink, then sized so each covers about the same area (~2300 px²),
  capped at 38px tall and 136px wide. Solid blocks (LEGO, Uniqlo, The Home Depot) get a little
  less area and light, airy marks (scripts, thin wordmarks) a little more, so no logo shouts.
  The order alternates blocks, wordmarks and colours so similar logos never sit side by side.
*/

type Logo = { src: string; alt: string; w: number; h: number };

const LOGOS: Logo[] = [
  { src: "nike", alt: "Nike", w: 85.8, h: 30.8 },
  { src: "lego", alt: "LEGO", w: 38.2, h: 38 },
  { src: "ulta-beauty", alt: "Ulta Beauty", w: 80.8, h: 32.7 },
  { src: "best-buy", alt: "Best Buy", w: 60.2, h: 35.2 },
  { src: "free-people", alt: "Free People", w: 113.5, h: 23.3 },
  { src: "target", alt: "Target", w: 27.3, h: 38 },
  { src: "booking-com", alt: "Booking.com", w: 120.7, h: 20.3 },
  { src: "gap", alt: "Gap", w: 51.3, h: 38 },
  { src: "the-home-depot", alt: "The Home Depot", w: 36.5, h: 38 },
  { src: "lululemon", alt: "lululemon", w: 75.3, h: 35.1 },
  { src: "etsy", alt: "Etsy", w: 73.9, h: 35.8 },
  { src: "the-north-face", alt: "The North Face", w: 68.5, h: 31.8 },
  { src: "benefit", alt: "Benefit Cosmetics", w: 89.5, h: 29.6 },
  { src: "warby-parker", alt: "Warby Parker", w: 136, h: 10.7 },
  { src: "crocs", alt: "Crocs", w: 106, h: 20.1 },
  { src: "disney-store", alt: "Disney Store", w: 97.5, h: 27.1 },
  { src: "levis", alt: "Levi's", w: 69.4, h: 28.3 },
  { src: "revolve", alt: "Revolve", w: 126.5, h: 19 },
  { src: "hotels-com", alt: "Hotels.com", w: 77.2, h: 34.3 },
  { src: "uniqlo", alt: "Uniqlo", w: 38, h: 38 },
  { src: "asos", alt: "ASOS", w: 84.3, h: 24.5 },
  { src: "sur-la-table", alt: "Sur La Table", w: 108.2, h: 24.4 },
  { src: "petsmart", alt: "PetSmart", w: 96, h: 24.2 },
  { src: "skims", alt: "Skims", w: 94.4, h: 21.1 },
  { src: "ebay", alt: "eBay", w: 79.6, h: 32.1 },
  { src: "steve-madden", alt: "Steve Madden", w: 70.1, h: 37.7 },
  { src: "tripadvisor", alt: "Tripadvisor", w: 107.7, h: 23 },
  { src: "kohls", alt: "Kohl's", w: 114.8, h: 17.5 },
  { src: "supergoop", alt: "Supergoop!", w: 76, h: 34.8 },
  { src: "ace-hardware", alt: "Ace Hardware", w: 60.6, h: 36.8 },
  { src: "american-girl", alt: "American Girl", w: 125.5, h: 21.1 },
  { src: "wayfair", alt: "Wayfair", w: 107.1, h: 23.4 },
  { src: "anker", alt: "Anker", w: 99.3, h: 23.8 },
  { src: "barnes-noble", alt: "Barnes & Noble", w: 136, h: 11.8 },
  { src: "tj-maxx", alt: "T.J.Maxx", w: 97.8, h: 22.9 },
];

function Row({ hidden }: { hidden?: boolean }) {
  return (
    <ul className="flex shrink-0 items-center gap-[43px] pr-[43px]" aria-hidden={hidden || undefined}>
      {LOGOS.map((l) => (
        <li key={l.src} className="relative shrink-0" style={{ width: l.w, height: l.h }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/img/brands/${l.src}.png`} alt={hidden ? "" : l.alt} className="absolute inset-0 size-full max-w-none object-contain" />
        </li>
      ))}
    </ul>
  );
}

export default function BrandStrip() {
  return (
    <section aria-label="Brands on Benable" className="relative h-[142px] overflow-hidden bg-[#f4f4f4]">
      <p className="absolute left-[calc(50%-0.5px)] top-[39.51px] -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-center text-[20px] leading-[normal] tracking-[-0.5px] text-[#1c1c1c]">
        Trusted by over <span className="font-semibold">30,000+</span> businesses and brands
      </p>
      <div className="absolute inset-x-0 top-[79.51px]">
        {/* the row is about 3x the Figma one, so the loop runs 3x as long (38s -> 117s) to keep its pace */}
        <div className="marquee-x flex w-max items-center" style={{ animationDuration: "117s" }}>
          <Row />
          <Row hidden />
        </div>
      </div>
    </section>
  );
}
