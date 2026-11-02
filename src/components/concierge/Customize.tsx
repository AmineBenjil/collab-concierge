"use client";

import {
  RiAddLine,
  RiArrowDownSLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiArrowRightUpLine,
  RiArrowUpLine,
  RiCheckLine,
  RiCloseLine,
  RiEyeLine,
  RiLock2Line,
  RiSparkling2Fill,
} from "@remixicon/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import {
  ALWAYS_ASKED,
  BRIEF,
  DEFAULT_CUSTOM,
  READY,
  describe,
  newQuestion,
  saveCustom,
  useCustom,
  type Custom,
  type PreviewMessage,
  type Question,
  type Screen,
} from "../creator/custom";
import { CreatorPhone } from "../creator/PreviewDevice";
import { BrandIcon } from "../Logo";
import { useToast } from "./Shell";
import { useHandle } from "./store";
import { EASE, Rise, Segmented, Thumb } from "./ui";

/*
  Make it yours, split by who it's for. "What creators see" lists the link's four stages in the order
  creators meet them; the open stage is what the phone shows, and the stepper under the phone walks the
  same screens, opening each stage as it goes. "What your Concierge knows" is the brief: creators never
  see it, so the phone steps aside for where the brief is headed, tuning it by chat. Everything saves as
  you type; a question opens in its own editor.
*/

type Side = "creators" | "concierge";
type Stage = "welcome" | "asked" | "yours" | "thanks";
type Editing = { q: Question; isNew: boolean } | null;

/* phones get the short labels, so both fit the switch */
const SIDES: { id: Side; label: string; short: string }[] = [
  { id: "creators", label: "What creators see", short: "Creators see" },
  { id: "concierge", label: "What your Concierge knows", short: "Concierge knows" },
];
const STAGES: { id: Stage; label: string }[] = [
  { id: "welcome", label: "Welcome message" },
  { id: "asked", label: "Questions we always ask" },
  { id: "yours", label: "Your questions" },
  { id: "thanks", label: "Thank-you message" },
];

const MAX_QUESTIONS = 5;
const MAX_ANSWERS = 8;
const MESSAGE_MAX = 300;

/* where each stage starts among the screens: the opener, then ours, then theirs, then the thank-you */
const ASKED_AT = 1;
const YOURS_AT = ASKED_AT + ALWAYS_ASKED.length;

/* every screen a creator passes through, in order; with none of their own questions, "yours" is the empty state */
function screens(qs: Question[]): Screen[] {
  return [
    { kind: "opener" },
    ...ALWAYS_ASKED.map((a) => ({ kind: "step" as const, step: a.step })),
    ...(qs.length ? qs.map((question, index) => ({ kind: "custom" as const, question, index, total: qs.length })) : [{ kind: "empty" as const, total: 0 }]),
    { kind: "done" },
  ];
}
const stageOf = (s: Screen): Stage => (s.kind === "opener" ? "welcome" : s.kind === "step" ? "asked" : s.kind === "done" ? "thanks" : "yours");

/* the Share page's request card: hairline border, white panels on a grey card, 4px gaps between them */
const CARD = "flex flex-col gap-1 overflow-hidden rounded-[24px] border border-[#ececf1] bg-[#f2f2f2]";
const PANEL = "bg-white px-5 py-5 sm:px-6";
const BOX = "overflow-hidden rounded-[16px] border-[0.5px] border-[#e3e3e3] bg-[#fafafa]";
const HEADING = "text-[14px] font-semibold leading-4 text-[#1c1c1c]";
const HINT = "text-[13px] leading-snug text-muted";
/* the controls stop growing on wide screens and sit centred in their side */
const COLUMN = "mx-auto max-w-[720px]";
/* text fields: light grey at rest; white with the purple stroke and a soft glow while typing */
const FIELD =
  "w-full rounded-[16px] border-[0.5px] border-[#e3e3e3] bg-[#fafafa] px-4 text-[15px] text-ink outline-none transition-[background-color,box-shadow,border-color] duration-200 placeholder:text-muted focus:border-transparent focus:bg-white focus:shadow-[inset_0_0_0_2px_#8f7cf7,0_0_0_4px_rgba(143,124,247,0.14)]";

