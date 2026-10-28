import Shell from "@/components/concierge/Shell";

/* /start, /share, /requests and /customize share one frame, so the header stays put between them */
export default function ConciergeLayout({ children }: { children: React.ReactNode }) {
  return <Shell>{children}</Shell>;
}
