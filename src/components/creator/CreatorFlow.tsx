"use client";

import {
  RiArrowDownSLine,
  RiArrowLeftSLine,
  RiCheckLine,
  RiCloseLine,
  RiErrorWarningLine,
  RiFilePdf2Line,
  RiGiftLine,
  RiImageAddLine,
  RiInformationLine,
  RiListCheck2,
  RiLock2Line,
  RiMapPin2Line,
  RiMoneyDollarCircleLine,
  RiUpload2Line,
  type RemixiconComponentType,
} from "@remixicon/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { createContext, useContext, useEffect, useId, useRef, useState, useSyncExternalStore, type FormEvent, type ReactNode } from "react";
import { useControls } from "../controls";
import Logo from "../Logo";
import { BUSINESS } from "./business";
import PreviewDevice from "./PreviewDevice";
import { NAV, OTHER, READY, useCustom, type AskedStep, type PreviewMessage, type Question, type Screen } from "./custom";

/*
  The link a creator gets when they DM the business: one question per screen, a sticky button
  within thumb reach, and the draft saved as they go. Phone first (most creators open it inside
  Instagram). On a laptop the page goes edge to edge: a full-width header and photo, with the questions
  and their button in one centred column.
  The screens are the Collab Concierge creator flow, with nothing filled in for them.
  The business's Customize page (welcome DM, its own questions, thank-you DM) is read from storage; inside
  that page's phone (?customize=1) the editor picks the screen and sends its edits as they're typed.
*/

const EASE = [0.22, 1, 0.36, 1] as const;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const RANGES = ["Under $100", "$100–$250", "$250–$500", "$500–$1,000", "$1,000+"];
const { name, handle: business } = BUSINESS;

type Step = "opener" | "socials" | "collab" | "payment" | "audience" | "manual" | "based" | "contact" | "custom" | "extra" | "done";
const GROUPS = ["Socials", "Collab", "Audience", "Details"];
/* where a step sits in the progress bar: [group, step within it, steps in it]; the business's own questions (n, asked after ours) stretch Details */
function place(step: Step, n: number, qi: number): [number, number, number] | undefined {
  const fixed: Partial<Record<Step, [number, number, number]>> = {
    socials: [0, 1, 1],
    collab: [1, 1, 2],
    payment: [1, 2, 2],
    audience: [2, 1, 1],
    manual: [2, 1, 1],
    based: [3, 1, 3 + n],
    contact: [3, 2, 3 + n],
    custom: [3, 3 + qi, 3 + n],
    extra: [3, 3 + n, 3 + n],
  };
  return fixed[step];
}
const SCREEN_STEP = (s: Screen): Step => (s.kind === "step" ? (s.step as AskedStep) : s.kind === "empty" ? "custom" : s.kind);

type Draft = {
  handle: string;
  create: string;
  want: string;
  paid: "" | "yes" | "no";
  range: string;
  insights: "" | "manual"; // took the screenshots route instead of Connect
  based: string;
  street: string;
  apt: string;
  city: string;
  region: string;
  postcode: string;
  country: string;
  first: string;
  last: string;
  email: string;
  phone: string;
  extra: string;
  answers: Record<string, Answer>;
};
type Answer = { text: string; picks: string[]; other: string };
const NO_ANSWER: Answer = { text: "", picks: [], other: "" };
const EMPTY: Draft = { handle: "", create: "", want: "", paid: "", range: "", insights: "", based: "", street: "", apt: "", city: "", region: "", postcode: "", country: "United States", first: "", last: "", email: "", phone: "", extra: "", answers: {} };
/* an answer counts once there's text, or a pick (and words for "Other" if that's the pick) */
const answered = (q: Question, a: Answer) => (q.kind === "text" ? !!a.text.trim() : a.picks.length > 0 && (!a.picks.includes(OTHER) || !!a.other.trim()));
const answerText = (q: Question, a: Answer) => (q.kind === "text" ? a.text.trim() : a.picks.map((p) => (p === OTHER ? a.other.trim() : p)).join(", "));
/* the shipping address on one line, as the business reads it */
const addressLine = (d: Draft) => [d.street, d.apt, d.city, d.region, d.postcode, d.country].map((x) => x.trim()).filter(Boolean).join(", ");
const cleanHandle = (raw: string) => raw.trim().replace(/^@+/, "").replace(/\s+/g, "").toLowerCase();

/* there's no Instagram lookup behind this yet, so "finding" the account is a short pause and the card is built from the handle */
type Lookup = "idle" | "searching" | "found" | "confirmed";
const LOOKUP_MS = 900;
const handleName = (h: string) => h.split(/[._\d]+/).filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join(" ") || h;

/* the Customize page's phone: it drives the flow from outside, so nothing in it may pull focus from the editor */
/* where this copy runs: the Customize phone (customize), the preview phone that fills itself in (embed),
   the business's "see what creators see" link (preview: a phone frame on a laptop), or a real creator (null) */
type Mode = "customize" | "embed" | "preview" | null;
const modeOf = (): Mode => {
  const q = new URLSearchParams(window.location.search);
  return q.get("customize") === "1" ? "customize" : q.get("embed") === "1" ? "embed" : q.get("preview") === "1" ? "preview" : null;
};
const WIDE = "(min-width: 640px)";
function useWide() {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(WIDE);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia(WIDE).matches,
    () => false
  );
}

/*
  The business's preview fills the form in for them: each step types its answers, then a tap hint
  sits on the button that moves on, so they can tap through the whole flow the way a creator would.
*/
const script = (ships: boolean): Partial<Record<Step, [field: keyof Draft, value: string][]>> => ({
  socials: [["handle", "niacarter"]],
  collab: [
    ["create", "A Reel and two Stories brewing your beans at home, with a code for my followers."],
    ["want", "A bag of beans to try. No payment needed."],
  ],
  payment: [
    ["paid", "yes"],
    ["range", "$100–$250"],
    ["paid", "no"],
  ],
  based: ships
    ? [
        ["street", "1250 Sunset Blvd"],
        ["city", "Los Angeles"],
        ["region", "CA"],
        ["postcode", "90026"],
      ]
    : [["based", "Silver Lake, Los Angeles"]],
  contact: [
    ["first", "Nia"],
    ["last", "Carter"],
    ["email", "niacarter@gmail.com"],
    ["phone", "(323) 555-0148"],
  ],
  extra: [["extra", "Weekday mornings work best. Happy to tag you in Stories too."]],
});
// the preview's stand-in Insights screenshots, dropped into the screenshots step one by one
const DEMO_SHOTS = ["/img/creator/insights-overview.svg", "/img/creator/insights-audience.svg", "/img/creator/insights-engagement.svg"];
const TYPED = new Set<keyof Draft>(["handle", "create", "want", "range", "based", "street", "city", "region", "postcode", "first", "last", "email", "phone", "extra"]);
const noop = () => () => {};
const AutoFocus = createContext(true);

const DRAFT_KEY = `cc:apply:${business}`;
function loadDraft(): Draft {
  if (typeof window === "undefined" || modeOf()) return EMPTY; // previews start blank and save nothing
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY;
  } catch {
    return EMPTY;
  }
}

/* Insights screenshots are scaled down to this many pixels on the long side before they're sent */
const SHOT_MAX = 1400;
async function shrink(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, SHOT_MAX / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.82);
}

/* the last step's optional files: images are shrunk like the Insights shots, PDFs go as they are,
   and the caps keep the whole request under the host's 4.5 MB body limit */
type Attachment = { name: string; size: number; pdf: boolean; url: string };
const FILES_MAX = 3;
const PDF_MAX = 2 * 1024 * 1024;
const FILES_BUDGET = 3_000_000; // characters of data URL across all files
const readAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });

export default function CreatorFlow({ handle: page = business }: { handle?: string }) {
  const reduce = useReducedMotion();
  /* step 4: a local spot asks where they are, a brand that ships asks for an address (the control panel switches it) */
  const ships = useControls().address === "shipping";
  const mode = useSyncExternalStore(noop, modeOf, () => null);
  const edit = mode === "customize";
  const demo = mode === "embed" || mode === "preview";
  const wide = useWide();
  const [current, setStep] = useState<Step>("opener");
  const [qi, setQi] = useState(0);
  /* the business's Customize edits; inside its phone, the editor posts its live copy and the screen to show */
  const stored = useCustom(page);
  const [live, setLive] = useState<PreviewMessage | null>(null);
  useEffect(() => {
    if (!edit) return;
    const on = (e: MessageEvent) => e.origin === window.location.origin && e.data?.type === "cc:customize" && setLive(e.data as PreviewMessage);
    window.addEventListener("message", on);
    window.parent.postMessage({ type: READY }, window.location.origin);
    return () => window.removeEventListener("message", on);
  }, [edit]);
  const custom = live?.custom ?? stored;
  /* inside the Customize phone every button is live: it just asks the page for the next (or last) screen */
  const nav = (by: 1 | -1) => window.parent.postMessage({ type: NAV, by }, window.location.origin);
  const screen: Screen | null = edit ? (live?.screen ?? { kind: "opener" }) : null;
  const step: Step = screen ? SCREEN_STEP(screen) : current;
  const qs = custom.questions;
  const question: Question | null = screen ? (screen.kind === "custom" ? screen.question : null) : (qs[qi] ?? null);
  const [dir, setDir] = useState<1 | -1>(1);
  // the opener shows none of the draft, so reading storage up front can't change the first paint
  const [d, setD] = useState<Draft>(loadDraft);
  const [shots, setShots] = useState<(string | null)[]>([null, null, null]);
  const [shotError, setShotError] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(false);

  /* save the draft as they type; a quiet "Saved" says it worked */
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => {
    const next = { ...d, [k]: v };
    setD(next);
    if (edit || demo) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
      setSaved(true);
    } catch {}
  };
  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 1400);
    return () => clearTimeout(t);
  }, [saved, d]);

  const addShot = async (i: number, file?: File) => {
    if (!file) return;
    try {
      const url = await shrink(file);
      setShotError(false);
      setShots((prev) => prev.map((s, j) => (j === i ? url : s)));
    } catch {
      setShotError(true);
    }
  };

  const [files, setFiles] = useState<Attachment[]>([]);
  const handle = cleanHandle(d.handle);
  const [found, setFound] = useState(""); // the handle the (pretend) lookup finished for
  const [mine, setMine] = useState(""); // the handle they said "that's me" to
  useEffect(() => {
    if (!handle) return;
    const t = setTimeout(() => setFound(handle), LOOKUP_MS);
    return () => clearTimeout(t);
  }, [handle]);
  // a beat to see "That's me" land, then on to the next question (as in the demo)
  const onward = useRef<ReturnType<typeof setTimeout>>(undefined);
  const confirm = () => {
    if (edit) return;
    setMine(handle);
    onward.current = setTimeout(() => go("collab"), 700);
  };
  const lookup: Lookup = !handle ? "idle" : mine === handle ? "confirmed" : found === handle ? "found" : "searching";
  const [fileError, setFileError] = useState("");
  const addFiles = async (list: File[]) => {
    setFileError("");
    let next = files;
    for (const file of list) {
      if (next.length >= FILES_MAX) break;
      const pdf = file.type === "application/pdf";
      if (pdf && file.size > PDF_MAX) {
        setFileError(`${file.name} is over 2 MB. Try a smaller PDF.`);
        continue;
      }
      if (!pdf && !file.type.startsWith("image/")) {
        setFileError(`${file.name} isn't a PDF or an image.`);
        continue;
      }
      try {
        const url = pdf ? await readAsDataUrl(file) : await shrink(file);
        if (next.reduce((n, f) => n + f.url.length, url.length) > FILES_BUDGET) {
          setFileError("That's a lot to send at once. Try fewer or smaller files.");
          continue;
        }
        next = [...next, { name: file.name, size: pdf ? file.size : Math.round((url.length * 3) / 4), pdf, url }];
      } catch {
        setFileError(`We couldn't open ${file.name}. Try a PDF, PNG or JPG.`);
      }
    }
    setFiles(next);
  };
  const dropFile = (i: number) => {
    setFileError("");
    setFiles((prev) => prev.filter((_, j) => j !== i));
  };

  /* Connect Instagram (Zernio) isn't wired up yet: after a beat it hands over to the screenshots, saying why */
  const [connecting, setConnecting] = useState(false);
  const [notice, setNotice] = useState(false);
  const toManual = (why = false) => {
    if (edit) return;
    setNotice(why);
    set("insights", "manual");
    go("manual");
  };
  const connect = () => {
    if (edit || connecting) return;
    setConnecting(true);
    // the preview shows Connect working, as it will once Zernio is wired up; real creators get the screenshots
    onward.current = demo ? setTimeout(() => go("based"), 1600) : setTimeout(() => toManual(true), 900);
  };

  const go = (to: Step, direction: 1 | -1 = 1, toQ = 0) => {
    if (edit) return; // the editor picks what its phone shows
    clearTimeout(onward.current); // Back during the beat after "That's me" (or while connecting) wins
    setConnecting(false);
    setQi(toQ);
    setDir(direction);
    setStep(to);
    setSendError(false);
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };

  /* preview: each step types its answers in, then flags the button to tap; leaving the step stops it */
  const [filled, setFilled] = useState<Step | null>(null);
  useEffect(() => {
    if (!demo) return;
    const ts: ReturnType<typeof setTimeout>[] = [];
    const put = (k: keyof Draft, v: string) => setD((p) => ({ ...p, [k]: v }));
    let t = 650; // let the step slide in first
    for (const [k, v] of script(ships)[step] ?? []) {
      if (!TYPED.has(k)) {
        ts.push(setTimeout(() => put(k, v), t));
        t += 1100; // long enough to see each choice land
        continue;
      }
      ts.push(setTimeout(() => put(k, ""), t));
      const speed = v.length > 40 ? 22 : 60;
      for (let i = 1; i <= v.length; i++) ts.push(setTimeout(() => put(k, v.slice(0, i)), t + i * speed));
      t += v.length * speed + 380;
    }
    if (step === "socials") t += LOOKUP_MS + 300; // the account card comes up before the tap hint
    if (step === "manual") {
      // each empty slot gets its screenshot in turn; ones the business added itself stay
      DEMO_SHOTS.forEach((src, i) => {
        ts.push(setTimeout(() => setShots((p) => p.map((u, j) => (j === i ? (u ?? src) : u))), t));
        t += 900;
      });
    }
    ts.push(setTimeout(() => setFilled(step), t));
    return () => {
      ts.forEach(clearTimeout);
      setFilled(null);
    };
  }, [demo, step, ships]);
  const hint = (s: Step) => demo && filled === s && step === s;

  const valid: Record<Step, boolean> = {
    opener: true,
    socials: lookup === "confirmed",
    collab: !!d.create.trim() && !!d.want.trim(),
    payment: d.paid === "no" || (d.paid === "yes" && !!d.range),
    audience: false, // left through Connect Instagram or "Add screenshots instead", not Next
    manual: shots.every(Boolean),
    based: ships ? !!d.street.trim() && !!d.city.trim() && !!d.postcode.trim() && !!d.country : !!d.based.trim(),
    contact: !!d.first.trim() && !!d.last.trim() && EMAIL.test(d.email.trim()) && d.phone.replace(/\D/g, "").length >= 7,
    // the preview's tap-through doesn't type into the business's own questions, so it doesn't wait on them
    custom: demo || !question || answered(question, d.answers[question.id] ?? NO_ANSWER),
    extra: true,
    done: true,
  };
  const NEXT: Partial<Record<Step, Step>> = {
    opener: "socials",
    socials: "collab",
    collab: "payment",
    payment: "audience",
    audience: "based",
    manual: "based",
    based: "contact",
    contact: qs.length ? "custom" : "extra",
    custom: qi < qs.length - 1 ? "custom" : "extra",
    extra: "done",
  };
  const BACK: Partial<Record<Step, Step>> = {
    socials: "opener",
    collab: "socials",
    payment: "collab",
    audience: "payment",
    manual: "audience",
    based: "audience",
    contact: "based",
    custom: qi > 0 ? "custom" : "contact",
    extra: qs.length ? "custom" : "contact",
  };
  /* which of the business's questions a move lands on */
  const nextQ = step === "custom" ? qi + 1 : 0;
  const backQ = step === "custom" ? qi - 1 : qs.length - 1;

  const send = async () => {
    if (demo) return go("done"); // the preview sends nothing
    setSending(true);
    setSendError(false);
    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...d,
          handle: cleanHandle(d.handle),
          range: d.paid === "yes" ? d.range : "",
          based: ships ? addressLine(d) : d.based.trim(),
          kind: ships ? "shipping" : "local",
          answers: qs.map((q) => ({ question: q.title, answer: answerText(q, d.answers[q.id] ?? NO_ANSWER) })),
          screenshots: shots,
          files: files.map(({ name, url }) => ({ name, url })),
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {}
      go("done");
    } catch {
      setSendError(true);
    } finally {
      setSending(false);
    }
  };

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    if (edit) return nav(1);
    if (!valid[step] || sending) return;
    if (step === "extra") return void send();
    go(NEXT[step]!, 1, nextQ);
  };

  // after the thank-you, the preview goes back to the business's Concierge
  const share = () => (window.top ?? window).location.assign(`/share?handle=${encodeURIComponent(page)}`);

  const at = screen?.kind === "custom" ? place("custom", screen.total, screen.index) : screen?.kind === "empty" ? place("custom", screen.total, 0) : place(step, qs.length, qi);

  // on a laptop, the preview is the real flow inside a phone, so it reads the way creators see it
  if (mode === "preview" && wide) return <PreviewDevice handle={page} />;

  return (
    <AutoFocus value={!edit}>
    {/* inside the drawn iPhone there's no home-indicator inset, so the buttons get 12px more room off its rounded corners */}
    <div className="creator-flow relative min-h-svh bg-white" style={mode === "customize" || mode === "embed" ? ({ "--lift": "12px" } as React.CSSProperties) : undefined}>
      <main className="relative flex min-h-svh w-full flex-col">
        {step === "opener" ? (
          <Opener welcome={custom.welcome} onStart={() => (edit ? nav(1) : go("socials"))} hint={hint("opener")} />
        ) : step === "done" ? (
          <Done thanks={custom.thanks} onDone={demo ? share : undefined} hint={hint("done")} />
        ) : (
          <>
            <TopBar step={at!} onBack={() => edit ? nav(-1) : go(step === "based" && d.insights === "manual" ? "manual" : BACK[step]!, -1, backQ)} saved={saved} />
            <form id="flow" onSubmit={submit} noValidate className={`${COLUMN} flex-1 px-4 pb-8 pt-[17px] sm:px-6 sm:pb-12 sm:pt-12`}>
              <AnimatePresence mode="wait" custom={dir} initial={false}>
                <motion.div
                  key={step === "custom" ? `custom-${screen ? "edit" : qi}` : step}
                  custom={dir}
                  variants={{
                    enter: (s: number) => ({ x: reduce ? 0 : s * 28, opacity: 0 }),
                    center: { x: 0, opacity: 1 },
                    exit: (s: number) => ({ x: reduce ? 0 : s * -28, opacity: 0 }),
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.32, ease: EASE }}
                >
                  {step === "socials" && <Socials d={d} set={set} lookup={lookup} onConfirm={confirm} hint={hint("socials")} />}
                  {step === "collab" && <Collab d={d} set={set} />}
                  {step === "payment" && <Payment d={d} set={set} gifted={custom.gifted} />}
                  {step === "audience" && <Connect />}
                  {step === "manual" && <Audience shots={shots} onAdd={addShot} error={shotError} notice={notice} />}
                  {step === "based" && (ships ? <Shipping d={d} set={set} /> : <Based d={d} set={set} />)}
                  {step === "contact" && <Contact d={d} set={set} />}
                  {step === "custom" &&
                    (question ? (
                      <Custom q={question} a={d.answers[question.id] ?? NO_ANSWER} onChange={(a) => set("answers", { ...d.answers, [question.id]: a })} />
                    ) : (
                      <NoQuestions />
                    ))}
                  {step === "extra" && <Extra d={d} set={set} files={files} onAdd={addFiles} onRemove={dropFile} fileError={fileError} />}
                </motion.div>
              </AnimatePresence>
              <div id="flow-end" aria-hidden="true" />
            </form>

            <Footer>
              <AnimatePresence initial={false}>
                {sendError && (
                  <motion.p
                    role="alert"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: EASE }}
                    className="overflow-hidden text-center text-[14px] text-[#c23a56]"
                  >
                    <span className="flex items-center justify-center gap-1.5 pb-3">
                      <RiErrorWarningLine size={16} aria-hidden="true" />
                      That didn&apos;t send. Check your connection and try again.
                    </span>
                  </motion.p>
                )}
              </AnimatePresence>
              {step === "audience" ? (
                <>
                  <Primary type="button" onClick={edit ? () => nav(1) : connect} busy={connecting} hint={hint("audience") && !connecting}>
                    Connect Instagram
                  </Primary>
                  <button type="button" onClick={() => (edit ? nav(1) : toManual())} className="mt-1 flex h-12 w-full items-center justify-center text-[16px] font-medium text-[#717171] transition-colors hover:text-[#1c1c1c]">
                    Add screenshots instead
                  </button>
                </>
              ) : (
                <Primary type="submit" form="flow" disabled={!edit && !valid[step]} busy={sending} hint={hint(step) && valid[step]}>
                  {step === "extra" ? (sending ? "Sending…" : "Send my request") : "Next"}
                </Primary>
              )}
            </Footer>
          </>
        )}
      </main>
    </div>
    </AutoFocus>
  );
}