export default function Customize() {
  const handle = useHandle();
  const custom = useCustom(handle);
  const say = useToast();
  const frame = useRef<HTMLIFrameElement>(null);

  const [side, setSide] = useState<Side>("creators");
  const [pos, setPos] = useState(0);
  const [editing, setEditingState] = useState<Editing>(null);
  /* the staggered entrance plays on arrival only; after that, swapping views is just the short slide */
  const [swapped, setSwapped] = useState(false);
  const setEditing = (e: Editing) => {
    // the outgoing view lingers for its exit; nothing typed meanwhile should land in its fields
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    setSwapped(true);
    setEditingState(e);
  };
  const [saved, setSaved] = useState(0);

  const update = (patch: Partial<Custom>) => {
    saveCustom(handle, { ...custom, ...patch });
    setSaved(Date.now());
  };
  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(0), 1800);
    return () => clearTimeout(t);
  }, [saved]);

  const qs = custom.questions;
  const seq = screens(qs);
  const at = Math.min(pos, seq.length - 1);
  const stage = stageOf(seq[at]);
  const firstOf: Record<Stage, number> = { welcome: 0, asked: ASKED_AT, yours: YOURS_AT, thanks: seq.length - 1 };

  /* opening or closing a question swaps the whole column, so it starts from the top */
  const open = !!editing;
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [open]);

  /* what the phone shows: the question being edited, else wherever the list or the stepper is */
  const screen: Screen = (() => {
    if (!editing) return seq[at];
    const i = qs.findIndex((q) => q.id === editing.q.id);
    return { kind: "custom", question: editing.q, index: i < 0 ? qs.length : i, total: i < 0 ? qs.length + 1 : qs.length };
  })();

  /* the phone's flow listens for this; it also asks for it once it has loaded */
  const message: PreviewMessage = { type: "cc:customize", custom, screen };
  const latest = useRef(message);
  const post = useCallback(() => frame.current?.contentWindow?.postMessage(latest.current, window.location.origin), []);
  useEffect(() => {
    latest.current = message;
    post();
  });
  useEffect(() => {
    const on = (e: MessageEvent) => e.origin === window.location.origin && e.data?.type === READY && post();
    window.addEventListener("message", on);
    return () => window.removeEventListener("message", on);
  }, [post]);

  const saveQuestion = () => {
    if (!editing) return;
    const q = { ...editing.q, title: editing.q.title.trim(), sub: editing.q.sub.trim(), answers: editing.q.answers.map((a) => a.trim()).filter(Boolean) };
    const next = editing.isNew ? [...qs, q] : qs.map((x) => (x.id === q.id ? q : x));
    update({ questions: next });
    setPos(YOURS_AT + next.findIndex((x) => x.id === q.id));
    setEditing(null);
    say(editing.isNew ? "Question added." : "Question updated.");
  };
  const removeQuestion = () => {
    if (!editing) return;
    const before = qs;
    update({ questions: qs.filter((x) => x.id !== editing.q.id) });
    setPos(YOURS_AT);
    setEditing(null);
    // undo puts the list back onto whatever was edited since, not onto this moment's copy
    say("Question removed.", { label: "Undo", run: () => saveCustom(handle, { ...latest.current.custom, questions: before }) });
  };

  const intro = !swapped;
  return (
    /* laptops split the screen under the app bar, the way a map view does: the controls scroll on the left 70%,
       the stage is fixed on the right 30%, a shade darker behind a hairline that matches the bar's */
    <main className="relative mx-auto w-full max-w-[600px] px-5 pb-24 pt-[96px] sm:pt-[112px] lg:max-w-none lg:p-0 lg:pt-[65px]">
      <div className="min-w-0 lg:w-[70%] lg:px-12 lg:pb-24 lg:pt-12">
        <AnimatePresence mode="wait" initial={false}>
          {editing ? (
            <Swap key="edit" className={COLUMN}>
              <QuestionEditor
                intro={intro}
                q={editing.q}
                isNew={editing.isNew}
                onChange={(q) => setEditingState({ ...editing, q })}
                onCancel={() => setEditing(null)}
                onSave={saveQuestion}
                onDelete={removeQuestion}
              />
            </Swap>
          ) : (
            <Swap key="overview" className={COLUMN}>
              <In intro={intro} i={0}>
                <div className="flex items-end justify-between gap-4">
                  <h1 className="dash-title">
                    Make it <span className="grad-text">yours.</span>
                  </h1>
                  {/* a quiet tick each time a change lands; the slot is always there so nothing shifts */}
                  <span aria-live="polite" className={`mb-1 inline-flex items-center gap-1 text-[13px] font-semibold text-[#178a60] transition-opacity duration-300 ${saved ? "opacity-100" : "opacity-0"}`}>
                    <RiCheckLine size={15} aria-hidden="true" />
                    {saved ? "Saved" : ""}
                  </span>
                </div>
                <p className="mt-3 text-[15.5px] leading-relaxed text-ink-2">Edit what creators see when they open your link, and teach your Concierge who you’re looking for.</p>
              </In>

              {/* the Requests page's switch: cooler grey track with a soft inset, so the white thumb stands out */}
              <In intro={intro} i={1} className="mt-6">
                <div role="tablist" aria-label="Customize" className="flex rounded-[14px] bg-[#eef0f3] p-1 shadow-[inset_0_1px_2px_rgba(15,20,40,0.06)]">
                  {SIDES.map((s) => {
                    const on = s.id === side;
                    return (
                      <button
                        key={s.id}
                        role="tab"
                        id={`tab-${s.id}`}
                        aria-selected={on}
                        aria-controls="customize-panel"
                        type="button"
                        onClick={() => setSide(s.id)}
                        className={`relative flex h-10 flex-1 basis-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-[10px] px-2 text-[13px] font-medium sm:text-[14px] transition-colors duration-200 ${on ? "text-ink" : "text-muted hover:text-ink"}`}
                      >
                        {on && <Thumb layoutId="customize-side" rounded="rounded-[10px]" />}
                        {s.id === "concierge" && <RiSparkling2Fill size={14} aria-hidden="true" className={`relative transition-colors duration-200 ${on ? "text-[#7a5cfa]" : ""}`} />}
                        <span className="relative sm:hidden">{s.short}</span>
                        <span className="relative hidden sm:inline">{s.label}</span>
                      </button>
                    );
                  })}
                </div>
              </In>

              <In intro={intro} i={2} className="mt-6">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.section
                    key={side}
                    id="customize-panel"
                    role="tabpanel"
                    aria-labelledby={`tab-${side}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.22, ease: EASE }}
                  >
                    {side === "creators" ? (
                      <Flow
                        handle={handle}
                        custom={custom}
                        stage={stage}
                        screen={seq[at]}
                        onStage={(s) => setPos(firstOf[s])}
                        onScreen={setPos}
                        onWelcome={(welcome) => update({ welcome })}
                        onThanks={(thanks) => update({ thanks })}
                        onGifted={(gifted) => {
                          update({ gifted });
                          setPos(ASKED_AT + ALWAYS_ASKED.findIndex((a) => a.step === "payment"));
                        }}
                        onEdit={(q) => setEditing({ q, isNew: false })}
                        onAdd={() => setEditing({ q: newQuestion(), isNew: true })}
                        onConcierge={() => setSide("concierge")}
                      />
                    ) : (
                      <>
                        <Brief brief={custom.brief} onChange={(brief) => update({ brief })} />
                        {/* no room beside it under laptop width, so the chat follows the brief */}
                        <div className="mt-6 lg:hidden">
                          <ConciergeChat />
                        </div>
                      </>
                    )}
                  </motion.section>
                </AnimatePresence>
              </In>
            </Swap>
          )}
        </AnimatePresence>
      </div>

      {/* the stage: fixed to the window rather than sticky, so scrolling (bounces included) never moves it.
          Creators never see the brief, so on that side the phone steps aside for the chat, staying loaded
          for the way back */}
      <div className="fixed bottom-0 right-0 top-[65px] hidden w-[30%] border-l border-[#e9e9ef] bg-[#f3f3f6] lg:block">
        <Rise i={1} className="flex h-full flex-col items-center justify-center px-10 py-8">
          <aside aria-label="Live preview" className={`flex flex-col items-center ${side === "creators" ? "" : "hidden"}`}>
            {/* as tall as the window allows, and never wider than the stage */}
            <CreatorPhone
              frameRef={frame}
              src={`/c/${encodeURIComponent(handle)}?embed=1&customize=1`}
              className="h-[min(720px,calc(100svh-210px),calc((30vw-80px)*2))] min-h-[420px]"
            />
            {editing ? (
              <p className="mt-3 flex h-[50px] items-center text-[13px] text-muted">Live preview of what creators see</p>
            ) : (
              <Stepper label={STAGES.find((s) => s.id === stage)!.label} at={at} total={seq.length} onGo={setPos} />
            )}
          </aside>
          {side === "concierge" && (
            <div className="w-full max-w-[380px]">
              <ConciergeChat />
            </div>
          )}
        </Rise>
      </div>
    </main>
  );
}

/* the editor column swaps between the overview and a question, sliding a little sideways */
function Swap({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.3, ease: EASE }}>
      {children}
    </motion.div>
  );
}

/* under the phone: tap through the link the way a creator would; the list on the left follows */
function Stepper({ label, at, total, onGo }: { label: string; at: number; total: number; onGo: (i: number) => void }) {
  const arrow = "grid size-8 place-items-center rounded-full text-ink-2 transition-[background-color,color,opacity] hover:bg-[#f4f4f6] hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent";
  return (
    <div className="mt-3 flex items-center gap-1">
      <button type="button" aria-label="Previous screen" disabled={at === 0} onClick={() => onGo(at - 1)} className={arrow}>
        <RiArrowLeftSLine size={18} aria-hidden="true" />
      </button>
      <span aria-live="polite" className="min-w-[188px] text-center text-[13px] leading-tight">
        <span className="block font-semibold text-ink">{label}</span>
        <span className="block tabular-nums text-muted">
          Screen {at + 1} of {total}
        </span>
      </span>
      <button type="button" aria-label="Next screen" disabled={at === total - 1} onClick={() => onGo(at + 1)} className={arrow}>
        <RiArrowRightSLine size={18} aria-hidden="true" />
      </button>
    </div>
  );
}

/* ---------- what creators see: the link's four stages, in order ---------- */

function Flow({
  handle,
  custom,
  stage,
  screen,
  onStage,
  onScreen,
  onWelcome,
  onThanks,
  onGifted,
  onEdit,
  onAdd,
  onConcierge,
}: {
  handle: string;
  custom: Custom;
  stage: Stage;
  screen: Screen;
  onStage: (s: Stage) => void;
  onScreen: (i: number) => void;
  onWelcome: (v: string) => void;
  onThanks: (v: string) => void;
  onGifted: (v: boolean) => void;
  onEdit: (q: Question) => void;
  onAdd: () => void;
  onConcierge: () => void;
}) {
  const qs = custom.questions;
  const full = qs.length >= MAX_QUESTIONS;

  const summary: Record<Stage, string> = {
    welcome: custom.welcome.trim() || "None. Creators go straight to the button.",
    asked: "Socials, collab idea, payment, audience, address, contact",
    yours: qs.length ? qs.map((q) => q.title).join(" · ") : `None yet. Add up to ${MAX_QUESTIONS}.`,
    thanks: custom.thanks.trim() || "None.",
  };
  const meta: Partial<Record<Stage, ReactNode>> = {
    asked: (
      <span className="flex items-center gap-1 text-[13px] text-muted">
        <RiLock2Line size={14} aria-hidden="true" />
        {ALWAYS_ASKED.length}
      </span>
    ),
    yours: (
      <span className="text-[13px] tabular-nums text-muted">
        {qs.length} of {MAX_QUESTIONS}
      </span>
    ),
  };

  const body: Record<Stage, ReactNode> = {
    welcome: <Message label="Welcome message" hint="The first thing creators read when they open your link." value={custom.welcome} fallback={DEFAULT_CUSTOM.welcome} onChange={onWelcome} />,
    asked: (
      <>
        <ul className={BOX}>
          {ALWAYS_ASKED.map((a, i) => (
            <li key={a.step} className="border-b border-[#ececf1] last:border-b-0">
              <Row on={screen.kind === "step" && screen.step === a.step} onClick={() => onScreen(ASKED_AT + i)}>
                <span className="min-w-0 flex-1 truncate">{a.label}</span>
              </Row>
            </li>
          ))}
        </ul>
        {/* a note under the payment question, for businesses that mostly do gifted collabs */}
        <div className={`mt-2 ${BOX}`}>
          <Toggle label="Prefer gifted collabs" hint="Adds a note to the payment question: you usually prioritize gifted collabs." on={custom.gifted} onChange={onGifted} />
        </div>
        <p className={`mt-2.5 ${HINT}`}>
          Your Concierge sorts requests using these answers.{" "}
          <button type="button" onClick={onConcierge} className="font-semibold text-[#3b25c4] transition-colors hover:text-[#2c1aa3]">
            See what it knows
          </button>
        </p>
      </>
    ),
    yours: (
      <>
        <ul className={BOX}>
          {qs.map((q, i) => {
            const on = screen.kind === "custom" && screen.question.id === q.id;
            return (
              <li key={q.id} className="relative border-b border-[#ececf1]">
                {/* on laptops a tap shows it in the phone first; without the phone there's nothing to show, so it opens */}
                <Row on={on} onClick={() => (window.matchMedia("(min-width: 1024px)").matches ? onScreen(YOURS_AT + i) : onEdit(q))} className={on ? "pr-[84px]" : ""}>
                  <span className="min-w-0 flex-1 leading-tight">
                    <span className="block truncate font-semibold text-ink">{q.title}</span>
                    <span className="mt-0.5 block truncate text-[13px] font-normal text-muted">{describe(q)}</span>
                  </span>
                </Row>
                {on && (
                  <button
                    type="button"
                    onClick={() => onEdit(q)}
                    className="absolute right-3 top-1/2 h-8 -translate-y-1/2 rounded-full bg-white px-3.5 text-[13px] font-semibold text-ink shadow-[inset_0_0_0_0.5px_#d9d9df,0_1px_2px_rgba(15,20,40,0.06)] transition-colors hover:bg-[#f4f4f6]"
                  >
                    Edit
                  </button>
                )}
              </li>
            );
          })}
          <li>
            <button type="button" onClick={onAdd} disabled={full} className="flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-[#f4f4f6] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#5035e3] text-white">
                <RiAddLine size={16} aria-hidden="true" />
              </span>
              <span className="text-[15px] font-semibold text-[#3b25c4]">Add a question</span>
            </button>
          </li>
        </ul>
        <p className={`mt-2.5 ${HINT}`}>{full ? `You can add up to ${MAX_QUESTIONS} of your own.` : "Creators answer yours right after the ones we always ask."}</p>
      </>
    ),
    thanks: <Message label="Thank-you message" hint="Shown after a creator sends their request." value={custom.thanks} fallback={DEFAULT_CUSTOM.thanks} onChange={onThanks} />,
  };

  return (
    <>
      {/* under laptop width there's no room for the phone, so the full preview opens instead */}
      <div className="mb-3 flex justify-end lg:hidden">
        <a
          href={`/c/${encodeURIComponent(handle)}?preview=1`}
          target="_blank"
          rel="noopener"
          className="group inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#3b25c4] transition-colors hover:text-[#2c1aa3]"
        >
          Preview
          <RiArrowRightUpLine size={16} aria-hidden="true" className="text-[#8b7aec] transition-transform duration-200 group-hover:-translate-y-px group-hover:translate-x-px" />
        </a>
      </div>

      <ol className="relative">
        {/* the thread that ties the stages into one flow */}
        <span aria-hidden="true" className="absolute bottom-8 left-[15.5px] top-8 w-px bg-[#e1e1e8]" />
        {STAGES.map((s, i) => {
          const on = stage === s.id;
          return (
            <li key={s.id} className="relative grid grid-cols-[32px_minmax(0,1fr)] gap-3 pb-3 last:pb-0">
              <span
                aria-hidden="true"
                className={`relative mt-[15px] grid size-8 place-items-center rounded-full text-[13px] font-semibold tabular-nums ring-4 ring-bg transition-colors duration-200 ${
                  on ? "bg-[#5035e3] text-white" : "bg-white text-ink-2 shadow-[inset_0_0_0_0.5px_#d9d9df]"
                }`}
              >
                {i + 1}
              </span>
              <div
                className={`overflow-hidden rounded-[20px] border bg-white transition-[border-color,box-shadow] duration-200 ${
                  on ? "border-[#8f7cf7] shadow-[0_0_0_4px_rgba(143,124,247,0.12),0_18px_40px_-28px_rgba(80,53,227,0.5)]" : "border-[#ececf1] hover:border-[#dcdce4]"
                }`}
              >
                <button type="button" aria-expanded={on} onClick={() => onStage(s.id)} className="flex w-full items-center gap-3 px-5 py-4 text-left">
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-[15.5px] font-semibold text-ink">
                      {s.label}
                      {on && (
                        <span className="hidden items-center gap-1 rounded-full bg-lilac px-2 py-0.5 text-[11.5px] font-semibold text-[#3b25c4] lg:inline-flex">
                          <RiEyeLine size={12} aria-hidden="true" />
                          In the preview
                        </span>
                      )}
                    </span>
                    {!on && <span className="mt-0.5 block truncate text-[13.5px] text-muted">{summary[s.id]}</span>}
                  </span>
                  {meta[s.id]}
                  <RiArrowDownSLine size={18} aria-hidden="true" className={`shrink-0 text-muted transition-transform duration-300 ${on ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence initial={false}>
                  {on && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.32, ease: EASE }} className="overflow-hidden">
                      <div className="px-5 pb-5">{body[s.id]}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </li>
          );
        })}
      </ol>
    </>
  );
}

