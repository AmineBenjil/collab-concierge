import type { Metadata } from "next";
import localFont from "next/font/local";
import { Inter } from "next/font/google";
import ControlPanel from "@/components/ControlPanel";
import "./globals.css";

const national = localFont({
  src: [
    { path: "../../public/fonts/National2Narrow-Regular.otf", weight: "400", style: "normal" },
    { path: "../../public/fonts/National2Narrow-Medium.otf", weight: "500", style: "normal" },
    { path: "../../public/fonts/National2Narrow-Bold.otf", weight: "700", style: "normal" },
    { path: "../../public/fonts/National2Narrow-Extrabold.otf", weight: "800", style: "normal" },
  ],
  variable: "--font-national",
  display: "swap",
});

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "Collab Concierge by Benable",
  description:
    "One link for every creator who DMs your business. Benable vets them and shows you a one-line verdict in your dashboard. You just say yes or no.",
  openGraph: {
    title: "Collab Concierge by Benable",
    description: "Collab DMs, handled. Paste one reply, see every creator vetted in your dashboard.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${national.variable} ${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        {children}
        {/* demo tool: shortcuts to every screen and the A/B switches, on every page */}
        <ControlPanel />
      </body>
    </html>
  );
}
