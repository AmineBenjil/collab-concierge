"use client";

import {
  RiAddLine,
  RiArrowDownSLine,
  RiArrowRightSLine,
  RiArrowRightUpLine,
  RiCheckboxMultipleLine,
  RiCheckLine,
  RiCloseLine,
  RiListCheck2,
  RiLock2Line,
  RiText,
} from "@remixicon/react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import {
  ALWAYS_ASKED,
  DEFAULT_CUSTOM,
  READY,
  describe,
  newQuestion,
  saveCustom,
  useCustom,
  type AskedStep,
  type Custom,
  type PreviewMessage,
  type Question,
  type Screen,
} from "../creator/custom";
import { CreatorPhone } from "../creator/PreviewDevice";
import { useToast } from "./Shell";
import { useHandle } from "./store";
import { EASE, Rise, Segmented } from "./ui";

/*
  Make it yours: the welcome DM, the business's own questions and the thank-you DM, edited on the
  left while the real creator flow runs in the phone on the right. Focusing a field brings its
  screen up in the phone; everything saves as you type.
*/

type Tab = "welcome" | "questions" | "thanks";
type Peek = { kind: "step"; step: AskedStep } | { kind: "custom"; id: string } | null;
type Editing = { q: Question; isNew: boolean } | null;

const MAX_QUESTIONS = 5;
const MAX_ANSWERS = 8;
const MESSAGE_MAX = 300;

/* the Share page's request card: hairline border, white panels on a grey card, 4px gaps between them */
const CARD = "flex flex-col gap-1 overflow-hidden rounded-[24px] border border-[#ececf1] bg-[#f2f2f2]";
const PANEL = "bg-white px-5 py-5 sm:px-6";
const BOX = "overflow-hidden rounded-[16px] border-[0.5px] border-[#e3e3e3] bg-[#fafafa]";
const HEADING = "text-[14px] font-semibold leading-4 text-[#1c1c1c]";
const HINT = "text-[13px] leading-snug text-muted";
/* text fields: light grey at rest; white with the purple stroke and a soft glow while typing */
const FIELD =
  "w-full rounded-[16px] border-[0.5px] border-[#e3e3e3] bg-[#fafafa] px-4 text-[15px] text-ink outline-none transition-[background-color,box-shadow,border-color] duration-200 placeholder:text-muted focus:border-transparent focus:bg-white focus:shadow-[inset_0_0_0_2px_#8f7cf7,0_0_0_4px_rgba(143,124,247,0.14)]";

export default function Customize() {
  const handle = useHandle();
  const custom = useCustom(handle);
  const say = useToast();
  const frame = useRef<HTMLIFrameElement>(null);

  const [tab, setTab] = useState<Tab>("welcome");
  const [peek, setPeek] = useState<Peek>(null);
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

  /* opening or closing a question swaps the whole column, so it starts from the top */
  const open = !!editing;
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [open]);

  /* what the phone shows: the question being edited, else the tab, else what was last picked */
  const screen: Screen = (() => {
    if (editing) {
      const at = qs.findIndex((q) => q.id === editing.q.id);
      return { kind: "custom", question: editing.q, index: at < 0 ? qs.length : at, total: at < 0 ? qs.length + 1 : qs.length };
    }
    if (tab === "welcome") return { kind: "opener" };
    if (tab === "thanks") return { kind: "done" };
    if (peek?.kind === "step") return { kind: "step", step: peek.step };
    const at = Math.max(0, peek?.kind === "custom" ? qs.findIndex((q) => q.id === peek.id) : 0);
    return qs[at] ? { kind: "custom", question: qs[at], index: at, total: qs.length } : { kind: "empty", total: 0 };
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

  const show = (t: Tab, p: Peek = peek) => {
    setTab(t);
    setPeek(p);
  };

  const saveQuestion = () => {
    if (!editing) return;
    const q = { ...editing.q, title: editing.q.title.trim(), sub: editing.q.sub.trim(), answers: editing.q.answers.map((a) => a.trim()).filter(Boolean) };
    update({ questions: editing.isNew ? [...qs, q] : qs.map((x) => (x.id === q.id ? q : x)) });
    show("questions", { kind: "custom", id: q.id });
    setEditing(null);
    say(editing.isNew ? "Question added." : "Question updated.");
  };
  const removeQuestion = () => {
    if (!editing) return;
    const before = qs;
    update({ questions: qs.filter((x) => x.id !== editing.q.id) });
    setEditing(null);
    show("questions", null);
    // undo puts the list back onto whatever was edited since, not onto this moment's copy
    say("Question removed.", { label: "Undo", run: () => saveCustom(handle, { ...latest.current.custom, questions: before }) });
  };

  return (
    <main className="relative mx-auto w-full max-w-[600px] px-5 pb-24 pt-[112px] sm:pt-[140px] lg:max-w-[1040px] lg:pb-0">
      <div className="lg:grid lg:grid-cols-[minmax(0,560px)_auto] lg:items-start lg:justify-between lg:gap-12">
        {/* on laptops the bottom padding lives in this column, so the grid row runs to the page's end and the phone stays pinned */}
        <div className="min-w-0 lg:pb-24">
          <AnimatePresence mode="wait" initial={false}>
            {editing ? (
              <Swap key="edit">
                <QuestionEditor
                  intro={!swapped}
                  q={editing.q}
                  isNew={editing.isNew}
                  onChange={(q) => setEditingState({ ...editing, q })}
                  onCancel={() => setEditing(null)}
                  onSave={saveQuestion}
                  onDelete={removeQuestion}
                />
              </Swap>
            ) : (
              <Swap key="overview">
                <Overview
                  intro={!swapped}
                  handle={handle}
                  custom={custom}
                  saved={!!saved}
                  peek={tab === "questions" ? peek : null}
                  onFocusTab={(t) => show(t)}
                  onWelcome={(welcome) => update({ welcome })}
                  onThanks={(thanks) => update({ thanks })}
                  onPeek={(step) => show("questions", { kind: "step", step })}
                  onEdit={(q) => setEditing({ q, isNew: false })}
                  onAdd={() => setEditing({ q: newQuestion(), isNew: true })}
                />
              </Swap>
            )}
          </AnimatePresence>
        </div>

        {/* laptops: the live phone, pinned under the header while the editor scrolls */}
        <Rise i={1} className="sticky top-[100px] hidden lg:block">
          <aside aria-label="Live preview" className="flex flex-col items-center">
            <div className="w-[288px]">
              <Segmented<Tab>
                id="customize-preview"
                label="Preview screen"
                full
                size="sm"
                value={editing ? "questions" : tab}
                onChange={(t) => {
                  setEditing(null);
                  show(t);
                }}
                options={[
                  { value: "welcome", label: "Welcome" },
                  { value: "questions", label: "Questions" },
                  { value: "thanks", label: "Thank you" },
                ]}
              />
            </div>
            <CreatorPhone frameRef={frame} src={`/c/${encodeURIComponent(handle)}?embed=1&customize=1`} className="mt-5 h-[min(640px,calc(100svh-210px))] min-h-[480px]" />
            <p className="mt-3 text-[13px] text-muted">Live preview of what creators see</p>
          </aside>
        </Rise>
      </div>
    </main>
  );
}

/* the editor column swaps between the overview and a question, sliding a little sideways */
function Swap({ children }: { children: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.3, ease: EASE }}>
      {children}
    </motion.div>
  );
}

