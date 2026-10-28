"use client";

import { RiArrowLeftLine, RiLogoutBoxRLine } from "@remixicon/react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Avatar } from "../HandleForm";
import Logo, { BrandIcon } from "../Logo";
import { displayName } from "../names";
import { recallEmail, useHandle } from "./store";
import { EASE, Thumb } from "./ui";

/*
  The frame around the business side (/start, /share, /requests, /customize): the soft glow, the floating
  glass bar and the toast. It's a layout, so it stays mounted while you switch tabs and the
  Share/Requests/Customize thumb can slide between them.
*/

type Toast = { msg: string; action?: { label: string; run: () => void } };
const ToastContext = createContext<(msg: string, action?: Toast["action"]) => void>(() => {});
export const useToast = () => useContext(ToastContext);

const LIVE = ["/share", "/requests", "/customize"];

export default function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const handle = useHandle();
  const live = LIVE.includes(pathname);
  const [toast, setToast] = useState<(Toast & { key: number }) | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const say = useCallback((msg: string, action?: Toast["action"]) => {
    clearTimeout(timer.current);
    setToast({ msg, action, key: Date.now() });
    timer.current = setTimeout(() => setToast(null), action ? 5000 : 2600);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <ToastContext value={say}>
      <div className="relative min-h-svh overflow-x-clip bg-bg">
        {/* the glow and dots stay pinned to the viewport while the page scrolls over them */}
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
          <Backdrop />
        </div>

        {/* a second copy of the backdrop over the top strip, fading out below the bar: content scrolling up
            dissolves into the background behind the header instead of peeking out above it */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-x-0 top-0 z-40 h-[100px] overflow-hidden bg-bg [mask-image:linear-gradient(to_bottom,#000_66%,transparent)] sm:h-[108px]"
        >
          <div className="absolute inset-x-0 top-0 h-svh">
            <Backdrop />
          </div>
        </div>

        {/* same floating glass bar as the landing page nav once it's scrolled */}
        <header className="fixed inset-x-0 top-3 z-50 flex justify-center px-2 sm:top-4">
          <nav
            aria-label="Main"
            className="flex h-[58px] w-full max-w-[860px] items-center justify-between rounded-[18px] border border-[#e5e7eb]/70 bg-white/90 pl-4 pr-2 text-ink shadow-[0_12px_24px_-14px_rgba(50,38,98,0.14)] backdrop-blur-xl"
          >
            <div className="flex items-center gap-2">
              {!live && (
                <Link href="/" aria-label="Back to the home page" className="-ml-1 grid h-9 w-9 place-items-center rounded-full text-ink-2 transition-colors hover:bg-lilac hover:text-ink">
                  <RiArrowLeftLine size={18} aria-hidden="true" />
                </Link>
              )}
              <Link href="/" aria-label="Benable Collab Concierge home" className="flex items-center gap-3">
                {/* phones get the icon alone so the live header has room */}
                <BrandIcon size={30} className="sm:hidden" />
                <span className="hidden sm:block">
                  <Logo />
                </span>
                <span className="hidden h-4 w-px bg-ink/15 sm:block" />
                <span className="hidden text-[14px] font-semibold sm:block">Collab Concierge</span>
              </Link>
            </div>
            <AnimatePresence>
              {live && (
                <motion.div className="flex items-center gap-2 pr-1 sm:gap-5" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}>
                  <Tabs pathname={pathname} handle={handle} />
                  <Account handle={handle} />
                </motion.div>
              )}
            </AnimatePresence>
          </nav>
        </header>

        {children}

        <AnimatePresence>
          {toast && (
            <motion.div
              key={toast.key}
              role="status"
              className="pointer-events-none fixed inset-x-0 bottom-[calc(24px+var(--toast-lift,0px))] z-[80] flex justify-center px-5"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.3, ease: EASE }}
            >
              <span className="pointer-events-auto flex items-center gap-3 rounded-full bg-ink py-2.5 pl-4 pr-2.5 text-[14px] font-medium text-white shadow-[0_18px_40px_-16px_rgba(22,26,53,0.7)]">
                <span className={toast.action ? "" : "pr-1.5"}>{toast.msg}</span>
                {toast.action && (
                  <button
                    type="button"
                    onClick={() => {
                      toast.action?.run();
                      setToast(null);
                    }}
                    className="rounded-full bg-white/12 px-3 py-1 text-[13.5px] font-semibold text-white transition-colors hover:bg-white/20"
                  >
                    {toast.action.label}
                  </button>
                )}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ToastContext>
  );
}

/* the purple glow and dot grid, laid out against the viewport so both copies line up exactly */
function Backdrop() {
  return (
    <>
      <div className="absolute left-1/2 top-[-260px] h-[620px] w-[1100px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(143,108,247,0.22),rgba(242,134,154,0.08)_60%,transparent)] blur-2xl" />
      <div className="dot-grid absolute inset-x-0 top-0 h-[520px] [mask-image:linear-gradient(to_bottom,#000,transparent)]" />
    </>
  );
}

/* Share, Requests and Customize are real pages, so the switch is navigation; the white thumb follows the route */
function Tabs({ pathname, handle }: { pathname: string; handle: string }) {
  const q = `?handle=${encodeURIComponent(handle)}`;
  const tabs = [
    { href: "/share", label: "Share" },
    { href: "/requests", label: "Requests" },
    { href: "/customize", label: "Customize" },
  ];
  return (
    <div className="flex items-center rounded-full bg-[#eef0f3] p-1 shadow-[inset_0_1px_2px_rgba(15,20,40,0.06)]">
      {tabs.map((t) => {
        const on = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href + q}
            aria-current={on ? "page" : undefined}
            className={`relative rounded-full px-2.5 py-1.5 text-[13.5px] font-semibold transition-colors duration-200 sm:px-4 sm:text-[14px] ${on ? "text-ink" : "text-muted hover:text-ink"}`}
          >
            {on && <Thumb layoutId="concierge-tab-thumb" />}
            <span className="relative">{t.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

/* the avatar opens a small account card: who's signed in, and a way out */
function Account({ handle }: { handle: string }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Your account"
        aria-expanded={open}
        onClick={() => {
          setEmail(recallEmail());
          setOpen((o) => !o);
        }}
        className="block rounded-full transition-transform duration-200 hover:scale-[1.04] active:scale-[0.98]"
      >
        <Avatar handle={handle} size={36} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute right-0 top-[calc(100%+12px)] w-[260px] origin-top-right rounded-[20px] border border-line bg-white p-2 shadow-[0_24px_50px_-22px_rgba(40,30,110,0.45)]"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.22, ease: EASE }}
          >
            <div className="flex items-center gap-3 px-3 py-3">
              <Avatar handle={handle} size={40} />
              <div className="min-w-0 leading-tight">
                <div className="truncate text-[15px] font-semibold text-ink">{displayName(handle)}</div>
                <div className="mt-0.5 truncate text-[13px] text-muted">{email ?? `@${handle}`}</div>
              </div>
            </div>
            <div className="mx-2 h-px bg-line" />
            <Link href="/" className="mt-1 flex items-center gap-2.5 rounded-[14px] px-3 py-2.5 text-[14px] font-medium text-ink-2 transition-colors hover:bg-lilac hover:text-ink">
              <RiLogoutBoxRLine size={17} aria-hidden="true" />
              Sign out
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
