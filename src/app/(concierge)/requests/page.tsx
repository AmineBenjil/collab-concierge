import type { Metadata } from "next";
import Requests from "@/components/concierge/Requests";

export const metadata: Metadata = {
  title: "Requests · Collab Concierge",
  description: "Every creator who used your link, vetted, with a one-line verdict.",
};

export default function RequestsPage() {
  return <Requests />;
}
