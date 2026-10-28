"use client";

import { RiArrowDownSLine, RiArrowUpDownLine, RiInboxLine } from "@remixicon/react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useReducer, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { displayName } from "../names";
import { CREATORS, FIT, FIT_ORDER, byNewest, shortDate, type Creator, type Fit, type Status } from "./data";
import RequestPanel from "./RequestPanel";
import { useToast } from "./Shell";
import { markSeen, setStatus, useHandle, useSeen, useStatuses } from "./store";
import { EASE, Rise, Thumb } from "./ui";

type Tab = "new" | "interested" | "declined";

const noop = () => () => {};

const TABS: { id: Tab; status: Status; label: string; empty: [string, string] }[] = [
  { id: "new", status: "new", label: "New", empty: ["You're all caught up.", "New requests show up here as creators use your link."] },
  { id: "interested", status: "forward", label: "Interested", empty: ["No one yet.", "Creators you move forward show up here."] },
  { id: "declined", status: "declined", label: "Declined", empty: ["Nothing declined.", "Creators you decline show up here."] },
];

/*
  Everyone who used the link, vetted. One narrow column, one job per element:
  a two-line status, a single filter, then the requests as quiet cards grouped by fit.
*/
export default function Requests() {
  const handle = useHandle();
  const business = displayName(handle);
  const statuses = useStatuses();
  const seen = useSeen();
  const say = useToast();
  const [tab, setTab] = useState<Tab>("new");
  const [sort, setSort] = useState<"fit" | "date">("fit");
  const [picked, setPicked] = useState<{ id: string; queue: string[] } | null>(null);
  /* ?open=<id> (the control panel's "A creator pop-up" shortcut) lands with that request open */
  const linked = useSyncExternalStore(noop, () => new URLSearchParams(window.location.search).get("open"), () => null);
  const [, rerender] = useReducer((n: number) => n + 1, 0);

  const current = TABS.find((t) => t.id === tab)!;
  const count = (s: Status) => CREATORS.filter((c) => statuses[c.id] === s).length;
  /* a tab is "new" while it holds a request the business hasn't opened yet */
  const unread = (s: Status) => CREATORS.some((c) => statuses[c.id] === s && !seen.has(c.id));

  /* the visible list, in reading order: by fit (strong, maybe, not a fit), newest first within each, or just newest first */
  const items = useMemo(() => {
    const list = CREATORS.filter((c) => statuses[c.id] === current.status).sort(byNewest);
    if (tab !== "new" || sort === "date") return list;
    return list.sort((a, b) => FIT_ORDER.indexOf(a.fit) - FIT_ORDER.indexOf(b.fit));
  }, [statuses, current.status, tab, sort]);
  const order = items.map((c) => c.id);
  /* sorted by fit, the list splits into its verdicts under small headers; by date it stays one list */
  const grouped = tab === "new" && sort === "fit";
  const sortable = tab === "new" && order.length > 1;
  const sortMenu = <SortMenu value={sort} onChange={setSort} />;
  const groups: { fit: Fit | null; list: Creator[] }[] = grouped
    ? FIT_ORDER.map((fit) => ({ fit, list: items.filter((c) => c.fit === fit) })).filter((g) => g.list.length > 0)
    : [{ fit: null, list: items }];

  const deepLink = linked && CREATORS.some((c) => c.id === linked) ? { id: linked, queue: order.includes(linked) ? order : [linked] } : null;
  const open = picked ?? deepLink;
  /* once the pop-up is closed or changed, the link has done its job: drop ?open so the shortcut works again */
  const setOpen = (v: typeof picked) => {
    if (linked) {
      const url = new URL(window.location.href);
      url.searchParams.delete("open");
      window.history.replaceState(window.history.state, "", url);
      rerender();
    }
    setPicked(v);
  };

  const decide = (c: Creator, next: Status, sent = false) => {
    const before = statuses[c.id];
    setStatus(c.id, next);
    const msg =
      next === "forward" ? `${c.first} moved forward${sent ? ". Your message went out." : ""}` : next === "declined" ? "Declined. Your message went out." : `${c.first} is back in New`;
    say(msg, { label: "Undo", run: () => setStatus(c.id, before) });
  };

  const openCreator = open ? CREATORS.find((c) => c.id === open.id)! : null;
  const index = open ? open.queue.indexOf(open.id) : -1;
  const go = (d: -1 | 1) => open && setOpen({ ...open, id: open.queue[index + d] });

  /* opening a request (or stepping to it with ← →) counts as reading it */
  const openId = open?.id;
  useEffect(() => {
    if (openId) markSeen(openId);
  }, [openId]);

  return (
    <main className="relative mx-auto w-full max-w-[600px] px-5 pb-28 pt-[112px] sm:pt-[140px]">
      <Rise i={0}>
        <h1 className="dash-title">Requests</h1>
      </Rise>

      {/* one filter: which requests you're looking at */}
      <Rise i={1} className="mt-6">
        {/* the header switch's treatment: cooler grey track with a soft inset, so the white thumb stands out */}
        <div role="tablist" aria-label="Collab requests" className="flex rounded-[14px] bg-[#eef0f3] p-1 shadow-[inset_0_1px_2px_rgba(15,20,40,0.06)]">
          {TABS.map((t) => {
            const on = t.id === tab;
            const n = count(t.status);
            return (
              <button
                key={t.id}
                role="tab"
                id={`tab-${t.id}`}
                aria-selected={on}
                aria-controls="dash-list"
                type="button"
                onClick={() => setTab(t.id)}
                className={`relative flex h-10 flex-auto items-center justify-center gap-1 whitespace-nowrap rounded-[10px] px-1.5 text-[13px] font-medium sm:basis-0 sm:gap-1.5 sm:px-2 sm:text-[14px] transition-colors duration-200 ${on ? "text-ink" : "text-muted hover:text-ink"}`}
              >
                {on && <Thumb layoutId="dash-tab" rounded="rounded-[10px]" />}
                <span className="relative">{t.label}</span>
                {/* only New carries a count: red while it holds something unopened, grey once it's all been read */}
                {t.id === "new" && (
                  <span
                    className={`relative grid h-[18px] min-w-[18px] place-items-center rounded-full px-1 text-[11px] font-semibold sm:h-5 sm:min-w-5 sm:px-1.5 sm:text-[12px] tabular-nums transition-colors duration-200 ${
                      unread(t.status) ? "bg-[#e5484d] text-white" : "bg-[#e2e2e8] text-ink-2"
                    }`}
                  >
                    {/* Inter's figures sit half a pixel high in the circle; nudge them to its optical center */}
                    <span className="translate-y-[0.5px]">{n}</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </Rise>

      <Rise i={2} className="mt-6">
        <section id="dash-list" role="tabpanel" aria-labelledby={`tab-${tab}`}>
          {/* by date there are no headers to share a row with, so the sort menu sits on its own, right-aligned */}
          {sortable && !grouped && (
            <div className="mb-4 flex justify-end">
              {sortMenu}
            </div>
          )}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={`${tab}-${sort}`} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22, ease: EASE }} >
              {order.length === 0 ? (
                <Empty title={current.empty[0]} text={current.empty[1]} />
              ) : (
                <AnimatePresence initial={false}>
                  {groups.map((g, gi) => (
                    <motion.div
                      key={g.fit ?? "all"}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.35, ease: EASE }}
                    >
                      {g.fit && <GroupHeader fit={g.fit} count={g.list.length} first={gi === 0} aside={gi === 0 && sortable ? sortMenu : undefined} />}
                      <ul className="space-y-2">
                        <AnimatePresence initial={false}>
                          {g.list.map((c) => (
                            <motion.li
                              key={c.id}
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.35, ease: EASE }}
                            >
                              <Row creator={c} onOpen={() => setOpen({ id: c.id, queue: order })} />
                            </motion.li>
                          ))}
                        </AnimatePresence>
                      </ul>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </motion.div>
          </AnimatePresence>
        </section>
      </Rise>

      <AnimatePresence>
        {openCreator && (
          <RequestPanel
            key="panel"
            creator={openCreator}
            status={statuses[openCreator.id]}
            business={business}
            position={{ index, total: open!.queue.length }}
            onPrev={index > 0 ? () => go(-1) : undefined}
            onNext={index < open!.queue.length - 1 ? () => go(1) : undefined}
            onClose={() => setOpen(null)}
            onDecide={(s, sent) => {
              decide(openCreator, s, sent);
              // moving someone forward is done once the toast says so: close rather than show the "moved" footer
              if (s === "forward") setOpen(null);
            }}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

/* a verdict's header: the verdict and its count; the first one also carries the sort menu, pushed right */
function GroupHeader({ fit, count, first, aside }: { fit: Fit; count: number; first: boolean; aside?: ReactNode }) {
  return (
    <div className={`mb-3 flex items-center gap-2 pl-1 ${first ? "" : "pt-5"}`}>
      <h3 className="flex items-center gap-2 text-[15.5px] leading-5">
        <span className="font-semibold text-[#1c1c1c]">{FIT[fit].label}</span>
        <span className="text-[#999]">{count}</span>
      </h3>
      {aside && <div className="ml-auto">{aside}</div>}
    </div>
  );
}

/* one request, built to the Figma row: who and their reach, when, the fit tag, then the one-line take */
function Row({ creator: c, onOpen }: { creator: Creator; onOpen: () => void }) {
  const fit = FIT[c.fit];
  return (
    <button
      type="button"
      onClick={onOpen}
      // Figma's 0.5px stroke sits inside the 16px padding; CSS draws it outside, so the padding gives back the half pixel
      className="group block w-full rounded-[16px] border-[0.5px] border-[#e3e3e3] bg-white p-[15.5px] text-left transition-shadow duration-200 hover:shadow-[0_10px_28px_-18px_rgba(22,26,53,0.3)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={c.avatar} alt="" className="h-8 w-8 shrink-0 rounded-full border border-white object-cover drop-shadow-[0_4px_7px_rgba(0,0,0,0.08)]" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-[14px] font-semibold leading-[17px] text-black">{c.name}</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/img/share/verified.svg" alt="Verified" width={16} height={16} className="shrink-0" />
            </div>
            <div className="mt-1 flex gap-1 whitespace-nowrap text-[12px] leading-[15px] text-[#999]">
              <span className="truncate">@{c.handle}</span>
              <span className="shrink-0">· {c.followers}</span>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <span className="whitespace-nowrap text-[13px] leading-[19.5px] text-[#717171]">
            {/* the same on every tab; phones drop the word to keep the row on one line */}
            <span className="hidden sm:inline">Requested, </span>
            {shortDate(c.requested)}
          </span>
          <span className={`inline-flex h-[23px] items-center rounded-[6px] border-[0.5px] px-[9.5px] text-[12px] font-medium leading-none whitespace-nowrap ${fit.tag}`}>{fit.label}</span>
        </div>
      </div>
      <p className="mt-3 text-[14.5px] leading-[19.938px] text-[#1c1c1c] sm:pl-[44px] sm:pr-8">{c.summary}</p>
    </button>
  );
}

const SORTS = [
  { value: "fit", label: "Fit" },
  { value: "date", label: "Newest" },
] as const;

/* a labelled button that opens a small menu, so the ordering is visible and obviously changeable */
function SortMenu({ value, onChange }: { value: "fit" | "date"; onChange: (v: "fit" | "date") => void }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const current = SORTS.find((s) => s.value === value)!;

  useEffect(() => {
    if (!open) return;
    root.current?.querySelector<HTMLElement>('[aria-checked="true"]')?.focus();
    const outside = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const items = [...(root.current?.querySelectorAll<HTMLElement>('[role="menuitemradio"]') ?? [])];
        const i = items.indexOf(document.activeElement as HTMLElement);
        items[(i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length]?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", key);
    };
  }, [open]);

  return (
    <div ref={root} className="relative shrink-0">
      <button
        ref={button}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className={`inline-flex h-9 items-center gap-1.5 rounded-full border bg-white pl-3 pr-2.5 text-[13.5px] font-medium text-ink transition-colors ${open ? "border-[#dedee5]" : "border-[#ececf1] hover:border-[#dedee5]"}`}
      >
        <RiArrowUpDownLine size={15} aria-hidden="true" className="text-muted" />
        <span className="text-muted">Sort by:</span> {current.label}
        <RiArrowDownSLine size={16} aria-hidden="true" className={`text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            aria-label="Sort requests"
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.16, ease: EASE }}
            className="absolute right-0 top-full z-30 mt-2 flex w-40 origin-top-right flex-col gap-1 rounded-[16px] border border-[#ececf1] bg-white p-1.5 shadow-[0_20px_40px_-16px_rgba(22,26,53,0.28)]"
          >
            {SORTS.map((s) => {
              const on = s.value === value;
              return (
                <button
                  key={s.value}
                  type="button"
                  role="menuitemradio"
                  aria-checked={on}
                  onClick={() => {
                    onChange(s.value);
                    setOpen(false);
                    button.current?.focus();
                  }}
                  className={`flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-left outline-none transition-colors ${on ? "bg-[#f3f1fe]" : "hover:bg-[#f6f6f9] focus-visible:bg-[#f6f6f9]"}`}
                >
                  {/* a radio: a hairline ring at rest, a thick violet ring around a white dot when chosen */}
                  <span
                    aria-hidden="true"
                    className={`size-[18px] shrink-0 rounded-full bg-white transition-[border-width,border-color] duration-200 ${on ? "border-[5px] border-[#7a5cfa]" : "border-[1.5px] border-[#cfcfd8]"}`}
                  />
                  <span className="min-w-0 flex-1 text-[14.5px] font-medium leading-snug text-ink">{s.label}</span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex flex-col items-center rounded-[18px] border border-dashed border-[#e2e2e8] px-6 py-14 text-center">
      <RiInboxLine size={22} className="text-muted" aria-hidden="true" />
      <div className="mt-3 text-[15.5px] font-medium text-ink">{title}</div>
      <p className="mt-1 max-w-[300px] text-[14px] text-muted">{text}</p>
    </div>
  );
}
