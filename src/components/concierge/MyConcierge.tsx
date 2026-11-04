"use client";

import { RiAddLine, RiArrowUpLine, RiCheckLine, RiCloseLine, RiCornerDownRightLine, RiEyeLine, RiQuillPenAiLine, RiSparkling2Fill } from "@remixicon/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { newSection, type BriefSection, type Custom } from "../creator/custom";
import { BrandIcon } from "../Logo";
import { useToast } from "./Shell";
import { EASE, Rise } from "./ui";

/*
  The My Concierge side of Customize: the brief in the middle of the page, scrolling like any page, and the
  Concierge a button away in the corner. The button unfolds into the chat, over the page, and what you say
  there is filed into the brief behind it, so the two are plainly one thing.
*/

/* ---------- what the Concierge knows: the brief, edited in place ---------- */

/*
  One long field, like a note: a heading with a sparkle, free text under it, and as many of those as the
  business wants. Enter on a heading drops to its text; Backspace on an empty heading with nothing under
  it removes it. Removing one that has writing in it offers an undo.
*/
function Brief({
  labelledBy,
  brief,
  onChange,
  startWriting = false,
  onStarted,
  flash,
}: {
  labelledBy: string;
  brief: Custom["brief"];
  onChange: (b: Custom["brief"]) => void;
  /* open with the caret at the end of the first section, as if about to type */
  startWriting?: boolean;
  onStarted?: () => void;
  /* a section the Concierge just wrote into, lit up for a moment; a new stamp lights it again */
  flash?: { id: string; at: number } | null;
}) {
  const id = useId();
  const say = useToast();
  const box = useRef<HTMLDivElement>(null);
  const focusNext = useRef<string | null>(null);

  useEffect(() => {
    if (!startWriting) return;
    onStarted?.();
    /* only where there's a mouse: on a phone, focusing would throw the keyboard up unasked */
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const first = brief[0];
    const last = first && [...(document.getElementById(`${id}-${first.id}`)?.querySelectorAll("textarea") ?? [])].pop();
    if (!last) return;
    last.focus({ preventScroll: true });
    last.setSelectionRange(last.value.length, last.value.length);
  }, [startWriting, onStarted, brief, id]);

  useEffect(() => {
    if (!focusNext.current) return;
    box.current?.querySelector<HTMLElement>(`[data-heading="${focusNext.current}"]`)?.focus();
    focusNext.current = null;
  }, [brief]);

  const set = (i: number, patch: Partial<BriefSection>) => onChange(brief.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const add = () => {
    const s = newSection();
    focusNext.current = s.id;
    onChange([...brief, s]);
  };
  const remove = (i: number) => {
    const s = brief[i];
    onChange(brief.filter((_, j) => j !== i));
    if (s.heading.trim() || s.text.trim()) say(`Removed ${s.heading.trim() ? `“${s.heading.trim()}”` : "a heading"}`, { label: "Undo", run: () => onChange(brief) });
  };

  return (
    /* a near-white page of notes on the white side; it turns white with the purple ring while you write */
    <div
      ref={box}
      role="group"
      aria-labelledby={labelledBy}
      className="rounded-[20px] border border-[#ececf1] bg-[#fcfcfc] px-5 pb-5 pt-6 shadow-[0_1px_2px_rgba(15,20,40,0.04)] transition-[background-color,box-shadow,border-color] duration-200 focus-within:border-transparent focus-within:bg-white focus-within:shadow-[inset_0_0_0_2px_#8f7cf7] sm:px-7 sm:pt-7"
    >
      {brief.map((s, i) => (
        <motion.div
          key={s.id}
          data-section={s.id}
          initial={false}
          animate={{ backgroundColor: flash?.id === s.id ? ["#ece7fd", "rgba(236,231,253,0)"] : "rgba(236,231,253,0)" }}
          transition={{ duration: 2, ease: "easeOut", times: [0.2, 1] }}
          className="group/section -mx-3 mb-3 rounded-[14px] px-3 pb-3 pt-1"
        >
          <div className="flex items-center gap-2">
            <RiSparkling2Fill size={15} aria-hidden="true" className="shrink-0 text-[#8f7cf7]" />
            <input
              data-heading={s.id}
              aria-label="Heading"
              value={s.heading}
              placeholder="New heading"
              onChange={(e) => set(i, { heading: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  document.getElementById(`${id}-${s.id}`)?.querySelector("textarea")?.focus();
                } else if (e.key === "Backspace" && !s.heading && !s.text) {
                  e.preventDefault();
                  const prev = brief[i - 1];
                  remove(i);
                  if (prev) {
                    const last = [...(document.getElementById(`${id}-${prev.id}`)?.querySelectorAll("textarea") ?? [])].pop();
                    last?.focus();
                    last?.setSelectionRange(last.value.length, last.value.length);
                  }
                }
              }}
              className="min-w-0 flex-1 bg-transparent text-[16px] font-semibold text-ink outline-none placeholder:font-medium placeholder:text-muted"
            />
            <button
              type="button"
              aria-label={`Remove ${s.heading.trim() || "this heading"}`}
              onClick={() => remove(i)}
              className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted opacity-0 transition-[opacity,background-color,color] duration-200 hover:bg-[#ececf1] hover:text-ink focus-visible:opacity-100 group-focus-within/section:opacity-100 group-hover/section:opacity-100"
            >
              <RiCloseLine size={16} aria-hidden="true" />
            </button>
          </div>
          <Notes id={`${id}-${s.id}`} label={s.heading.trim() || "Notes"} value={s.text} onChange={(text) => set(i, { text })} />
        </motion.div>
      ))}
      <button
        type="button"
        onClick={add}
        className="-ml-1.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[14px] font-semibold text-[#3b25c4] transition-colors duration-200 hover:bg-lilac hover:text-[#2c1aa3]"
      >
        <RiAddLine size={17} aria-hidden="true" />
        Add a heading
      </button>
    </div>
  );
}

/*
  The writing under a heading, one line per row so bullets can hang: a line saved with "• " in front is a
  bullet, and typing "- " at the start of a line turns it into one. Enter starts a new line (a bullet if
  you were in one; on an empty bullet it goes back to plain text), Backspace at the start drops the bullet,
  then joins the line onto the one above.
*/
type NoteLine = { bullet: boolean; text: string };
const BULLET = "• ";
const toLines = (v: string): NoteLine[] => v.split("\n").map((l) => (l.startsWith(BULLET) || l.startsWith("- ") ? { bullet: true, text: l.slice(2) } : { bullet: false, text: l }));
const fromLines = (ls: NoteLine[]) => ls.map((l) => (l.bullet ? BULLET : "") + l.text).join("\n");

function Notes({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (v: string) => void }) {
  const lines = toLines(value);
  const rows = useRef<(HTMLTextAreaElement | null)[]>([]);
  /* where the caret goes once the next render lands */
  const caret = useRef<{ i: number; at: number } | null>(null);

  useEffect(() => {
    if (!caret.current) return;
    const el = rows.current[caret.current.i];
    el?.focus();
    el?.setSelectionRange(caret.current.at, caret.current.at);
    caret.current = null;
  });

  const commit = (next: NoteLine[], focus?: { i: number; at: number }) => {
    if (focus) caret.current = focus;
    onChange(fromLines(next));
  };
  const empty = lines.length === 1 && !lines[0].bullet && !lines[0].text;

  return (
    <div id={id} role="group" aria-label={label} className="mt-1.5 flex flex-col gap-1.5">
      {lines.map((l, i) => (
        <div key={i} className="relative pl-[23px]">
          {l.bullet && <span aria-hidden="true" className="absolute left-[6px] top-[11px] size-[5px] rounded-full bg-[#c4c4cd]" />}
          <textarea
            ref={(el) => {
              rows.current[i] = el;
            }}
            aria-label={l.bullet ? `${label}, bullet` : label}
            value={l.text}
            rows={1}
            placeholder={empty ? "Write anything here" : undefined}
            onChange={(e) => {
              const v = e.target.value;
              const next = [...lines];
              // pasted lines become lines of their own
              if (v.includes("\n")) {
                const [first, ...rest] = toLines(v);
                next.splice(i, 1, { bullet: l.bullet || first.bullet, text: first.text }, ...rest);
                commit(next, { i: i + rest.length, at: next[i + rest.length].text.length });
                return;
              }
              if (!l.bullet && v.startsWith("- ")) {
                next[i] = { bullet: true, text: v.slice(2) };
                commit(next, { i, at: e.target.selectionStart - 2 });
                return;
              }
              next[i] = { ...l, text: v };
              onChange(fromLines(next));
            }}
            onKeyDown={(e) => {
              const el = e.currentTarget;
              const start = el.selectionStart;
              const flat = start === el.selectionEnd;
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                const next = [...lines];
                if (l.bullet && !l.text) {
                  next[i] = { bullet: false, text: "" };
                  commit(next, { i, at: 0 });
                  return;
                }
                next.splice(i, 1, { ...l, text: l.text.slice(0, start) }, { bullet: l.bullet, text: l.text.slice(el.selectionEnd) });
                commit(next, { i: i + 1, at: 0 });
              } else if (e.key === "Backspace" && flat && start === 0) {
                if (l.bullet) {
                  e.preventDefault();
                  commit(lines.map((x, j) => (j === i ? { ...x, bullet: false } : x)), { i, at: 0 });
                } else if (i > 0) {
                  e.preventDefault();
                  const prev = lines[i - 1];
                  const next = [...lines];
                  next.splice(i - 1, 2, { ...prev, text: prev.text + l.text });
                  commit(next, { i: i - 1, at: prev.text.length });
                }
              } else if (e.key === "ArrowUp" && flat && start === 0 && i > 0) {
                e.preventDefault();
                rows.current[i - 1]?.focus();
              } else if (e.key === "ArrowDown" && flat && start === l.text.length && i < lines.length - 1) {
                e.preventDefault();
                const below = rows.current[i + 1];
                below?.focus();
                below?.setSelectionRange(0, 0);
              }
            }}
            className="block w-full resize-none bg-transparent text-[15.5px] leading-[26px] text-ink outline-none [field-sizing:content] placeholder:text-muted"
          />
        </div>
      ))}
    </div>
  );
}


/* ---------- the chat: telling the Concierge things, and watching them land in the brief ---------- */

/*
  Live, in the sense that matters for the demo: you type, the Concierge works out which heading of the
  brief what you said belongs under, writes it there and says what changes from now on. The filing is by
  keyword and the replies are written ahead, but the brief really does change, right behind the drawer.
*/
type Msg = { id: string; from: "concierge" | "you"; text: string } | { id: string; from: "note"; text: string; section: string };
/* the opener asks; the card above it explains. Neither repeats the other */
const GREETING = "Hi! Who’s a dream collab for you? Tell me about the creators who do best for you, and I’ll put people like them first.";
/* three things worth saying, for anyone unsure where to start */
const TRY = ["Only send me creators with an LA audience.", "We’d pay for the right creator.", "Nobody under 5,000 followers."];

type Rule = { test: RegExp; section: string; heading: string; reply: (text: string) => string };
const PLACES: [RegExp, string][] = [
  [/\blos angeles\b|\bla\b/i, "Los Angeles"],
  [/\bnew york\b|\bnyc\b/i, "New York"],
  [/\blondon\b/i, "London"],
  [/\b(miami|chicago|austin|dallas|seattle|toronto|sydney|paris|berlin)\b/i, ""],
];
const placeIn = (text: string) => {
  for (const [re, name] of PLACES) {
    const m = text.match(re);
    if (m) return name || m[0].charAt(0).toUpperCase() + m[0].slice(1).toLowerCase();
  }
  return null;
};
/* where a message is filed and what the Concierge says back; the first rule that matches wins, so the
   ones that rule creators out come before the ones that describe who's wanted */
const RULES: Rule[] = [
  {
    test: /\b(no one|nobody|never|don'?t|do not|avoid|skip|under \d|less than|fewer than|red flags?|rule out|dealbreakers?)\b/i,
    section: "dealbreakers",
    heading: "Dealbreakers",
    reply: () => "Understood. That rules a creator out from now on, so anyone like that won’t reach you.",
  },
  {
    test: /\b(pay|paid|paying|budget|fees?|rates?|gift|gifted|gifting|free product|barter|affiliate|commission)\b|\$\d/i,
    section: "collabs",
    heading: "The collabs we want",
    reply: () => "Noted. I’ll weigh every request against that, so the ones that reach you are collabs you’d actually do.",
  },
  {
    test: /\b(ugc|usage rights|raw footage|content only|whitelisting)\b/i,
    section: "ugc",
    heading: "UGC",
    reply: () => "Got it. I’ll keep that in mind whenever a UGC-only creator asks.",
  },
  {
    test: /\b(audience|based in|located|local|city|area|los angeles|\bla\b|new york|nyc|london|miami|chicago|austin|dallas|seattle|toronto|sydney|paris|berlin|in the us|us only|uk|canada|australia)\b/i,
    section: "who",
    heading: "Who to prioritize",
    reply: (t) => {
      const place = placeIn(t);
      return place ? `Got it. I’ll pass on anyone whose audience isn’t mostly in ${place}.` : "Got it. I’ll give creators whose audience matches a bump, and pass on the ones whose audience doesn’t.";
    },
  },
  {
    test: /\b(esthetician|dermatolog|nurse|professional|expert|prioriti[sz]e|prefer|bigger|smaller|micro|nano|followers|engagement|niche|vibe|aesthetic)\b/i,
    section: "who",
    heading: "Who to prioritize",
    reply: () => "Got it. Creators like that move up the list from now on.",
  },
  {
    test: /\b(we sell|we make|we'?re an?|we are an?|our (product|products|brand|flagship|store|shop)|launch(ed|ing)?|stockists?|retail|ingredients?|founded)\b/i,
    section: "about",
    heading: "About us",
    reply: () => "Thanks, that helps me explain you to creators. I’ll use it from the next request on.",
  },
];
const FALLBACK: Rule = { test: /./, section: "else", heading: "Anything else?", reply: () => "Got it. I’ll keep that in mind on every request from now on." };
/* what it asks, once, when one of the usual headings is still empty */
const MISSING: Record<string, string> = {
  about: "One thing I’m missing: what do you sell, in a line or two?",
  collabs: "One thing I’m missing: are your collabs mostly gifted, paid, or both?",
  who: "One thing I’m missing: who’s the ideal creator for you?",
  ugc: "One thing I’m missing: are you open to UGC-only creators?",
  dealbreakers: "One thing I’m missing: is there anything that would rule a creator out?",
};

const uid = () => Math.random().toString(36).slice(2, 10);
/* a message as a line of the brief: tidy spacing, a capital, a full stop */
const asLine = (m: string) => {
  const t = m.trim().replace(/\s+/g, " ");
  const c = t.charAt(0).toUpperCase() + t.slice(1);
  return /[.!?]$/.test(c) ? c : `${c}.`;
};

/*
  The conversation, kept by the page so closing the drawer doesn't lose it. Replies take about as long as
  they'd take to type; the note that says where a line went follows a beat later, with the brief itself.
*/
function useConcierge(brief: Custom["brief"], onChange: (b: Custom["brief"]) => void, onFiled: (section: string) => void) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [typing, setTyping] = useState(false);
  const latest = useRef(brief);
  useEffect(() => {
    latest.current = brief;
  }, [brief]);
  const timers = useRef<number[]>([]);
  const asked = useRef(false);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const later = useCallback((ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);
  const push = (m: Msg) => setMessages((ms) => [...ms, m]);
  const reply = useCallback(
    (text: string, after: number, then?: () => void) =>
      later(after, () => {
        setTyping(true);
        later(Math.min(2000, Math.max(900, text.length * 16)), () => {
          setTyping(false);
          setMessages((ms) => [...ms, { id: uid(), from: "concierge", text }]);
          then?.();
        });
      }),
    [later],
  );

  /* the first message: straight away when it was already showing as the teaser, typed out otherwise */
  const greet = useCallback(
    (instant: boolean) => {
      if (instant) setMessages([{ id: "greeting", from: "concierge", text: GREETING }]);
      else reply(GREETING, 500);
    },
    [reply],
  );

  /* add a line under the rule's heading: the usual one by id, else one the business renamed to match, else a new one */
  const file = (rule: Rule, line: string) => {
    const b = latest.current;
    let i = b.findIndex((s) => s.id === rule.section);
    if (i < 0) i = b.findIndex((s) => s.heading.trim().toLowerCase() === rule.heading.toLowerCase());
    if (i < 0) {
      const s = { ...newSection(), heading: rule.heading, text: `• ${line}` };
      const next = [...b, s];
      onChange(next);
      return { id: s.id, heading: rule.heading, next };
    }
    const s = b[i];
    const next = b.map((x, j) => (j === i ? { ...x, text: `${x.text.trimEnd()}${x.text.trim() ? "\n" : ""}• ${line}` } : x));
    onChange(next);
    return { id: s.id, heading: s.heading.trim() || rule.heading, next };
  };

  const send = (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    push({ id: uid(), from: "you", text });
    const rule = RULES.find((r) => r.test.test(text)) ?? FALLBACK;
    reply(rule.reply(text), 400, () =>
      later(500, () => {
        const { id, heading, next } = file(rule, asLine(text));
        push({ id: uid(), from: "note", text: `Added to ${heading}`, section: id });
        onFiled(id);
        if (asked.current) return;
        const empty = next.find((s) => MISSING[s.id] && !s.text.trim());
        if (!empty) return;
        asked.current = true;
        reply(MISSING[empty.id], 1200);
      }),
    );
  };

  return { messages, typing, send, greet };
}

const SPRING = { type: "spring", stiffness: 420, damping: 40, mass: 0.8 } as const;
/* the shell, the avatar and the first message each keep their identity from the closed state to the open one */
const IDS = { shell: "concierge-shell", avatar: "concierge-avatar", greeting: "concierge-greeting" };
const THEIRS = "max-w-[270px] rounded-[18px] rounded-bl-[6px] bg-[#f2f2f4] px-3.5 py-2 text-[14.5px] leading-snug text-ink";
const YOURS = "max-w-[270px] rounded-[18px] rounded-br-[6px] bg-[#5035e3] px-3.5 py-2 text-[14.5px] leading-snug text-white";

/* it's live, so it's online: a mint dot on the avatar */
function Presence() {
  return <span aria-hidden="true" className="absolute -bottom-px -right-px size-3 rounded-full bg-mint ring-2 ring-white" />;
}

/* a bubble from the Concierge; the greeting keeps its identity from the teaser, so it slides up into place */
function Bubble({ m, ids }: { m: Msg; ids: typeof IDS | null }) {
  if (m.from === "you") return <p className={YOURS}>{m.text}</p>;
  if (m.id === "greeting" && ids) {
    return (
      <motion.p layoutId={ids.greeting} transition={SPRING} className={THEIRS} style={{ borderRadius: 18 }}>
        {m.text}
      </motion.p>
    );
  }
  return <p className={THEIRS}>{m.text}</p>;
}

/* the messages in order, each sliding in from below; the note of where a line went is a button to it */
function Thread({ messages, typing, ids, onJump }: { messages: Msg[]; typing: boolean; ids: typeof IDS | null; onJump: (section: string) => void }) {
  return (
    /* popLayout: the typing dots leave the flow at once, so the reply takes their place without a gap */
    <AnimatePresence initial={false} mode="popLayout">
      {messages.map((m) => (
        <motion.div
          key={m.id}
          layout
          initial={{ opacity: 0, y: 10, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: EASE }}
          className={m.from === "you" ? "self-end" : "self-start"}
        >
          {m.from === "note" ? (
            <button
              type="button"
              onClick={() => onJump(m.section)}
              title="Show it in your brief"
              className="inline-flex items-center gap-1.5 rounded-full bg-lilac px-3 py-1.5 text-[13px] font-medium text-[#3b25c4] shadow-[inset_0_0_0_0.5px_#ddd5fb] transition-colors duration-200 hover:bg-[#e9e3fd]"
            >
              <RiSparkling2Fill size={13} aria-hidden="true" className="text-[#7a5cfa]" />
              {m.text}
            </button>
          ) : (
            <Bubble m={m} ids={ids} />
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
  );
}

/* the box: grows with what's typed up to a few lines; Enter sends, Shift+Enter breaks the line */
function Composer({ value, onChange, onSend, inputRef }: { value: string; onChange: (v: string) => void; onSend: () => void; inputRef: React.RefObject<HTMLTextAreaElement | null> }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSend();
      }}
      className="px-4"
    >
      <div className="flex items-end gap-2 rounded-[24px] border-[0.5px] border-[#e3e3e3] bg-white py-1.5 pl-4 pr-1.5 shadow-[0_1px_2px_rgba(15,20,40,0.04)] transition-[background-color,box-shadow,border-color] duration-200 focus-within:border-transparent focus-within:bg-white focus-within:shadow-[inset_0_0_0_2px_#8f7cf7]">
        <textarea
          ref={inputRef}
          rows={1}
          value={value}
          aria-label="Message your Concierge"
          placeholder="Tell your Concierge anything…"
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          className="block max-h-[112px] min-h-[36px] w-full resize-none bg-transparent [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-[7px] text-[14.5px] leading-[22px] text-ink outline-none [field-sizing:content] placeholder:text-muted"
        />
        <button
          type="submit"
          aria-label="Send"
          disabled={!value.trim()}
          className="grid size-9 shrink-0 place-items-center rounded-full bg-[#5035e3] text-white transition-[background-color,transform] duration-200 enabled:hover:bg-[#4329cf] enabled:active:scale-95 disabled:bg-[#d9d2fb]"
        >
          <RiArrowUpLine size={18} aria-hidden="true" />
        </button>
      </div>
    </form>
  );
}

/* what fades in once the shell has unfolded, and out before it folds */
const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { delay: 0.18, duration: 0.25, ease: EASE } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
} as const;

function Saved({ on }: { on: boolean }) {
  /* a quiet tick each time a change lands; the slot is always there so nothing shifts */
  return (
    <span aria-live="polite" className={`inline-flex shrink-0 items-center gap-1 text-[13px] font-semibold text-[#178a60] transition-opacity duration-300 ${on ? "opacity-100" : "opacity-0"}`}>
      <RiCheckLine size={15} aria-hidden="true" />
      {on ? "Saved" : ""}
    </span>
  );
}

/* ---------- the page: the brief in the middle, the Concierge in the corner ---------- */

export function MyConcierge({
  brief,
  onChange,
  saved,
  head,
  startWriting,
  onStarted,
}: {
  brief: Custom["brief"];
  onChange: (b: Custom["brief"]) => void;
  saved: boolean;
  head: ReactNode;
  startWriting: boolean;
  onStarted: () => void;
}) {
  const reduce = useReducedMotion();
  /* with motion turned down, the drawer fades instead of unfolding */
  const ids = reduce ? null : IDS;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [flash, setFlash] = useState<{ id: string; at: number } | null>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const launcher = useRef<HTMLButtonElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);

  /* the heading a line went under lights up, and comes into view if it was off the screen */
  const jump = useCallback((section: string, block: ScrollLogicalPosition) => {
    setFlash({ id: section, at: Date.now() });
    document.querySelector(`[data-section="${section}"]`)?.scrollIntoView({ block, behavior: "smooth" });
  }, []);
  const { messages, typing, send, greet } = useConcierge(brief, onChange, (section) => jump(section, "nearest"));

  /* the first message pokes out of the button a moment after arriving, until it's opened or waved off */
  const [teaser, setTeaser] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setTeaser(true), 1600);
    return () => clearTimeout(t);
  }, []);

  const show = () => {
    if (!messages.length) greet(teaser);
    setTeaser(false);
    setOpen(true);
  };
  const hide = () => setOpen(false);
  const submit = () => {
    if (!draft.trim()) return;
    send(draft);
    setDraft("");
  };

  useEffect(() => {
    if (!open) {
      /* back to the button it came from, but not on arrival */
      if (wasOpen.current) launcher.current?.focus({ preventScroll: true });
      return;
    }
    wasOpen.current = true;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", esc);
    /* only where there's a mouse: on a phone, focusing would throw the keyboard up unasked */
    const t = window.matchMedia("(hover: hover) and (pointer: fine)").matches ? setTimeout(() => input.current?.focus({ preventScroll: true }), 420) : undefined;
    return () => {
      window.removeEventListener("keydown", esc);
      clearTimeout(t);
    };
  }, [open]);

  /* new messages keep the thread scrolled to the bottom */
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length, typing, open]);

  const fresh = messages.length <= 1 && !typing;

  return (
    <>
      {/* the brief stays put; the drawer opens over it */}
      <div>
        <div className="mx-auto w-full max-w-[760px]">
          <Rise i={1} className="flex items-start justify-between gap-4">
            {head}
            <span className="mt-1.5">
              <Saved on={saved} />
            </span>
          </Rise>
          <Rise i={2} className="mt-8">
            <Brief labelledBy="customize-title" brief={brief} onChange={onChange} startWriting={startWriting} onStarted={onStarted} flash={flash} />
          </Rise>
        </div>
      </div>

      {/* the teaser: the greeting, poking out above the button until it's opened or waved off */}
      <AnimatePresence>
        {teaser && !open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            transition={{ duration: 0.35, ease: EASE }}
            style={{ transformOrigin: "bottom right" }}
            className="fixed bottom-[92px] right-5 z-[56] w-[300px] max-w-[calc(100vw-40px)]"
          >
            {/* a stroke in the logo's colours turns round the bubble, its glow turning with it behind; a tail
                points down at the button, and the × sits on the bubble's top corner */}
            <div className="relative">
              <div aria-hidden="true" className="glow-halo pointer-events-none absolute inset-[4px] rounded-[18px]" />
              <motion.button
                type="button"
                onClick={show}
                layoutId={ids?.greeting}
                transition={SPRING}
                style={{ borderRadius: 18 }}
                className="glow-ring relative px-4 py-3 text-left text-[14.5px] leading-snug text-ink shadow-[0_18px_40px_-22px_rgba(40,30,110,0.5)]"
              >
                {GREETING}
                {/* only its two lower sides are drawn, so its top half covers the bubble's stroke and reads as one shape */}
                <span aria-hidden="true" style={{ borderTopWidth: 0, borderLeftWidth: 0 }} className="glow-ring absolute -bottom-[6.5px] right-9 size-3 rotate-45 rounded-br-[3px]" />
              </motion.button>
              <button
                type="button"
                aria-label="Dismiss"
                onClick={() => setTeaser(false)}
                className="absolute -right-2 -top-2 z-10 grid size-6 place-items-center rounded-full bg-white text-muted shadow-[0_0_0_0.5px_#e3e0f1,0_4px_10px_-4px_rgba(40,30,110,0.45)] transition-colors hover:text-ink"
              >
                <RiCloseLine size={13} aria-hidden="true" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* one shell, two states: the pill in the corner unfolds into the drawer, the avatar riding up to its head */}
      <AnimatePresence initial={false}>
        {open ? (
          <motion.section
            key="panel"
            id="concierge-chat"
            role="dialog"
            aria-labelledby="concierge-chat-title"
            layoutId={ids?.shell}
            transition={SPRING}
            style={{ borderRadius: 24 }}
            initial={reduce ? { opacity: 0 } : undefined}
            animate={reduce ? { opacity: 1 } : undefined}
            exit={reduce ? { opacity: 0 } : undefined}
            className="fixed bottom-5 right-5 z-[56] flex h-[min(620px,calc(100svh-104px))] w-[400px] max-w-[calc(100vw-40px)] flex-col overflow-hidden border border-[#ececf1] bg-white shadow-[0_40px_80px_-30px_rgba(40,30,110,0.5)]"
          >
            <header className="flex items-center gap-3 px-5 pb-3.5 pt-4">
              <motion.span layoutId={ids?.avatar} transition={SPRING} className="relative shrink-0">
                {/* a soft ring breathes while the Concierge is writing */}
                <motion.span
                  aria-hidden="true"
                  className="absolute -inset-[3px] rounded-full bg-[linear-gradient(135deg,#8f7cf7,#f0a2c6)]"
                  animate={{ opacity: typing ? [0.5, 1, 0.5] : 0 }}
                  transition={typing ? { duration: 1.4, repeat: Infinity, ease: "easeInOut" } : { duration: 0.4 }}
                />
                <span className="relative block size-10 overflow-hidden rounded-full ring-2 ring-white">
                  <BrandIcon size={40} />
                </span>
                <Presence />
              </motion.span>
              <motion.div {...fade} className="min-w-0 flex-1 leading-tight">
                <h2 id="concierge-chat-title" className="text-[15.5px] font-semibold text-ink">
                  Your Concierge
                </h2>
                <p className="mt-0.5 truncate text-[13px] text-muted" aria-live="polite">
                  {typing ? "Typing…" : "Online"}
                </p>
              </motion.div>
              <motion.button
                {...fade}
                type="button"
                aria-label="Close chat"
                onClick={hide}
                className="-mr-1.5 grid size-8 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-[#f2f2f4] hover:text-ink"
              >
                <RiCloseLine size={18} aria-hidden="true" />
              </motion.button>
            </header>
            <motion.div {...fade} aria-hidden="true" className="mx-5 h-px bg-[#ececf1]" />

            {/* the thread sits low, by the box, and scrolls once it's longer than the drawer */}
            <motion.div ref={scroller} layoutScroll className="min-h-0 flex-1 overflow-y-auto px-5">
              <div className="flex min-h-full flex-col justify-end gap-2 py-4" aria-live="polite">
                {/* what this chat is for, as a card at the top of the thread: it scrolls away with the conversation */}
                <motion.div
                  {...fade}
                  className="relative -mx-1 mb-3 overflow-hidden rounded-[20px] border-[0.5px] border-[#e4ddfb] bg-[linear-gradient(150deg,#f6f3ff_0%,#fbf6fd_60%,#fff7f3_100%)] p-3.5"
                >
                  <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-12 size-36 rounded-full bg-[radial-gradient(closest-side,rgba(143,124,247,0.22),transparent)]" />
                  <div className="relative flex items-start gap-2.5">
                    <span className="grid size-9 shrink-0 place-items-center rounded-[11px] bg-[linear-gradient(135deg,#7a5cfa,#c48af2)] text-white shadow-[0_6px_14px_-6px_rgba(107,78,240,0.6),inset_0_1px_0_rgba(255,255,255,0.35)]">
                      <RiQuillPenAiLine size={18} aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-[14.5px] sm:whitespace-nowrap font-semibold leading-snug tracking-[-0.01em] text-ink">Tell your Concierge about your business</h3>
                      <p className="mt-1 text-[13px] leading-[1.45] text-ink-2">Everything you share here is saved to your brief and shapes every request your Concierge checks.</p>
                    </div>
                  </div>
                </motion.div>
                <Thread messages={messages} typing={typing} ids={ids} onJump={(s) => jump(s, "center")} />
                {/* a few things to try, until something's been said */}
                <AnimatePresence initial={false}>
                  {fresh && (
                    <motion.div {...fade} exit={{ opacity: 0, transition: { duration: 0.15 } }} className="mt-3">
                      <p className="mb-2 text-[12px] font-semibold text-muted">Try saying</p>
                      <div className="flex flex-col items-start gap-1.5">
                        {TRY.map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => send(t)}
                            className="group inline-flex items-center gap-2 rounded-[12px] border-[0.5px] border-[#e3e0f1] bg-white py-2 pl-2.5 pr-3.5 text-left text-[13.5px] font-medium text-ink-2 shadow-[0_1px_2px_rgba(15,20,40,0.04)] transition-[background-color,border-color,color,transform] duration-200 hover:-translate-y-px hover:border-[#cfc4fb] hover:bg-lilac hover:text-[#3b25c4]"
                          >
                            <RiCornerDownRightLine size={15} aria-hidden="true" className="shrink-0 text-[#a99cf5] transition-colors group-hover:text-[#6b4ef0]" />
                            {t}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* the box and the privacy line share a tinted footer under a hairline, apart from the thread */}
            <motion.div {...fade} className="border-t-[0.5px] border-[#ececf1] bg-[#f4f4f4] pb-3 pt-3">
              <Composer value={draft} onChange={setDraft} onSend={submit} inputRef={input} />
              <p className="mt-2.5 text-pretty px-4 text-center text-[11.5px] leading-snug text-muted">
                <RiEyeLine size={13} aria-hidden="true" className="mr-1 inline-block -translate-y-px align-middle" />
                Benable’s team can read this chat to help your Concierge get better.
              </p>
            </motion.div>
          </motion.section>
        ) : (
          <motion.button
            key="launcher"
            ref={launcher}
            type="button"
            onClick={show}
            aria-haspopup="dialog"
            aria-expanded={false}
            aria-controls="concierge-chat"
            layoutId={ids?.shell}
            transition={SPRING}
            style={{ borderRadius: 28 }}
            initial={reduce ? { opacity: 0 } : undefined}
            animate={reduce ? { opacity: 1 } : undefined}
            exit={reduce ? { opacity: 0 } : undefined}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            className="fixed bottom-5 right-5 z-[56] flex h-14 items-center gap-2.5 border border-line bg-white pl-1.5 pr-5 text-[14.5px] font-semibold text-ink shadow-[0_12px_28px_-10px_rgba(40,30,110,0.45)] transition-shadow duration-300 hover:shadow-[0_16px_36px_-12px_rgba(40,30,110,0.55)]"
          >
            <motion.span layoutId={ids?.avatar} transition={SPRING} className="relative shrink-0">
              <span className="block size-11 overflow-hidden rounded-full">
                <BrandIcon size={44} />
              </span>
              <Presence />
            </motion.span>
            <motion.span {...fade} animate={{ opacity: 1, transition: { delay: 0.12, duration: 0.2 } }}>
              Talk to your Concierge
            </motion.span>
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
