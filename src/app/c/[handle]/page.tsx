import type { Metadata } from "next";
import { Suspense } from "react";
import CreatorFlow from "@/components/creator/CreatorFlow";
import { cleanHandle, displayName } from "@/components/names";

type Props = { params: Promise<{ handle: string }> };

const handleOf = async (params: Props["params"]) => cleanHandle(decodeURIComponent((await params).handle)) || "konacoffee";

/* the demo café is prerendered; any other handle renders on its first visit */
export function generateStaticParams() {
  return [{ handle: "konacoffee" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const name = displayName(await handleOf(params));
  return {
    title: `Collab with ${name}`,
    description: `Tell ${name} about yourself and the collab you have in mind. About 2 minutes.`,
  };
}

/* benable.com/c/<handle>: the page a creator lands on from the business's DM reply.
   The handle is URL data, so it's read under Suspense and the card's outline shows instantly. */
export default function CreatorPage({ params }: Props) {
  return (
    <Suspense fallback={<Outline />}>
      <Flow params={params} />
    </Suspense>
  );
}

async function Flow({ params }: Props) {
  return <CreatorFlow handle={await handleOf(params)} />;
}

function Outline() {
  return (
    <div className="min-h-svh bg-[#f4f3f8]" aria-busy="true">
      <div className="mx-auto min-h-svh w-full max-w-[460px] bg-white p-3 sm:my-10 sm:min-h-[min(820px,calc(100svh-80px))] sm:rounded-[32px]">
        <div className="aspect-[12/5] animate-pulse rounded-[22px] bg-[#f1f0f6] motion-reduce:animate-none" />
      </div>
    </div>
  );
}
