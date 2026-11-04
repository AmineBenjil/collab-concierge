import type { Metadata } from "next";
import Settings from "@/components/concierge/Settings";

export const metadata: Metadata = {
  title: "Settings · Collab Concierge",
  description: "When we email you about collab requests, and where they go.",
};

export default function SettingsPage() {
  return <Settings />;
}
