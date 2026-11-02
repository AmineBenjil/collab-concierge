import type { Metadata } from "next";
import { Suspense } from "react";
import CreatorFlow from "@/components/creator/CreatorFlow";
import { BUSINESS } from "@/components/creator/business";
import { cleanHandle } from "@/components/names";

type Props = { params: Promise<{ handle: string }> };

/* benable.com/c/<handle>: the page a creator lands on from the business's DM reply. Same flow as the Collab Concierge Apply repo.
   The handle only picks whose Customize edits it reads; the business shown is always BUSINESS. */
export function generateStaticParams() {
  return [{ handle: BUSINESS.handle }];
}

export const metadata: Metadata = {
  title: `Collab with ${BUSINESS.name}`,
  description: `Tell ${BUSINESS.name} about yourself and the collab you have in mind. About 2 minutes.`,
};

/* the handle is URL data, so it's read under Suspense and a blank white page shows instantly */
export default function CreatorPage({ params }: Props) {
  return (
    <Suspense fallback={<div className="min-h-svh bg-white" aria-busy="true" />}>
      <Flow params={params} />
    </Suspense>
  );
}

async function Flow({ params }: Props) {
  const handle = cleanHandle(decodeURIComponent((await params).handle)) || BUSINESS.handle;
  return <CreatorFlow handle={handle} />;
}