/* a row inside a stage; the one on the phone is lit, its dot filled */
function Row({ on, onClick, className = "", children }: { on: boolean; onClick: () => void; className?: string; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={on || undefined}
      className={`flex w-full items-center gap-3 px-4 py-3 text-left text-[14.5px] transition-colors ${on ? "bg-lilac font-medium text-ink" : "text-ink-2 hover:bg-[#f4f4f6] hover:text-ink"} ${className}`}
    >
      <span aria-hidden="true" className={`size-1.5 shrink-0 rounded-full transition-colors ${on ? "bg-[#5035e3]" : "bg-[#d4d4de]"}`} />
      {children}
    </button>
  );
}

/* ---------- what the Concierge knows: the brief, edited in place ---------- */

function Brief({ brief, onChange }: { brief: Custom["brief"]; onChange: (b: Custom["brief"]) => void }) {
  const id = useId();
  return (
    <>
      <p className="mb-3 px-1 text-[13.5px] leading-snug text-ink-2">Creators never see this. Your Concierge reads all of it on every new request.</p>
      <div className={CARD}>
        {BRIEF.map((s) => (
          <section key={s.id} className={PANEL}>
            <label htmlFor={`${id}-${s.id}`} className={`flex items-center gap-2 ${HEADING}`}>
              <RiSparkling2Fill size={14} aria-hidden="true" className="text-[#8f7cf7]" />
              {s.heading}
            </label>
            <textarea
              id={`${id}-${s.id}`}
              value={brief[s.id]}
              onChange={(e) => onChange({ ...brief, [s.id]: e.target.value })}
              rows={2}
              placeholder="Anything your Concierge should know"
              className={`${FIELD} mt-3 block min-h-[72px] resize-none py-3 leading-[22px] [field-sizing:content]`}
            />
          </section>
        ))}
      </div>
    </>
  );
}

