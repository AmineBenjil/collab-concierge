"use client";

import {
  RiAddLine,
  RiArrowDownSLine,
  RiArrowLeftLine,
  RiInbox2Fill,
  RiInbox2Line,
  RiLogoutBoxRLine,
  RiPaletteFill,
  RiPaletteLine,
  RiSettings3Line,
  RiShareForwardFill,
  RiShareForwardLine,
} from "@remixicon/react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
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

const LIVE = ["/share", "/requests", "/customize", "/settings"];

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
        {/* the glow and dots stay pinned to the viewport while the page scrolls over them; Customize keeps
            just the dots, fading out down the window, without the glow */}
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
          {pathname === "/customize" ? <Dots /> : <Backdrop />}
        </div>

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
      <Dots />
    </>
  );
}

const Dots = () => <div className="dot-grid absolute inset-x-0 top-0 h-[520px] [mask-image:linear-gradient(to_bottom,#000,transparent)]" />;

/*
  Share, Requests and Customize are real pages, so the switch is navigation: centred, an icon beside each
  label, and the page you're on sits in a purple pill with its icon filled and its label in white. Phones
  stack the icon over a small label.
*/
const PAGES = [
  { href: "/share", label: "Share", icon: RiShareForwardLine, on: RiShareForwardFill },
  { href: "/requests", label: "Requests", icon: RiInbox2Line, on: RiInbox2Fill },
  { href: "/customize", label: "Customize", icon: RiPaletteLine, on: RiPaletteFill },
];

/*
  Every tab is pill-sized (8px down) whether it's lit or not, 26px apart, so the labels never move when you
  switch. The side after the label is padded by the gap plus the icon's side (8 + 14 = 22px) so the pill
  reads balanced around the icon-and-label pair rather than heavy on the icon. The pill itself is one element behind them that slides to the tab you're on, placed from
  the tab's offset inside the bar. A shared layoutId measured it against the page instead, so when the next
  page started back at the top it flew in from wherever you'd scrolled to.
*/
function Pages({ pathname, handle }: { pathname: string; handle: string }) {
  const q = `?handle=${encodeURIComponent(handle)}`;
  const bar = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  useLayoutEffect(() => {
    const el = bar.current;
    if (!el) return;
    const place = () => {
      const tab = el.querySelector<HTMLElement>('[aria-current="page"]');
      setPill(tab ? { x: tab.offsetLeft, y: tab.offsetTop, width: tab.offsetWidth, height: tab.offsetHeight } : null);
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(el);
    return () => ro.disconnect();
  }, [pathname]);

  return (
    <div ref={bar} className="relative flex h-full items-center gap-1 sm:gap-[26px]">
      {pill && (
        <motion.span
          aria-hidden="true"
          className="absolute left-0 top-0 rounded-[16px] border-[0.5px] border-[#ebe5f8] bg-[#7a5cfa] sm:rounded-[40px]"
          initial={false}
          animate={pill}
          transition={{ duration: 0.4, ease: EASE }}
        />
      )}
      {PAGES.map((p) => {
        const on = pathname === p.href;
        const Icon = on ? p.on : p.icon;
        return (
          <Link
            key={p.href}
            href={p.href + q}
            aria-current={on ? "page" : undefined}
            className={`group relative flex flex-col items-center justify-center gap-0.5 rounded-[16px] px-3 py-1.5 transition-colors duration-200 sm:flex-row sm:gap-2 sm:rounded-[40px] sm:pl-[14px] sm:pr-[22px] sm:py-2 ${on ? "" : "hover:bg-[#f4f4f6]"}`}
          >
            <Icon size={20} aria-hidden="true" className={`transition-colors duration-200 ${on ? "text-white" : "text-[#9a9aa8] group-hover:text-ink-2"}`} />
            <span className={`text-[11.5px] font-semibold transition-colors duration-200 sm:text-[14.5px] sm:leading-[22px] ${on ? "text-white" : "text-muted group-hover:text-ink"}`}>{p.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

const MENU_ITEM = "flex w-full items-center gap-2.5 rounded-[14px] px-3 py-2.5 text-left text-[14px] font-medium text-ink-2 transition-colors hover:bg-lilac hover:text-ink";

/* the avatar opens a small account card: who's signed in, settings, another Concierge, and a way out */
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
            <div className="mx-2 mb-1 h-px bg-line" />
            {/* another Concierge starts where the first one did, at the handle field on the home page */}
            <Link href={`/settings?handle=${encodeURIComponent(handle)}`} onClick={() => setOpen(false)} className={MENU_ITEM}>
              <RiSettings3Line size={17} aria-hidden="true" />
              Settings
            </Link>
            <Link href="/#hero-claim" onClick={() => setOpen(false)} className={MENU_ITEM}>
              <RiAddLine size={17} aria-hidden="true" />
              Add another Concierge
            </Link>
            <Link href="/" className={MENU_ITEM}>
              <RiLogoutBoxRLine size={17} aria-hidden="true" />
              Sign out
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
