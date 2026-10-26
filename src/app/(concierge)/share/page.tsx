import type { Metadata } from "next";
import Share from "@/components/concierge/Share";

export const metadata: Metadata = {
  title: "Your Concierge · Benable",
  description: "Your Collab Concierge link and the reply to paste into collab DMs.",
};

export default function SharePage() {
  return <Share />;
}