/*
  Where the brief is headed: tuning the Concierge by talking to it. Not live yet, so the conversation
  plays itself on a loop: the Concierge checks in, the business types a reply, the Concierge takes it on.
*/
type Line = { from: "concierge" | "you" | "note"; text: string };
const SCRIPT: Line[] = [
  { from: "concierge", text: "Hi! I went through 14 requests for you this week." },
  { from: "concierge", text: "How have I been doing? Anything you want me to change?" },
  { from: "you", text: "Great! Only send me creators with an LA audience." },
  { from: "concierge", text: "Got it. I'll pass on anyone whose audience isn't mostly in Los Angeles." },
  { from: "note", text: "Added to Who to prioritize" },
];

function ConciergeChat() {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(reduce ? SCRIPT.length : 0);
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (reduce) return;
    let alive = true;
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    (async () => {
      while (alive) {
        await wait(800);
        for (let i = 0; i < SCRIPT.length && alive; i++) {
          const l = SCRIPT[i];
          if (l.from === "you") {
            // their reply types itself into the box, then sends
            await wait(900);
            for (let c = 1; c <= l.text.length && alive; c++) {
              setDraft(l.text.slice(0, c));
              await wait(38);
            }
            await wait(500);
            setDraft("");
          } else if (l.from === "concierge") {
            setTyping(true);
            await wait(1300);
            setTyping(false);
          } else {
            await wait(500);
          }
          if (!alive) return;
          setShown(i + 1);
          await wait(1000);
        }
        await wait(5000);
        if (!alive) return;
        setShown(0);
      }
    })();
    return () => {
      alive = false;
    };
  }, [reduce]);

  return (
    <section aria-labelledby="concierge-chat" className="flex h-[540px] flex-col overflow-hidden rounded-[24px] lg:h-[min(540px,calc(100svh-var(--chat-top,88px)-24px))] lg:min-h-[400px] border border-[#ececf1] bg-white shadow-[0_30px_60px_-40px_rgba(40,30,110,0.35)]">
      <header className="flex items-center gap-3 border-b border-[#ececf1] px-5 py-4">
        <span className="relative shrink-0">
          {/* a soft ring breathes while the Concierge is writing */}
          <motion.span
            aria-hidden="true"
            className="absolute -inset-[3px] rounded-full bg-[linear-gradient(135deg,#8f7cf7,#f0a2c6)]"
            animate={{ opacity: typing ? [0.5, 1, 0.5] : 0.5 }}
            transition={typing ? { duration: 1.4, repeat: Infinity, ease: "easeInOut" } : { duration: 0.4 }}
          />
          <span className="relative block size-10 overflow-hidden rounded-full ring-2 ring-white">
            <BrandIcon size={40} />
          </span>
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <h2 id="concierge-chat" className="text-[15.5px] font-semibold text-ink">
            Your Concierge
          </h2>
          <p className="mt-0.5 truncate text-[13px] text-muted">{typing ? "Typing…" : "Talk it through, soon"}</p>
        </div>
        <span className="shrink-0 rounded-full bg-lilac px-2.5 py-1 text-[12px] font-semibold text-[#3b25c4]">Coming soon</span>
      </header>

      <p className="sr-only">A preview: your Concierge checks in on how it’s doing, and learns from your reply.</p>
      <div aria-hidden="true" className="flex flex-1 flex-col justify-end gap-2 overflow-hidden px-5 py-4">
        {/* popLayout: the typing dots leave the flow at once, so the reply takes their place without a gap */}
        <AnimatePresence initial={false} mode="popLayout">
          {SCRIPT.slice(0, shown).map((l) => (
            <motion.div
              key={l.text}
              layout
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.4 } }}
              transition={{ duration: 0.4, ease: EASE }}
              className={l.from === "you" ? "self-end" : "self-start"}
            >
              {l.from === "note" ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-lilac px-3 py-1.5 text-[13px] font-medium text-[#3b25c4]">
                  <RiSparkling2Fill size={13} aria-hidden="true" className="text-[#7a5cfa]" />
                  {l.text}
                </span>
              ) : (
                <p
                  className={`max-w-[260px] rounded-[18px] px-3.5 py-2 text-[14.5px] leading-snug ${
                    l.from === "you" ? "rounded-br-[6px] bg-[#5035e3] text-white" : "rounded-bl-[6px] bg-[#f2f2f4] text-ink"
                  }`}
                >
                  {l.text}
                </p>
              )}
            </motion.div>
          ))}
          {typing && (
            <motion.div key="typing" layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="self-start">
              <span className="flex h-[38px] items-center gap-1 rounded-[18px] rounded-bl-[6px] bg-[#f2f2f4] px-4">
                {[0, 1, 2].map((d) => (
                  <motion.span
                    key={d}
                    className="size-1.5 rounded-full bg-[#9a9aa8]"
                    animate={{ y: [0, -3, 0], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 0.9, repeat: Infinity, delay: d * 0.15, ease: "easeInOut" }}
                  />
                ))}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* not live yet: the box only ever fills with the scripted reply */}
      <div aria-hidden="true" className="px-4 pb-4">
        <div className="flex h-12 items-center gap-2 rounded-full border-[0.5px] border-[#e3e3e3] bg-[#fafafa] pl-4 pr-1.5">
          <span className={`min-w-0 flex-1 truncate text-[14.5px] ${draft ? "text-ink" : "text-muted"}`}>{draft || "Reply to your Concierge"}</span>
          <span className={`grid size-9 shrink-0 place-items-center rounded-full text-white transition-colors duration-200 ${draft ? "bg-[#5035e3]" : "bg-[#d9d2fb]"}`}>
            <RiArrowUpLine size={18} />
          </span>
        </div>
      </div>
    </section>
  );
}

