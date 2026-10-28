import type { Metadata } from "next";
import Customize from "@/components/concierge/Customize";

export const metadata: Metadata = {
  title: "Customize · Collab Concierge",
  description: "The collabs you want, your dealbreakers, and the questions creators answer.",
};

export default function CustomizePage() {
  return <Customize />;
}
