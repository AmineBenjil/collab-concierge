import Image from "next/image";
import Reveal from "./Reveal";

/*
  "Benable ranked #1" from Figma (Design Labs, 15426:43358): copy on the left, The Information's
  top-five table on the right with Benable's row lifted out of it on a floating card.
  Table geometry is Figma's, measured from the card's outer edge (the 4px border is drawn inset).
*/

const ROWS = [
  { rank: 2, name: "Basis Theory", logo: "basis-theory" },
  { rank: 3, name: "Duckbill", logo: "duckbill", ring: true },
  { rank: 4, name: "Rye", logo: "rye" },
  { rank: 5, name: "Catalog", logo: "catalog", ring: true },
];

function Row({ rank, name, logo, ring, last }: { rank: number; name: string; logo: string; ring?: boolean; last?: boolean }) {
  return (
    <li className={`relative h-[60px] bg-white ${last ? "" : "border-b-[1.2px] border-[#e3e3e3]"}`}>
      <span className="absolute left-[13.2px] top-[calc(50%-9px)] text-[21.6px] font-semibold leading-[19.2px] text-black">{rank}</span>
      <span className={`absolute left-[95.1px] top-[calc(50%+0.6px)] size-[28.8px] -translate-y-1/2 overflow-hidden rounded-full ${ring ? "border-[0.6px] border-[#d9d7d7]" : ""}`}>
        <Image src={`/img/ranking/${logo}.png`} alt="" fill sizes="29px" className="object-cover" />
      </span>
      <span className="absolute left-[136.89px] top-[calc(50%-9px)] whitespace-nowrap text-[21.6px] font-semibold leading-[19.2px] text-black">{name}</span>
    </li>
  );
}

export default function Ranking() {
  return (
    <section id="recognition" className="relative overflow-hidden bg-[#f3f2f9] py-24 sm:py-28">
      <div className="mx-auto grid w-full max-w-[1260px] items-center gap-16 px-5 sm:px-8 lg:grid-cols-[minmax(0,656px)_auto] lg:justify-between lg:gap-10 lg:px-10">
        {/* copy */}
        <Reveal className="flex flex-col items-start gap-[26px]">
          <Image src="/img/ranking/the-information.png" alt="The Information" width={342} height={57} className="h-auto w-[260px] sm:w-[342.242px]" />
          <div className="flex flex-col gap-4">
            <h2 className="section-title">
              Benable ranked <span className="text-[#7a5cfa]">#1</span> in Top Commerce &amp; Consumer Startups
            </h2>
            <p className="section-sub">
              The Information named Benable the #1 Most Promising Startup in Consumer &amp; Commerce (2025).
            </p>
          </div>
        </Reveal>

        {/* ranking card, 406x483, with Benable's row floating out 30px each side */}
        <Reveal delay={0.1} className="flex justify-center lg:justify-end">
          {/* phones get the same card at 78%, in a box sized to match so nothing shifts */}
          <div className="relative h-[377px] w-[317px] sm:h-[483px] sm:w-[406px] lg:mr-[30.4px]">
            <div className="absolute left-0 top-0 w-[406px] origin-top-left scale-[0.78] sm:scale-100">
              <div className="relative h-[483px] w-[406px] overflow-clip rounded-[32px] bg-white shadow-[inset_0_0_0_4px_#f1f1f1]">
                <p className="absolute left-[28.48px] top-[28.54px] w-[349.2px] text-[24px] font-bold leading-[normal] text-[#696969]">Top Commerce &amp; Consumer Startups</p>
                <p className="absolute left-[28.48px] top-[113.44px] text-[19.2px] font-semibold leading-[19.2px] text-[#696969]">Rank</p>
                <p className="absolute left-[123.58px] top-[113.44px] text-[19.2px] font-semibold leading-[19.2px] text-[#696969]">Name</p>
                <ol className="absolute left-[28.48px] top-[176.46px] w-[349.2px]">
                  <li className="h-[60px] border-b-[1.2px] border-[#e3e3e3]" aria-hidden="true" />
                  {ROWS.map((r, i) => (
                    <Row key={r.rank} {...r} last={i === ROWS.length - 1} />
                  ))}
                </ol>
              </div>

              {/* Benable, #1 */}
              <div className="absolute left-[-30.4px] top-[153.57px] h-[86.4px] w-[466.8px] overflow-clip rounded-2xl bg-white shadow-[0_11px_26px_0_rgba(0,0,0,0.08)]">
                <div className="absolute left-[35.78px] top-[14.8px] h-[56.784px] w-[63.756px] overflow-hidden">
                  <div className="absolute left-[-11.04%] top-[-18.54%] h-[137.07%] w-[122.09%]">
                    <Image src="/img/ranking/laurel.png" alt="Rank 1" fill sizes="80px" />
                  </div>
                </div>
                <div className="absolute left-[calc(50%-9px)] top-1/2 h-[43.2px] w-[165.6px] -translate-x-1/2 -translate-y-1/2" role="img" aria-label="Benable">
                  <div className="absolute inset-[0_73.76%_0_0] overflow-hidden rounded-[9.6px]">
                    <Image src="/img/ranking/tile.png" alt="" fill sizes="44px" />
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/img/ranking/glyph.svg" alt="" className="absolute block" style={{ left: "6.91%", top: "16.91%", width: "13.38%", height: "65.81%" }} />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/img/ranking/wordmark.svg" alt="" className="absolute block" style={{ left: "36.24%", top: "21.72%", width: "63.87%", height: "49.61%" }} />
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