/* a DM the business writes: grows with its text, counts down near the limit, and can go back to ours */
function Message({ label, hint, value, fallback, onChange }: { label: string; hint: string; value: string; fallback: string; onChange: (v: string) => void }) {
  const id = useId();
  const left = MESSAGE_MAX - value.length;
  return (
    <>
      <textarea
        id={id}
        aria-label={label}
        value={value}
        maxLength={MESSAGE_MAX}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder={fallback}
        aria-describedby={`${id}-hint`}
        className={`${FIELD} block min-h-[96px] resize-none py-3 leading-[22px] [field-sizing:content]`}
      />
      <div className="mt-2.5 flex items-start justify-between gap-3">
        <p id={`${id}-hint`} className={HINT}>
          {value.trim() ? hint : "Left empty, creators go straight to the button."}
        </p>
        <span className="flex shrink-0 items-center gap-2">
          <span className={`text-[13px] tabular-nums transition-opacity duration-200 ${left <= 40 ? "opacity-100" : "opacity-0"} ${left <= 10 ? "text-[#c23a56]" : "text-muted"}`} aria-hidden={left > 40}>
            {left}
          </span>
          {value !== fallback && (
            <button type="button" onClick={() => onChange(fallback)} className="-my-1 rounded-full px-2 py-1 text-[13px] font-semibold text-muted transition-colors hover:bg-[#f4f4f6] hover:text-ink">
              Reset
            </button>
          )}
        </span>
      </div>
    </>
  );
}

