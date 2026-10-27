import CreatorGrowth from "./CreatorGrowth";
import { SectionHead } from "./ui";

/* Creators: same head as before, then a year of creator growth drawn in a How it works-style box. */
export default function Creators() {
  return (
    <section id="creators" className="relative scroll-mt-24 py-24 sm:py-28">
      <div className="container-x">
        <SectionHead label="Our creators" title={
            <>
              Over <span className="grad-text">1M</span> creators already assessed.
            </>
          } sub="When a creator DMs you, chances are we've already checked them." />
        <div className="mt-16">
          <CreatorGrowth />
        </div>
      </div>
    </section>
  );
}
