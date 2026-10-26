import BrandStrip from "@/components/BrandStrip";
import Checks from "@/components/Checks";
import Closing from "@/components/Closing";
import CreatorCarousel from "@/components/CreatorCarousel";
import FAQ from "@/components/FAQ";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import Intro from "@/components/Intro";
import { IntroProvider } from "@/components/IntroContext";
import Nav from "@/components/Nav";
import Problem from "@/components/Problem";
import Ranking from "@/components/Ranking";

export default function Home() {
  return (
    <IntroProvider>
      <Intro />
      <Nav />
      <main className="flex-1">
        <Hero />
        <BrandStrip />
        <Problem />
        <HowItWorks />
        <Checks />
        <CreatorCarousel />
        <Ranking />
        <FAQ />
      </main>
      <Closing />
    </IntroProvider>
  );
}