/* ---------- one question: what it asks, and how creators answer ---------- */

function QuestionEditor({
  intro,
  q,
  isNew,
  onChange,
  onCancel,
  onSave,
  onDelete,
}: {
  intro: boolean;
  q: Question;
  isNew: boolean;
  onChange: (q: Question) => void;
  onCancel: () => void;
  onSave: () => void;
  onDelete: () => void;
}) {
  const answers = useRef<(HTMLInputElement | null)[]>([]);
  /* a row to focus once it has rendered (Enter, or Add answer) */
  const focusAt = useRef<number | null>(null);
  const setFocusAt = (i: number) => {
    focusAt.current = i;
    answers.current[i]?.focus();
  };
  const filled = q.answers.filter((a) => a.trim()).length;
  const ready = !!q.title.trim() && (q.kind === "text" || filled >= 2);

  useEffect(() => {
    if (focusAt.current === null) return;
    answers.current[focusAt.current]?.focus();
    focusAt.current = null;
  });

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [onCancel]);

  const set = (patch: Partial<Question>) => onChange({ ...q, ...patch });
  const setAnswer = (i: number, v: string) => set({ answers: q.answers.map((a, j) => (j === i ? v : a)) });
  const addAnswer = () => {
    if (q.answers.length >= MAX_ANSWERS) return;
    set({ answers: [...q.answers, ""] });
    setFocusAt(q.answers.length);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (ready) onSave();
      }}
    >
      <In intro={intro} i={0}>
        {/* the same three-part bar as an iOS sheet: leave, where you are, finish */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <button type="button" onClick={onCancel} className="-ml-3 h-10 justify-self-start rounded-full px-3 text-[15px] font-semibold text-ink-2 transition-colors hover:bg-white hover:text-ink">
            Cancel
          </button>
          <h1 className="text-[18px] font-semibold tracking-[-0.01em] text-ink">{isNew ? "New question" : "Edit question"}</h1>
          <button
            type="submit"
            disabled={!ready}
            className="h-10 justify-self-end rounded-full bg-[#111] px-5 text-[14.5px] font-semibold text-white transition-[background-color,opacity] duration-200 hover:bg-black disabled:cursor-not-allowed disabled:opacity-20"
          >
            {isNew ? "Add" : "Save"}
          </button>
        </div>
      </In>

      <In intro={intro} i={1} className="mt-6">
        <div className={CARD}>
          <section className={PANEL}>
            <h2 className={HEADING}>Question</h2>
            <div className={`mt-3 ${BOX} focus-within:border-transparent focus-within:bg-white focus-within:shadow-[inset_0_0_0_2px_#8f7cf7,0_0_0_4px_rgba(143,124,247,0.14)] transition-[background-color,box-shadow] duration-200`}>
              <input
                aria-label="Question"
                autoFocus={isNew}
                value={q.title}
                maxLength={120}
                onChange={(e) => set({ title: e.target.value })}
                placeholder="e.g. When could you post?"
                className="block h-[50px] w-full bg-transparent px-4 text-[16px] font-semibold text-ink outline-none placeholder:font-normal placeholder:text-muted"
              />
              <div className="mx-4 h-px bg-[#ececf1]" />
              <input
                aria-label="Note under the question (optional)"
                value={q.sub}
                maxLength={160}
                onChange={(e) => set({ sub: e.target.value })}
                placeholder="Add a note (optional)"
                className="block h-[48px] w-full bg-transparent px-4 text-[15px] text-ink outline-none placeholder:text-muted"
              />
            </div>
          </section>

          <section className={PANEL}>
            <h2 className={HEADING}>How creators answer</h2>
            <div className="mt-3">
              <Segmented<Question["kind"]>
                id="question-kind"
                label="How creators answer"
                full
                value={q.kind}
                onChange={(kind) => set({ kind })}
                options={[
                  { value: "text", label: "Text box" },
                  { value: "pick", label: "Pick from a list" },
                ]}
              />
            </div>

            <AnimatePresence initial={false}>
              {q.kind === "pick" && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: EASE }} className="overflow-hidden">
                  <ul className={`mt-4 ${BOX}`} aria-label="Answers">
                    {q.answers.map((a, i) => (
                      <li key={i} className="flex items-center gap-3 border-b border-[#ececf1] pl-4 pr-2">
                        <Mark multi={q.multi} />
                        <input
                          ref={(el) => {
                            answers.current[i] = el;
                          }}
                          aria-label={`Answer ${i + 1}`}
                          value={a}
                          maxLength={60}
                          onChange={(e) => setAnswer(i, e.target.value)}
                          onKeyDown={(e) => {
                            // Enter moves down the list, adding a row at the end, instead of submitting
                            if (e.key !== "Enter") return;
                            e.preventDefault();
                            if (i < q.answers.length - 1) setFocusAt(i + 1);
                            else if (a.trim()) addAnswer();
                          }}
                          placeholder={`Answer ${i + 1}`}
                          className="h-12 min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-muted"
                        />
                        <button
                          type="button"
                          aria-label={`Remove answer ${i + 1}`}
                          disabled={q.answers.length <= 2}
                          onClick={() => set({ answers: q.answers.filter((_, j) => j !== i) })}
                          className="grid size-8 shrink-0 place-items-center rounded-full text-muted transition-[background-color,color,opacity] hover:bg-[#ececf1] hover:text-ink disabled:pointer-events-none disabled:opacity-0"
                        >
                          <RiCloseLine size={16} aria-hidden="true" />
                        </button>
                      </li>
                    ))}
                    {q.other && (
                      <li className="flex h-12 items-center gap-3 border-b border-[#ececf1] px-4">
                        <Mark multi={q.multi} />
                        <span className="text-[15px] text-ink">Other</span>
                        <span className="text-[13px] text-muted">creators write it in</span>
                      </li>
                    )}
                    <li>
                      <button
                        type="button"
                        onClick={addAnswer}
                        disabled={q.answers.length >= MAX_ANSWERS}
                        className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors hover:bg-[#f4f4f6] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                      >
                        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#5035e3] text-white">
                          <RiAddLine size={16} aria-hidden="true" />
                        </span>
                        <span className="text-[15px] font-semibold text-[#3b25c4]">Add answer</span>
                      </button>
                    </li>
                  </ul>
                  <p className={`mt-2.5 ${HINT}`}>{filled < 2 ? "Add at least two answers." : q.answers.length >= MAX_ANSWERS ? `Up to ${MAX_ANSWERS} answers.` : "Press Enter to add the next one."}</p>

                  <div className={`mt-4 ${BOX} divide-y divide-[#ececf1]`}>
                    <Toggle label="Add an “Other” option" hint="Creators can write in their own answer." on={q.other} onChange={(other) => set({ other })} />
                    <Toggle label="Allow more than one answer" hint="Creators can pick several." on={q.multi} onChange={(multi) => set({ multi })} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>
      </In>

      {!isNew && (
        <In intro={intro} i={2} className="mt-4">
          <button type="button" onClick={onDelete} className="h-10 rounded-full px-4 text-[14.5px] font-semibold text-[#c23a56] transition-colors hover:bg-rose/10">
            Remove question
          </button>
        </In>
      )}
    </form>
  );
}

