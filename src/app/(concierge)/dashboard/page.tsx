import type { Metadata } from "next";
import Dashboard from "@/components/concierge/Dashboard";

export const metadata: Metadata = {
  title: "Dashboard · Collab Concierge",
  description: "Every creator who used your link, vetted, with a one-line verdict.",
};

export default function DashboardPage() {
  return <Dashboard />;
}