/* ---------- screens ---------- */

/* the first screen: the Benable cover fading to white, their avatar and name, the title, their welcome DM, and Let's go */
function Opener({ welcome, onStart, hint = false }: { welcome: string; onStart: () => void; hint?: boolean }) {
  return (
    <div className="relative flex flex-1 flex-col">
      <Cover height={415} top={0.5} />
      <PoweredBy />

      <Enter i={1} className={`${COLUMN} relative mt-[229.75px] flex flex-col items-center gap-6 px-[21.38px] sm:mt-[250px]`}>
        <Business />
        <Headline>Request a collab</Headline>
      </Enter>

      {welcome.trim() && (
        <Enter i={2} className={`${COLUMN} relative mt-[60.75px] sm:mt-12`}>
          <Bubble>{welcome}</Bubble>
        </Enter>
      )}

      <div className={`${COLUMN} ${DOCK} pb-[max(calc(30.5px+var(--lift,0px)),env(safe-area-inset-bottom))]`}>
        <button type="button" onClick={onStart} className={CTA}>
          Let&apos;s go
          {hint && <TapHint />}
        </button>
        <p className="mt-4 text-center text-[14px] leading-4 text-[#aaa]">About 2 minutes</p>
      </div>
    </div>
  );
}

/* the thank-you screen: what happens next, the business's thank-you DM, and one button to follow them */
function Done({ thanks, onDone, hint = false }: { thanks: string; onDone?: () => void; hint?: boolean }) {
  return (
    <div className="relative flex flex-1 flex-col">
      <Cover height={257} top={1} />
      <PoweredBy />
      <Confetti />

      <Enter i={1} className={`${COLUMN} relative mt-[69.75px] flex flex-col items-center gap-6 px-[21.38px] sm:mt-[150px]`}>
        <Business />
        <div className="flex w-full flex-col items-center gap-2 text-center">
          <Headline>Amazing!</Headline>
          <p className="text-[16px] leading-[normal] text-[#717171]">Your collab request is being reviewed by {name}. We&apos;ll text you the second they answer.</p>
        </div>
      </Enter>

      {thanks.trim() && (
        <Enter i={2} className={`${COLUMN} relative mt-[37.5px] sm:mt-10`}>
          <Bubble>{thanks}</Bubble>
        </Enter>
      )}

      <div className={`${COLUMN} ${DOCK} pb-[max(calc(21px+var(--lift,0px)),env(safe-area-inset-bottom))]`}>
        {/* the preview's last tap goes back to the Concierge instead of Instagram */}
        <a
          href={`https://www.instagram.com/${encodeURIComponent(business)}`}
          target="_blank"
          rel="noopener"
          onClick={(e) => {
            if (!onDone) return;
            e.preventDefault();
            onDone();
          }}
          className={CTA}
        >
          Follow @{business} on Instagram
          {hint && <TapHint />}
        </a>
        <p className="mx-auto mt-[14px] w-[295px] max-w-full text-center text-[13px] leading-[17px] text-[#4a4a4a]">
          <span className="font-semibold">Benable</span> is an app that connects over 1 million creators with local businesses and brands.
        </p>
      </div>
    </div>
  );
}