/* ---------- the overview: welcome, questions, thank-you ---------- */

function Overview({
  intro,
  handle,
  custom,
  saved,
  peek,
  onFocusTab,
  onWelcome,
  onThanks,
  onPeek,
  onEdit,
  onAdd,
}: {
  intro: boolean;
  handle: string;
  custom: Custom;
  saved: boolean;
  peek: Peek;
  onFocusTab: (t: Tab) => void;
  onWelcome: (v: string) => void;
  onThanks: (v: string) => void;
  onPeek: (step: AskedStep) => void;
  onEdit: (q: Question) => void;
  onAdd: () => void;
}) {
  const [asked, setAsked] = useState(false);
  const qs = custom.questions;
  const full = qs.length >= MAX_QUESTIONS;

  return (
    <>
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
        <p className="mt-3 text-[15.5px] leading-relaxed text-ink-2">This is what creators see when they open your link. Changes save as you go.</p>
        {/* under laptop width there's no room for the phone, so the full preview opens instead */}
        <a
          href={`/c/${encodeURIComponent(handle)}?preview=1`}
          target="_blank"
          rel="noopener"
          className="group mt-3 inline-flex items-center gap-2 text-[15px] font-semibold text-[#3b25c4] transition-colors hover:text-[#2c1aa3] lg:hidden"
        >
          See what creators see
          <RiArrowRightUpLine size={16} aria-hidden="true" className="text-[#8b7aec] transition-transform duration-200 group-hover:-translate-y-px group-hover:translate-x-px" />
        </a>
      </In>

      <In intro={intro} i={1} className="mt-6">
        <div className={CARD}>
          <section className={PANEL}>
            <Message
              label="Welcome message"
              hint="The first thing creators read when they open your link."
              value={custom.welcome}
              fallback={DEFAULT_CUSTOM.welcome}
              onChange={onWelcome}
              onFocus={() => onFocusTab("welcome")}
            />
          </section>

          <section className={PANEL} aria-labelledby="questions-heading">
            <h2 id="questions-heading" className={HEADING}>
              Questions
            </h2>

            {/* ours: locked, listed on demand; each one brings its screen up in the phone */}
            <div className={`mt-3 ${BOX}`}>
              <button
                type="button"
                aria-expanded={asked}
                onClick={() => setAsked((o) => !o)}
                className="flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-[#f4f4f6]"
              >
                <Tile tone="grey">
                  <RiLock2Line size={16} aria-hidden="true" />
                </Tile>
                <span className="min-w-0 flex-1 text-[15px] font-semibold text-ink">Always asked</span>
                <span className="shrink-0 text-[13px] text-muted">{ALWAYS_ASKED.length} questions</span>
                <RiArrowDownSLine size={18} aria-hidden="true" className={`shrink-0 text-muted transition-transform duration-300 ${asked ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence initial={false}>
                {asked && (
                  <motion.ul initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} transition={{ duration: 0.35, ease: EASE }} className="overflow-hidden">
                    {ALWAYS_ASKED.map((a) => {
                      const on = peek?.kind === "step" && peek.step === a.step;
                      return (
                        <li key={a.step} className="border-t border-[#ececf1]">
                          <button
                            type="button"
                            onClick={() => onPeek(a.step)}
                            aria-current={on || undefined}
                            className={`flex w-full items-center py-3 pl-[58px] pr-4 text-left text-[14.5px] transition-colors ${on ? "bg-lilac font-medium text-ink" : "text-ink-2 hover:bg-[#f4f4f6] hover:text-ink"}`}
                          >
                            {a.label}
                          </button>
                        </li>
                      );
                    })}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>

            {/* theirs: each opens in the editor; the last row adds one */}
            <ul className={`mt-2 ${BOX}`}>
              {qs.map((q) => {
                const on = peek?.kind === "custom" && peek.id === q.id;
                return (
                  <li key={q.id} className="border-b border-[#ececf1]">
                    <button type="button" onClick={() => onEdit(q)} className={`flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors ${on ? "bg-lilac" : "hover:bg-[#f4f4f6]"}`}>
                      <Tile tone="violet">
                        <KindIcon q={q} />
                      </Tile>
                      <span className="min-w-0 flex-1 leading-tight">
                        <span className="block truncate text-[15px] font-semibold text-ink">{q.title}</span>
                        <span className="mt-0.5 block truncate text-[13px] text-muted">{describe(q)}</span>
                      </span>
                      <RiArrowRightSLine size={18} aria-hidden="true" className="shrink-0 text-muted" />
                    </button>
                  </li>
                );
              })}
              <li>
                <button type="button" onClick={onAdd} disabled={full} className="flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-[#f4f4f6] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#5035e3] text-white">
                    <RiAddLine size={18} aria-hidden="true" />
                  </span>
                  <span className="text-[15px] font-semibold text-[#3b25c4]">Add a question</span>
                </button>
              </li>
            </ul>
            <p className={`mt-2.5 ${HINT}`}>{full ? `You can add up to ${MAX_QUESTIONS} of your own.` : "Creators answer yours right after the ones we always ask."}</p>
          </section>

          <section className={PANEL}>
            <Message
              label="Thank-you message"
              hint="Shown after a creator sends their request."
              value={custom.thanks}
              fallback={DEFAULT_CUSTOM.thanks}
              onChange={onThanks}
              onFocus={() => onFocusTab("thanks")}
            />
          </section>
        </div>
      </In>
    </>
  );
}

/* a DM the business writes: grows with its text, counts down near the limit, and can go back to ours */
function Message({ label, hint, value, fallback, onChange, onFocus }: { label: string; hint: string; value: string; fallback: string; onChange: (v: string) => void; onFocus: () => void }) {
  const id = useId();
  const left = MESSAGE_MAX - value.length;
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className={HEADING}>
          {label}
        </label>
        {value !== fallback && (
          <button type="button" onClick={() => onChange(fallback)} className="-my-1 rounded-full px-2 py-1 text-[13px] font-semibold text-muted transition-colors hover:bg-[#f4f4f6] hover:text-ink">
            Reset
          </button>
        )}
      </div>
      <textarea
        id={id}
        value={value}
        maxLength={MESSAGE_MAX}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        rows={3}
        placeholder={fallback}
        aria-describedby={`${id}-hint`}
        className={`${FIELD} mt-3 block min-h-[96px] resize-none py-3 leading-[22px] [field-sizing:content]`}
      />
      <div className="mt-2.5 flex items-start justify-between gap-3">
        <p id={`${id}-hint`} className={HINT}>
          {value.trim() ? hint : "Left empty, creators go straight to the button."}
        </p>
        <span className={`shrink-0 text-[13px] tabular-nums transition-opacity duration-200 ${left <= 40 ? "opacity-100" : "opacity-0"} ${left <= 10 ? "text-[#c23a56]" : "text-muted"}`} aria-hidden={left > 40}>
          {left}
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

function Tile({ tone, children }: { tone: "grey" | "violet"; children: ReactNode }) {
  return <span className={`grid size-8 shrink-0 place-items-center rounded-[10px] ${tone === "violet" ? "bg-lilac text-violet" : "bg-white text-muted shadow-[inset_0_0_0_0.5px_#e3e3e3]"}`}>{children}</span>;
}

function KindIcon({ q }: { q: Question }) {
  if (q.kind === "text") return <RiText size={16} aria-hidden="true" />;
  return q.multi ? <RiCheckboxMultipleLine size={16} aria-hidden="true" /> : <RiListCheck2 size={16} aria-hidden="true" />;
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
