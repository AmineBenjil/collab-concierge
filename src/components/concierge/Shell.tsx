"use client";

import { RiArrowDownSLine, RiArrowLeftLine, RiInbox2Fill, RiInbox2Line, RiLogoutBoxRLine, RiPaletteFill, RiPaletteLine, RiShareForwardFill, RiShareForwardLine } from "@remixicon/react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Avatar } from "../HandleForm";
import Logo, { BrandIcon } from "../Logo";
import { displayName } from "../names";
import { recallEmail, useHandle } from "./store";
import { EASE } from "./ui";

/*
  The frame around the business side (/start, /share, /requests, /customize): the soft glow, the app bar
  and the toast. It's a layout, so it stays mounted while you switch pages and the underline under
  Share/Requests/Customize can slide between them.
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
        {/* the glow and dots stay pinned to the viewport while the page scrolls over them; Customize splits
            the screen into flat panels, so it goes without */}
        {pathname !== "/customize" && (
          <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
            <Backdrop />
          </div>
        )}

        {/* inside the Concierge the nav is an app bar: full width, flush with the top edge, frosted so the
            page scrolls softly under it; brand and account sit out at the edges, 48px in on laptops */}
        <header className="fixed inset-x-0 top-0 z-50 border-b border-[#e9e9ef] bg-white/80 backdrop-blur-xl backdrop-saturate-150">
          {/* logo, pages in the middle, account; the middle column stays centred whatever the sides hold */}
          <nav aria-label="Main" className="grid h-16 w-full grid-cols-[1fr_auto_1fr] items-center gap-3 px-5 text-ink sm:px-8 lg:px-12">
            <div className="flex items-center gap-2">
              {!live && (
                <Link href="/" aria-label="Back to the home page" className="-ml-1 grid h-9 w-9 place-items-center rounded-full text-ink-2 transition-colors hover:bg-lilac hover:text-ink">
                  <RiArrowLeftLine size={18} aria-hidden="true" />
                </Link>
              )}
              <Link href="/" aria-label="Benable Collab Concierge home" className="flex items-center gap-3">
                {/* phones get the icon alone so the pages have room */}
                <BrandIcon size={30} className="sm:hidden" />
                <span className="hidden sm:block">
                  <Logo />
                </span>
                <span className="hidden h-4 w-px bg-ink/15 lg:block" />
                <span className="hidden text-[14px] font-semibold lg:block">Collab Concierge</span>
              </Link>
            </div>
            <AnimatePresence>
              {live && (
                <motion.div key="pages" className="h-full" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}>
                  <Pages pathname={pathname} handle={handle} />
                </motion.div>
              )}
              {live && (
                <motion.div key="account" className="col-start-3 justify-self-end" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}>
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

/*
  Share, Requests and Customize are real pages, so the switch is navigation. Airbnb-style: centred, an icon
  beside each label (filled on the page you're on) and a dark underline on the bar's edge that slides
  between them. Phones stack the icon over a small label.
*/
const PAGES = [
  { href: "/share", label: "Share", icon: RiShareForwardLine, on: RiShareForwardFill },
  { href: "/requests", label: "Requests", icon: RiInbox2Line, on: RiInbox2Fill },
  { href: "/customize", label: "Customize", icon: RiPaletteLine, on: RiPaletteFill },
];

function Pages({ pathname, handle }: { pathname: string; handle: string }) {
  const q = `?handle=${encodeURIComponent(handle)}`;
  return (
    <div className="flex h-full items-stretch sm:gap-3">
      {PAGES.map((p) => {
        const on = pathname === p.href;
        const Icon = on ? p.on : p.icon;
        return (
          <Link
            key={p.href}
            href={p.href + q}
            aria-current={on ? "page" : undefined}
            className="group relative flex flex-col items-center justify-center gap-0.5 px-3 sm:flex-row sm:gap-2 sm:px-3.5"
          >
            <Icon
              size={20}
              aria-hidden="true"
              className={`transition-[color,transform] duration-200 group-hover:scale-110 ${on ? "text-[#5035e3]" : "text-[#9a9aa8] group-hover:text-ink-2"}`}
            />
            <span className={`text-[11.5px] font-semibold transition-colors duration-200 sm:text-[14.5px] ${on ? "text-ink" : "text-muted group-hover:text-ink"}`}>{p.label}</span>
            {/* a grey line previews the hover; the dark one marks where you are */}
            <span aria-hidden="true" className="absolute inset-x-2.5 -bottom-px h-[3px] rounded-full bg-[#dcdce3] opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
            {on && <motion.span layoutId="concierge-page-line" aria-hidden="true" transition={{ duration: 0.4, ease: EASE }} className="absolute inset-x-2.5 -bottom-px h-[3px] rounded-full bg-ink" />}
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
        className="group -mr-1 flex items-center gap-2.5 rounded-full p-1 transition-colors duration-200 hover:bg-[#f4f4f6] aria-expanded:bg-[#f4f4f6] sm:pl-3.5"
      >
        {/* the brand's name and a chevron say this opens; the avatar closes the bar at the edge. Phones keep just the avatar */}
        <span className="hidden items-center gap-1 sm:flex">
          <span className="max-w-[180px] truncate text-[14.5px] font-semibold text-ink">{displayName(handle)}</span>
          <RiArrowDownSLine size={18} aria-hidden="true" className={`shrink-0 text-muted transition-transform duration-200 group-hover:text-ink-2 ${open ? "rotate-180" : ""}`} />
        </span>
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