function Socials({ d, set, lookup, onConfirm, hint = false }: Bind & { lookup: Lookup; onConfirm: () => void; hint?: boolean }) {
  const id = useId();
  const open = lookup === "found" || lookup === "confirmed";
  const handle = cleanHandle(d.handle);
  return (
    <>
      <Title sub="Add your primary Instagram.">Your socials</Title>
      <Label className="mt-6">Platform</Label>
      <div className="relative mt-2">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
          <IgGlyph />
        </span>
        <select aria-label="Platform" defaultValue="instagram" className={`${field} appearance-none pl-12 pr-11 text-[16px] font-medium`}>
          <option value="instagram">Instagram</option>
          <option value="tiktok" disabled>
            TikTok (coming soon)
          </option>
        </select>
        <RiArrowDownSLine size={20} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#717171]" aria-hidden="true" />
      </div>
      <Label className="mt-4">
        <label htmlFor={id}>Your handle</label>
      </Label>
      <div className={`${field} ${fieldWithin} mt-2 flex items-center gap-1`}>
        <span className="text-[#aaa]">@</span>
        <input id={id} autoFocus={useContext(AutoFocus)} autoCapitalize="none" autoCorrect="off" spellCheck={false} value={d.handle} onChange={(e) => set("handle", e.target.value)} placeholder="yourhandle" className="h-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-[#aaa]" />
        {lookup === "searching" && <span className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-[#7a5cfa]/15 border-t-[#7a5cfa] motion-reduce:animate-none" aria-hidden="true" />}
        {open && (
          <motion.span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-mint/15 text-[#178a60]" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.35, ease: EASE }}>
            <RiCheckLine size={16} aria-label="Account found" />
          </motion.span>
        )}
      </div>

      {/* "is this you?": the account we found, and one tap to say yes before Next unlocks */}
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Confirm your account"
            className="mt-3 flex items-center gap-3 rounded-[22px] border border-line bg-white p-3 shadow-[0_24px_50px_-22px_rgba(40,30,110,0.45)]"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.4, ease: EASE }}
          >
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-lilac text-[18px] font-semibold text-violet" aria-hidden="true">
              {handle[0]?.toUpperCase()}
            </span>
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-[16px] font-semibold text-ink">{handleName(handle)}</div>
              <div className="mt-0.5 truncate text-[13.5px] text-muted">@{handle}</div>
            </div>
            <AnimatePresence mode="wait" initial={false}>
              {lookup === "confirmed" ? (
                <motion.span
                  key="yes"
                  role="status"
                  className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-mint px-4 text-[14px] font-semibold text-white"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, ease: EASE }}
                >
                  <RiCheckLine size={16} aria-hidden="true" /> That&apos;s me
                </motion.span>
              ) : (
                <motion.button
                  key="ask"
                  type="button"
                  onClick={onConfirm}
                  className="relative h-10 shrink-0 rounded-full bg-[#111] px-4 text-[14px] font-semibold text-white transition-colors hover:bg-black"
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                >
                  Yes, that&apos;s me
                  {hint && <TapHint />}
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Collab({ d, set }: Bind) {
  return (
    <>
      <Title>What did you have in mind for the collab?</Title>
      <Area label="What would you create or do for us?" hint="Share any specifics you have in mind, and say if you're open to other kinds of collabs too." value={d.create} onChange={(v) => set("create", v)} autoFocus className="mt-6" />
      <Area label="What would you like from us?" hint="Any complimentary services or products, and whether you're expecting payment." value={d.want} onChange={(v) => set("want", v)} className="mt-6" />
    </>
  );
}

function Payment({ d, set, gifted }: Bind & { gifted: boolean }) {
  return (
    <>
      {/* built to Figma (Design Labs 15596:53212): the question, the business's tip, two option cards, and the fee range under a yes */}
      <Title>Do you need payment for this collab?</Title>
      {/* the business's Customize toggle: it mostly does gifted collabs, so they read that before they answer */}
      {gifted && (
        <div className="mt-4">
          <Note>
            {name} usually prioritizes <span className="font-semibold">gifted collabs</span> where no payment is required.
          </Note>
        </div>
      )}
      <div role="radiogroup" aria-label="Payment" className="mt-6 flex flex-col gap-4">
        <Option on={d.paid === "no"} onClick={() => set("paid", "no")} title="No" badge={gifted ? "Recommended" : undefined} icon={RiGiftLine}>
          You&apos;ll receive the product. Brands like {name} reply fastest to gifted requests.
        </Option>
        <Option on={d.paid === "yes"} onClick={() => set("paid", "yes")} title="Yes" icon={RiMoneyDollarCircleLine}>
          Product plus a fee. Paid requests are less likely to be accepted.
        </Option>
      </div>
      {/* the range only matters if they're charging, so it waits for a yes */}
      <AnimatePresence initial={false}>
        {d.paid === "yes" && (
          <motion.div key="yes" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: EASE }} className="overflow-hidden">
            <Label sub={`We share the range with ${name} before they decide.`} className="pt-4">
              Fee range
            </Label>
            <div role="radiogroup" aria-label="Fee range" className="mt-4 flex flex-wrap gap-3">
              {RANGES.map((r) => (
                <Chip key={r} on={d.range === r} onClick={() => set("range", r)}>
                  {r}
                </Chip>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* step 3: connect Instagram (read-only, through Zernio), with screenshots as the way round it */
const SEES = ["Follower size and engagement", "Audience insights and location", "Your content and how it performs"];
function Connect() {
  return (
    <>
      <Title sub={`Connect Instagram so ${name} can see your account size, audience and content at a glance.`}>Your audience and content</Title>
      <div className="mt-6 rounded-[12px] border border-[#e3e3e3] bg-white p-4">
        <div className="text-[14px] font-semibold text-[#1c1c1c]">What {name} will see</div>
        <ul className="mt-3 space-y-3">
          {SEES.map((s) => (
            <li key={s} className="flex items-center gap-3 text-[14px] text-[#1c1c1c]">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-mint/15 text-[#178a60]">
                <RiCheckLine size={14} aria-hidden="true" />
              </span>
              {s}
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-4 flex gap-2 text-[14px] leading-[1.45] text-[#717171]">
        <RiInformationLine size={18} className="mt-px shrink-0" aria-hidden="true" />
        <p>
          You&apos;ll log in to Instagram here in your browser, then come straight back. <strong className="font-semibold text-[#1c1c1c]">On its permissions screen, leave the second switch on</strong> (the first is always on and
          shows grey): it lets {name} see your numbers. Forgot your password?{" "}
          <a href="https://www.instagram.com/accounts/password/reset/" target="_blank" rel="noopener" className="font-semibold text-[#7a5cfa] hover:underline">
            Reset it first
          </a>
          , then come back to this page.
        </p>
      </div>
      <div className="mt-4 flex gap-2 text-[12px] leading-[1.45] text-[#aaa]">
        <RiLock2Line size={18} className="mt-px shrink-0" aria-hidden="true" />
        <p>Read-only: we can&apos;t post or message. We read your stats once, then disconnect. Connects through Zernio, using Instagram&apos;s official login. We keep your stats for your collab requests; ask us anytime to delete them.</p>
      </div>
    </>
  );
}

/* three Insights screenshots, picked from the camera roll and shown back as thumbnails */
function Audience({ shots, onAdd, error, notice }: { shots: (string | null)[]; onAdd: (i: number, f?: File) => void; error: boolean; notice: boolean }) {
  const slots = [
    { title: "Overview", hint: "Insights → Overview. Accounts reached and followers." },
    { title: "Audience", hint: "Insights → Total followers. Top cities, age, gender." },
    { title: "Engagement", hint: "Insights → Accounts engaged. Likes, comments, shares." },
  ];
  return (
    <>
      <Title sub={`Add three screenshots from Instagram Insights. ${name} sees these and nothing else.`}>Your audience and content</Title>
      {notice && (
        <div role="status" className="mt-4">
          <Note>Connecting Instagram isn&apos;t ready yet, so add these three screenshots instead. It takes about a minute.</Note>
        </div>
      )}
      <ul className="mt-6 space-y-4">
        {slots.map((s, i) => {
          const src = shots[i];
          return (
            <li key={s.title} className={`flex items-center gap-3 p-4 ${card(!!src)}`}>
              <span className="relative grid h-14 w-11 shrink-0 place-items-center overflow-hidden rounded-[8px] border-[0.5px] border-[#e3e3e3] bg-[#f7f7f7] text-[14px] font-semibold text-[#717171]">
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src} alt={`${s.title} screenshot`} className="h-full w-full object-cover" />
                ) : (
                  i + 1
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className={`flex items-center gap-1.5 text-[16px] font-bold transition-colors duration-200 ${src ? "text-[#7a5cfa]" : "text-[#1c1c1c]"}`}>
                  {s.title}
                  {src && <RiCheckLine size={16} aria-hidden="true" />}
                </div>
                <div className="mt-1 text-[12px] leading-snug text-[#717171]">{s.hint}</div>
              </div>
              <label className={`inline-flex h-[34px] shrink-0 items-center gap-1.5 rounded-[8px] px-2.5 text-[14px] font-medium transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#7a5cfa] ${src ? "border-[0.5px] border-[#e3e3e3] bg-[#f7f7f7] text-[#717171] hover:text-[#1c1c1c]" : "bg-[#7a5cfa] text-white hover:bg-[#6c4ef0]"}`}>
                {!src && <RiImageAddLine size={16} aria-hidden="true" />}
                {src ? "Change" : "Add"}
                <input type="file" accept="image/*" className="sr-only" onChange={(e) => onAdd(i, e.target.files?.[0])} />
              </label>
            </li>
          );
        })}
      </ul>
      {error && (
        <p role="alert" className="mt-3 px-1 text-[13.5px] text-[#c23a56]">
          We couldn&apos;t open that image. Try a screenshot saved as a photo (PNG or JPG).
        </p>
      )}
    </>
  );
}

function Based({ d, set }: Bind) {
  const id = useId();
  return (
    <>
      <Title sub="It helps to know how far you'd be coming from.">Your current or home address</Title>
      <label htmlFor={id} className="sr-only">
        Where you&apos;re based
      </label>
      <div className={`${field} ${fieldWithin} mt-6 flex items-center gap-2.5`}>
        <RiMapPin2Line size={19} className="shrink-0 text-[#717171]" aria-hidden="true" />
        <input id={id} autoFocus={useContext(AutoFocus)} value={d.based} onChange={(e) => set("based", e.target.value)} placeholder="Neighborhood or city" autoComplete="address-level2" className="h-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-[#aaa]" />
      </div>
    </>
  );
}

/* a brand that ships products: the address to send them to */
function Shipping({ d, set }: Bind) {
  const id = useId();
  return (
    <>
      <Title sub="Where you'd like any products shipped.">Your shipping address</Title>
      <div className="mt-6 space-y-3">
        <Input label="Street address" value={d.street} onChange={(v) => set("street", v)} autoComplete="address-line1" autoFocus />
        <Input label="Apt, suite, etc. (optional)" value={d.apt} onChange={(v) => set("apt", v)} autoComplete="address-line2" />
        <Input label="City" value={d.city} onChange={(v) => set("city", v)} autoComplete="address-level2" />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Region (optional)" value={d.region} onChange={(v) => set("region", v)} autoComplete="address-level1" />
          <Input label="Postcode" value={d.postcode} onChange={(v) => set("postcode", v)} autoComplete="postal-code" />
        </div>
        {/* the country keeps its label floated, like a filled field */}
        <div className="relative">
          <select id={id} value={d.country} onChange={(e) => set("country", e.target.value)} autoComplete="country-name" className={`${field} h-[58px] appearance-none pb-1.5 pr-11 pt-5`}>
            {COUNTRIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <label htmlFor={id} className="pointer-events-none absolute left-4 top-[17px] -translate-y-1/2 text-[12.5px] text-[#aaa]">
            Country
          </label>
          <RiArrowDownSLine size={20} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#717171]" aria-hidden="true" />
        </div>
      </div>
    </>
  );
}

/* every country by its English name, A to Z (ISO 3166-1 codes named by the browser) */
const COUNTRIES = (() => {
  const names = new Intl.DisplayNames(["en"], { type: "region" });
  const codes =
    "AD AE AF AG AI AL AM AO AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GT GU GW GY HK HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS XK YE YT ZA ZM ZW";
  return codes
    .split(" ")
    .map((c) => names.of(c) ?? c)
    .sort((a, b) => a.localeCompare(b));
})();

function Contact({ d, set }: Bind) {
  const [touched, setTouched] = useState(false);
  const badEmail = touched && !!d.email.trim() && !EMAIL.test(d.email.trim());
  return (
    <>
      <Title sub="So they know who they're saying yes to. We'll notify you as soon as they answer!">Your name and contact info</Title>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Input label="First name" value={d.first} onChange={(v) => set("first", v)} autoComplete="given-name" autoFocus />
        <Input label="Last name" value={d.last} onChange={(v) => set("last", v)} autoComplete="family-name" />
      </div>
      <Input label="Email" type="email" inputMode="email" value={d.email} onChange={(v) => set("email", v)} onBlur={() => setTouched(true)} autoComplete="email" invalid={badEmail} className="mt-3" />
      <AnimatePresence initial={false}>
        {badEmail && (
          <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: EASE }} className="overflow-hidden px-1 text-[13.5px] text-[#c23a56]">
            <span className="block pt-2">That doesn&apos;t look like an email. Check it and try again.</span>
          </motion.p>
        )}
      </AnimatePresence>
      <Input label="Phone" type="tel" inputMode="tel" value={d.phone} onChange={(v) => set("phone", v.replace(/[^\d+()\-.\s]/g, ""))} autoComplete="tel" className="mt-3" />
    </>
  );
}

/* one of the business's own questions (Customize): a text box, or a list to pick one or several from */
function Custom({ q, a, onChange }: { q: Question; a: Answer; onChange: (a: Answer) => void }) {
  const otherId = useId();
  const list = q.answers.filter((x) => x.trim());
  const options = q.other ? [...list, OTHER] : list;
  const pick = (v: string) => onChange({ ...a, picks: q.multi ? (a.picks.includes(v) ? a.picks.filter((p) => p !== v) : [...a.picks, v]) : [v] });
  const otherOn = a.picks.includes(OTHER);
  return (
    <>
      <Title sub={q.sub.trim() || undefined}>{q.title.trim() || "Your question"}</Title>
      {q.kind === "text" ? (
        <Area label="" value={a.text} onChange={(text) => onChange({ ...a, text })} placeholder="Type your answer" autoFocus className="mt-6" />
      ) : (
        <>
          <Label className="mt-6">{q.multi ? "Pick all that apply" : "Pick one"}</Label>
          <div role={q.multi ? "group" : "radiogroup"} aria-label={q.title} className="mt-3 flex flex-col gap-3">
            {options.map((v, i) => {
              const on = a.picks.includes(v);
              return (
                <button
                  key={`${v}-${i}`}
                  type="button"
                  role={q.multi ? "checkbox" : "radio"}
                  aria-checked={on}
                  onClick={() => pick(v)}
                  className={`flex min-h-[56px] w-full items-center gap-3 px-4 py-3 text-left ${card(on)}`}
                >
                  <span className={`min-w-0 flex-1 text-[16px] font-bold transition-colors duration-200 ${on ? "text-[#7a5cfa]" : "text-[#1c1c1c]"}`}>{v === OTHER ? "Other" : v}</span>
                  <span
                    aria-hidden="true"
                    className={`grid size-[22px] shrink-0 place-items-center transition-colors duration-200 ${q.multi ? "rounded-[6px]" : "rounded-full"} ${on ? "bg-[#7a5cfa] text-white" : "border border-[#ddd] bg-white"}`}
                  >
                    {on && <RiCheckLine size={15} />}
                  </span>
                </button>
              );
            })}
          </div>
          {/* "Other" opens a field for their own words, right under the list */}
          <AnimatePresence initial={false}>
            {otherOn && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: EASE }} className="overflow-hidden">
                <label htmlFor={otherId} className="sr-only">
                  Your answer
                </label>
                <input id={otherId} value={a.other} onChange={(e) => onChange({ ...a, other: e.target.value })} placeholder="Type your answer" className={`${field} mt-3 placeholder:text-[#aaa]`} />
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </>
  );
}

/* the Customize phone's Questions tab before the business has added any */
function NoQuestions() {
  return (
    <div className="flex flex-col items-center px-6 pt-24 text-center">
      <span className="grid size-12 place-items-center rounded-[12px] border border-[#e3e3e3] bg-[#fcf9ff] text-[#7a5cfa]">
        <RiListCheck2 size={22} aria-hidden="true" />
      </span>
      <p className="mt-4 text-[14px] leading-relaxed text-[#717171]">Add a question and it shows up here, just as creators will see it.</p>
    </div>
  );
}

function Extra({ d, set, files, onAdd, onRemove, fileError }: Bind & { files: Attachment[]; onAdd: (f: File[]) => void; onRemove: (i: number) => void; fileError: string }) {
  return (
    <>
      <Title sub="Media kit, portfolio, timing preferences, restrictions, or anything else.">Anything else you&apos;d like to add?</Title>
      <Area label="" value={d.extra} onChange={(v) => set("extra", v)} placeholder="Optional" autoFocus className="mt-6" />
      <Files files={files} onAdd={onAdd} onRemove={onRemove} error={fileError} />
    </>
  );
}

const fileSize = (b: number) => (b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`);

/* a dashed tap-to-upload box for a media kit or screenshots of past work, each file listed back with a way to take it out */
function Files({ files, onAdd, onRemove, error }: { files: Attachment[]; onAdd: (f: File[]) => void; onRemove: (i: number) => void; error: string }) {
  return (
    <div className="mt-6">
      <div className="flex items-center gap-1">
        <span className="text-[14px] font-semibold text-[#1c1c1c]">Upload Media Kit or Portfolio</span>
        <span className="text-[12px] font-medium text-[#aaa]">(Optional)</span>
      </div>
      {files.length > 0 && (
        <ul className="mt-3 space-y-2">
          {files.map((f, i) => (
            <li key={`${f.name}-${f.url.length}-${i}`} className="flex items-center gap-3 rounded-[12px] border border-[#e3e3e3] bg-white p-2 pr-1.5">
              <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-[8px] bg-[#fcf9ff] text-[#7a5cfa]">
                {f.pdf ? (
                  <RiFilePdf2Line size={20} aria-hidden="true" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.url} alt="" className="h-full w-full object-cover" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-semibold text-[#1c1c1c]">{f.name}</div>
                <div className="text-[12px] text-[#717171]">{fileSize(f.size)}</div>
              </div>
              <button type="button" onClick={() => onRemove(i)} aria-label={`Remove ${f.name}`} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[#717171] transition-colors hover:bg-[#f7f7f7] hover:text-[#1c1c1c]">
                <RiCloseLine size={18} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {files.length < FILES_MAX && (
        <label className="mt-3 flex h-[90px] cursor-pointer flex-col items-center justify-center gap-3 rounded-[12px] border border-dashed border-[#717171] bg-[#fcfcfc] px-3 py-3.5 text-[#1c1c1c] transition-colors hover:border-[#7a5cfa] hover:bg-[#fcf9ff] focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#7a5cfa]">
          <RiUpload2Line size={16} aria-hidden="true" />
          <span className="text-[13px] font-medium">Tap to upload files</span>
          <input
            type="file"
            multiple
            accept="image/*,application/pdf"
            className="sr-only"
            onChange={(e) => {
              onAdd(Array.from(e.target.files ?? []));
              e.target.value = "";
            }}
          />
        </label>
      )}
      {error && (
        <p role="alert" className="mt-3 px-1 text-[13.5px] text-[#c23a56]">
          {error}
        </p>
      )}
    </div>
  );
}

/* ---------- the opener and thank-you screens share these ---------- */

/* the same Benable cover for every business (their own photo sits on top as the avatar): the soft brand
   gradient with faint violet doodles, fading to white. Matches the demo's creator page. */
function Cover({ height, top }: { height: number; top: number }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 overflow-hidden" style={{ top, height }} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/img/cover/gradient.png" alt="" className="absolute inset-0 h-full w-full object-cover" />
      {/* the doodles: the phone's portrait pattern, and a wide version (Higgsfield outpaint of it) for laptops */}
      <div className="absolute inset-0 bg-[url(/img/cover/pattern-lines.png)] bg-cover bg-top opacity-40 sm:bg-[url(/img/cover/pattern-lines-wide.jpg)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_top,#fff,rgba(255,255,255,0))]" />
    </div>
  );
}

/* the dark strip at the top: "Powered by" and the Benable logo */
function PoweredBy() {
  return (
    <div className="sticky top-0 z-10 flex h-[67px] items-start justify-center bg-[linear-gradient(to_top,rgba(0,0,0,0)_4.753%,rgba(0,0,0,0.3)_74.958%)] px-5 pb-5 pt-3 text-white sm:h-[76px] sm:pt-5">
      <div className="flex items-center gap-2">
        <span className="text-[16px] leading-[normal]">Powered by</span>
        <Logo height={25.115} />
      </div>
    </div>
  );
}

/* their avatar tucked into a white name pill with the brand gradient as its stroke */
function Business() {
  return (
    <div className="flex flex-col items-center">
      <span className="relative mb-[-18px] size-20 shrink-0 rounded-full shadow-[0_1px_14px_rgba(0,0,0,0.25)] outline outline-[1.5px] outline-white/50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={BUSINESS.avatar} alt="" className="size-full rounded-full object-cover" />
      </span>
      <span className="relative max-w-full rounded-full border border-transparent px-4 py-1 [background:linear-gradient(#fff,#fff)_padding-box,var(--brand-grad)_border-box]">
        <span className="block truncate font-display text-[20px] font-medium leading-[normal] text-[#1c1c1c]">{name}</span>
      </span>
    </div>
  );
}

function Headline({ children }: { children: ReactNode }) {
  return <h1 className="w-full text-center font-display text-[30px] !font-extrabold uppercase !leading-[26px] !tracking-[-0.5px] text-[#474747]">{children}</h1>;
}

/* a DM from the business: their avatar and a grey bubble with a tucked bottom-left corner */
function Bubble({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-end gap-2.5 px-5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={BUSINESS.avatar} alt="" width={32} height={32} className="size-8 shrink-0 rounded-full object-cover" />
      <p className="min-w-0 flex-1 rounded-[16px] rounded-bl-[4px] bg-[#eef2f5] py-2.5 pl-2.5 pr-[11px] font-[-apple-system,'SF_Pro','SF_Pro_Text','Helvetica_Neue',Inter,sans-serif] text-[14px] leading-[16.7px] tracking-[-0.3px] text-[#0f1316]">
        {children}
      </p>
    </div>
  );
}

/*
  One burst of confetti from behind the business's photo as the thank-you screen opens.
  Seeded, so every visit throws the same burst.
*/
const CONFETTI_COLORS = ["#6b4ef0", "#9b87ff", "#22b07d", "#ffc94d", "#ff7aa8", "#4cc3ff"];
const CONFETTI = (() => {
  let s = 7;
  const rnd = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  return Array.from({ length: 90 }, (_, i) => {
    const angle = (-165 + rnd() * 150) * (Math.PI / 180);
    const speed = 110 + rnd() * 190;
    const x = Math.cos(angle) * speed;
    return {
      x,
      up: Math.sin(angle) * speed,
      drift: x * 0.35 + (rnd() - 0.5) * 90,
      fall: 520 + rnd() * 260,
      spin: (rnd() - 0.5) * 720,
      flip: 360 * (2 + Math.round(rnd() * 3)),
      w: 5 + rnd() * 4,
      h: 8 + rnd() * 6,
      round: rnd() < 0.3,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      duration: 2.6 + rnd() * 1.4,
      delay: 0.25 + rnd() * 0.2,
    };
  });
})();

function Confetti() {
  if (useReducedMotion()) return null;
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      {CONFETTI.map((p, i) => (
        <motion.span
          key={i}
          className="absolute left-1/2 top-[190px]"
          style={{ width: p.w, height: p.round ? p.w : p.h, marginLeft: -p.w / 2, background: p.color, borderRadius: p.round ? "50%" : 1.5 }}
          initial={{ x: 0, y: 0, rotate: 0, rotateY: 0, opacity: 0 }}
          animate={{ x: [0, p.x, p.x + p.drift], y: [0, p.up, p.fall], rotate: p.spin, rotateY: p.flip, opacity: [0, 1, 1, 0] }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            x: { duration: p.duration, delay: p.delay, times: [0, 0.22, 1], ease: ["easeOut", "linear"] },
            y: { duration: p.duration, delay: p.delay, times: [0, 0.22, 1], ease: ["easeOut", "easeIn"] },
            opacity: { duration: p.duration, delay: p.delay, times: [0, 0.04, 0.75, 1] },
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}

/* ---------- pieces ---------- */

type Bind = { d: Draft; set: <K extends keyof Draft>(k: K, v: Draft[K]) => void };

/* the Figma flow's palette (Design Labs 15596:53212): one accent (#7a5cfa), hairline borders (#e3e3e3), two greys of text */
// outlined fields like the option cards: white with a hairline at rest, pale violet with the accent border while typing; 17px so Safari never zooms
const field = "h-[52px] w-full rounded-[12px] border border-[#e3e3e3] bg-white px-4 text-[17px] text-[#1c1c1c] outline-none transition-[background-color,border-color] duration-200 focus:border-[#7a5cfa] focus:bg-[#fcf9ff]";
/* the wrapper version, for a field with an icon or prefix inside it */
const fieldWithin = "focus-within:border-[#7a5cfa] focus-within:bg-[#fcf9ff]";
/* an option card: hairline at rest; picked, it takes the accent border, a violet wash and violet title */
const card = (on: boolean) =>
  `rounded-[12px] border transition-[background-color,border-color,color] duration-200 ${on ? "border-[#7a5cfa] bg-[#fcf9ff]" : "border-[#e3e3e3] bg-white hover:border-[#cfcfcf]"}`;
/* a small label over a group of choices, with an optional line under it */
function Label({ children, sub, className = "" }: { children: ReactNode; sub?: string; className?: string }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div className="text-[14px] font-semibold text-[#1c1c1c]">{children}</div>
      {sub && <p className="text-[12px] text-[#717171]">{sub}</p>}
    </div>
  );
}

/* the one column everything sits in: the phone's width on a phone, a little wider and centred on a laptop */
const COLUMN = "mx-auto w-full max-w-[440px] sm:max-w-[560px]";
/* where the opener's and thank-you's button lives: pinned within thumb reach on a phone, right under the content on a laptop */
const DOCK = "sticky bottom-0 z-20 mt-auto px-5 pt-6 sm:static sm:mt-12 sm:px-6 sm:pb-16";

/* every full-width call to action, sized and coloured like the opener's "Let's go" */
const CTA = "relative flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-[#7a5cfa] px-4 text-center text-[16px] font-medium leading-[normal] text-white transition-[background-color,transform] duration-200 hover:bg-[#6c4ef0] active:scale-[0.985] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[#b9a8ff]";

function Enter({ i, children, className = "" }: { i: number; children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE, delay: 0.1 + i * 0.08 }}>
      {children}
    </motion.div>
  );
}

function Title({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <>
      <h1 className="!font-sans text-[26px] !font-bold !leading-[normal] !tracking-normal !text-wrap text-[#15171c] sm:text-[32px]">{children}</h1>
      {sub && <p className="mt-2 text-[14px] leading-[1.4] text-[#717171]">{sub}</p>}
    </>
  );
}

function Input({
  label,
  value,
  onChange,
  invalid = false,
  className = "",
  autoFocus,
  ...rest
}: { label: string; value: string; onChange: (v: string) => void; invalid?: boolean; className?: string } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "className">) {
  const id = useId();
  const focus = useContext(AutoFocus) && autoFocus;
  // the label sits in the field like a placeholder, then floats up once there's text or focus
  return (
    <div className={`relative ${className}`}>
      <input
        id={id}
        placeholder=" "
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={invalid || undefined}
        autoFocus={focus}
        className={`${field} peer h-[58px] pb-1.5 pt-5 ${invalid ? "!border-[#e5536f]" : ""}`}
        {...rest}
      />
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[17px] text-[#aaa] transition-all duration-200 peer-focus:top-[17px] peer-focus:text-[12.5px] peer-[:not(:placeholder-shown)]:top-[17px] peer-[:not(:placeholder-shown)]:text-[12.5px]"
      >
        {label}
      </label>
    </div>
  );
}

function Area({ label, hint, value, onChange, placeholder, autoFocus, className = "" }: { label: string; hint?: string; value: string; onChange: (v: string) => void; placeholder?: string; autoFocus?: boolean; className?: string }) {
  const id = useId();
  const focus = useContext(AutoFocus) && autoFocus;
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="block text-[14px] font-semibold text-[#1c1c1c]">
          {label}
        </label>
      )}
      {hint && <p className="mt-1 text-[12px] leading-snug text-[#717171]">{hint}</p>}
      <textarea
        id={id}
        aria-label={label || placeholder}
        autoFocus={focus}
        rows={4}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${field} ${label ? "mt-3" : ""} block h-auto min-h-[128px] resize-none py-3.5 text-[16px] leading-snug placeholder:text-[#aaa]`}
      />
    </div>
  );
}

/* a chip, like the fee ranges: soft grey with a half-pixel hairline, the accent outline once picked */
function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      onClick={onClick}
      className={`inline-flex h-[34px] items-center justify-center rounded-[8px] px-2.5 text-[14px] font-medium transition-[background-color,border-color,color] duration-200 ${
        on ? "border border-[#7a5cfa] bg-[#fefdff] text-[#7a5cfa]" : "border-[0.5px] border-[#e3e3e3] bg-[#f7f7f7] text-[#717171] hover:text-[#1c1c1c]"
      }`}
    >
      {children}
    </button>
  );
}

/* a full-width option card: bold title (with an optional badge), a line of detail, an icon on the right */
function Option({ on, onClick, title, badge, icon: Icon, children, role = "radio" }: { on: boolean; onClick: () => void; title: ReactNode; badge?: string; icon?: RemixiconComponentType; children?: ReactNode; role?: "radio" | "checkbox" }) {
  return (
    <button type="button" role={role} aria-checked={on} onClick={onClick} className={`flex w-full items-center gap-2 p-4 text-left ${card(on)}`}>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex items-center gap-2">
          <span className={`text-[16px] font-bold transition-colors duration-200 ${on ? "text-[#7a5cfa]" : "text-[#1c1c1c]"}`}>{title}</span>
          {badge && <span className="inline-flex h-[21px] items-center rounded-full bg-[#dcff8b] px-2 text-[12px] font-medium text-[#0f4936]">{badge}</span>}
        </span>
        {children && <span className="text-[14px] leading-[normal] text-[#717171]">{children}</span>}
      </span>
      {Icon && <Icon size={24} className={`shrink-0 transition-colors duration-200 ${on ? "text-[#7a5cfa]" : "text-[#717171]"}`} aria-hidden="true" />}
    </button>
  );
}

/* the business's tip, on Benable's warm gradient: white text and an info icon */
function Note({ children }: { children: ReactNode }) {
  return (
    <div role="note" className="relative overflow-hidden rounded-[12px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/img/creator/note-gradient.png" alt="" className="pointer-events-none absolute left-0 top-[-46%] h-[292%] w-full max-w-none" aria-hidden="true" />
      <div className="absolute inset-0 bg-black/10 backdrop-blur-[14px]" aria-hidden="true" />
      <div className="relative flex items-center gap-2 p-4 text-[14px] leading-[normal] text-white">
        <RiInformationLine size={20} className="shrink-0" aria-hidden="true" />
        <p className="min-w-0 flex-1">{children}</p>
      </div>
    </div>
  );
}

function TopBar({ step, onBack, saved }: { step: [number, number, number]; onBack: () => void; saved: boolean }) {
  const [group, at, of] = step;
  // a native-feeling nav bar, built to Figma: back on the left, where they are in the middle, the business on the right, then four hairline segments
  return (
    <div className="sticky top-0 z-20 bg-white">
      <div className="relative mx-auto flex h-[52px] w-full max-w-[960px] items-center px-3 sm:h-16 sm:px-6">
        <button type="button" onClick={onBack} aria-label="Back" className="grid size-8 shrink-0 place-items-center rounded-full text-[#222] transition-colors hover:bg-[#f7f7f7] active:bg-[#f0f0f0]">
          <RiArrowLeftSLine size={20} aria-hidden="true" />
        </button>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center leading-[normal]" aria-label={`Step ${group + 1} of ${GROUPS.length}: ${GROUPS[group]}`}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={group} className="flex flex-col items-center gap-1" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2, ease: EASE }}>
              <div className="text-[14px] font-semibold text-[#222]">{GROUPS[group]}</div>
              <div className="text-[12px] font-medium text-[#aaa]">
                Step {group + 1} of {GROUPS.length}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="ml-auto flex items-center gap-2 pr-1 sm:pr-0">
          <span aria-live="polite" className={`text-[12px] font-medium text-[#aaa] transition-opacity duration-300 ${saved ? "opacity-100" : "opacity-0"}`}>
            {saved ? "Saved" : ""}
          </span>
          <span className="size-10 shrink-0 overflow-hidden rounded-full border border-[#ddd] bg-white p-px">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={BUSINESS.avatar} alt="" className="size-full rounded-full object-cover" />
          </span>
        </div>
      </div>
      <div className="mx-auto flex w-full max-w-[960px] gap-1.5 px-6 pb-[14px] pt-[14px] sm:px-8 sm:pb-4" aria-hidden="true">
        {GROUPS.map((g, i) => (
          <span key={g} className="h-[2px] flex-1 overflow-hidden rounded-full bg-[#ddd]">
            <motion.span className="block h-full rounded-[8px] bg-[#222]" initial={false} animate={{ width: i < group ? "100%" : i === group ? `${(at / of) * 100}%` : "0%" }} transition={{ duration: 0.5, ease: EASE }} />
          </span>
        ))}
      </div>
    </div>
  );
}

/* the steps' button: pinned to the bottom of the window on a phone and a laptop alike, on plain white. The questions
   scroll behind it, and only while something is under it does a thin grey line show along its top */
function Footer({ children }: { children: ReactNode }) {
  const [under, setUnder] = useState(false);
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // something is under the bar while the end of the questions sits below its top edge
    const check = () => {
      const end = document.getElementById("flow-end");
      if (end && bar.current) setUnder(end.getBoundingClientRect().top > bar.current.getBoundingClientRect().top + 0.5);
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    // the page also grows without a scroll (a step sliding in, the fee range opening)
    const ro = new ResizeObserver(check);
    ro.observe(document.body);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
      ro.disconnect();
    };
  }, []);
  return (
    <div ref={bar} className={`sticky bottom-0 z-20 mt-auto w-full border-t bg-white transition-colors duration-200 ${under ? "border-[#e3e3e3]" : "border-transparent"}`}>
      <div className={`${COLUMN} px-4 pb-[max(calc(16px+var(--lift,0px)),env(safe-area-inset-bottom))] pt-3 sm:px-6 sm:pb-6 sm:pt-4`}>{children}</div>
    </div>
  );
}

function Primary({ children, busy = false, hint = false, className = "", ...rest }: { children: ReactNode; busy?: boolean; hint?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...rest} aria-busy={busy || undefined} className={`${CTA} disabled:cursor-not-allowed disabled:bg-[#7a5cfa]/25 disabled:active:scale-100 ${busy ? "cursor-wait" : ""} ${className}`}>
      {busy && <span className="h-[18px] w-[18px] animate-spin rounded-full border-2 border-white/30 border-t-white motion-reduce:animate-none" aria-hidden="true" />}
      {children}
      {hint && <TapHint />}
    </button>
  );
}

/* the preview's "tap here": a fingertip press with a ring rippling out, like a screen recording's touch */
function TapHint() {
  return (
    <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 z-10 size-0">
      <motion.span
        className="absolute -left-6 -top-6 size-12 rounded-full border-2 border-white/80"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: [0.5, 1.5], opacity: [0.9, 0] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut", delay: 0.2 }}
      />
      <motion.span
        className="absolute -left-[13px] -top-[13px] size-[26px] rounded-full bg-white/45 shadow-[0_2px_8px_rgba(0,0,0,0.25)]"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [1, 0.82, 1], opacity: 1 }}
        transition={{ scale: { duration: 1.4, repeat: Infinity, ease: "easeInOut" }, opacity: { duration: 0.3 } }}
      />
    </span>
  );
}

/* the official Instagram app icon */
function IgGlyph() {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/img/instagram-logo.svg" alt="" width={28} height={28} className="block" />;
}