/* ---------- pieces ---------- */

function In({ intro, i, className, children }: { intro: boolean; i: number; className?: string; children: ReactNode }) {
  return intro ? (
    <Rise i={i} className={className}>
      {children}
    </Rise>
  ) : (
    <div className={className}>{children}</div>
  );
}

/* the empty radio or checkbox in front of each answer, matching what creators will tap */
function Mark({ multi }: { multi: boolean }) {
  return <span aria-hidden="true" className={`size-[18px] shrink-0 bg-white shadow-[inset_0_0_0_1.5px_#d4d4de] transition-[border-radius] duration-200 ${multi ? "rounded-[6px]" : "rounded-full"}`} />;
}

function Toggle({ label, hint, on, onChange }: { label: string; hint: string; on: boolean; onChange: (v: boolean) => void }) {
  const id = useId();
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center justify-between gap-4 px-4 py-3">
      <span className="min-w-0 leading-snug">
        <span className="block text-[15px] font-medium text-ink">{label}</span>
        <span className="block text-[13px] text-muted">{hint}</span>
      </span>
      <span className="relative shrink-0">
        <input id={id} type="checkbox" role="switch" checked={on} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
        <span className={`block h-[26px] w-[44px] rounded-full transition-colors duration-200 peer-focus-visible:ring-[3px] peer-focus-visible:ring-[#b9a8ff] ${on ? "bg-[#5035e3]" : "bg-[#dcdde3]"}`} />
        <span className={`absolute left-[3px] top-[3px] size-5 rounded-full bg-white shadow-[0_1px_3px_rgba(15,20,40,0.2)] transition-transform duration-200 ${on ? "translate-x-[18px]" : ""}`} />
      </span>
    </label>
  );
}
