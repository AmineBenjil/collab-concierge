import type { Metadata } from "next";
import Onboarding from "@/components/Onboarding";

export const metadata: Metadata = {
  title: "Set up your Concierge · Benable",
  description: "Your Collab Concierge link, ready in seconds.",
};

export default function StartPage() {
  return <Onboarding />;
}
