import type { HeroBg } from "./controls";

/* Hero backdrops for the control panel's A/B switch. */
export default function HeroBackground({ variant }: { variant: HeroBg }) {
  if (variant === "v2") {
    // soft pastel wash from Figma (Design Labs 15432:46578) with the faint grid on top
    return (
      <div className="absolute inset-0 overflow-hidden bg-[#f1e6f8] bg-[url(/img/hero-v2-bg.png)] bg-cover bg-center" aria-hidden="true">
        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#f6f6f8_1px,transparent_1px),linear-gradient(to_bottom,#f6f6f8_1px,transparent_1px)] bg-[size:6rem_4rem]" />
      </div>
    );
  }
  // night sky in Benable colours, dot grid, grain
  return (
    <div className="noise absolute inset-0 overflow-hidden bg-night" aria-hidden="true">
      <div className="absolute -left-40 -top-40 h-[620px] w-[620px] rounded-full bg-[radial-gradient(closest-side,rgba(116,96,255,0.55),transparent)] blur-2xl" />
      <div className="absolute -right-32 top-20 h-[560px] w-[560px] rounded-full bg-[radial-gradient(closest-side,rgba(77,174,255,0.38),transparent)] blur-2xl" />
      <div className="absolute bottom-[-220px] right-[10%] h-[520px] w-[700px] rounded-full bg-[radial-gradient(closest-side,rgba(242,134,154,0.32),transparent)] blur-2xl" />
      <div className="dot-grid-light absolute inset-0" />
    </div>
  );
}
