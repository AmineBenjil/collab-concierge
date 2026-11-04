"use client";

import {
  RiArrowDownSLine,
  RiCalendarLine,
  RiCheckLine,
  RiFlashlightLine,
  RiPencilLine,
  RiSunLine,
  RiTimeLine,
  type RemixiconComponentType,
} from "@remixicon/react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { useControls } from "../controls";
import { BrandIcon } from "../Logo";
import { displayName } from "../names";
import { byNewest, CREATORS } from "./data";
import { useToast } from "./Shell";
import { recallEmail, rememberEmail, useHandle } from "./store";
import { EASE, Rise, SWITCH_TAB, SWITCH_TRACK, Thumb } from "./ui";

/* the Share page's pieces, so Settings reads as the same app: a grey stack of white panels, a quiet heading
   on each, and #fafafa wells with a half-pixel hairline inside them */
const STACK = "flex flex-col gap-1 overflow-hidden rounded-[24px] border border-[#ececf1] bg-[#f2f2f2]";
const PANEL = "bg-white px-5 py-5 sm:px-6";
/* Share's panel heading. These are h2s for screen readers, and the global h2 rule (bold, tight tracking, 1.05
   line height) is unlayered, so it beats plain utilities; the ! puts Share's plain-text values back */
const HEADING = "text-[14px] font-semibold! leading-snug! tracking-normal! [text-wrap:wrap]! text-[#1c1c1c] sm:leading-4!";
const WELL = "rounded-[20px] border-[0.5px] border-[#e3e3e3] bg-[#fafafa]";
/* the white secondary pill ("Copy reply") and the dark primary one ("Copy link") */
const SOFT_PILL = "rounded-full border-[0.5px] border-[#e3e3e3] bg-white text-[#1a1a1a] shadow-[0_4px_7px_rgba(0,0,0,0.08)]";
const DARK_PILL = "inline-flex h-[41px] shrink-0 items-center justify-center gap-2 rounded-full bg-[#111] pl-4 pr-6 text-[14px] font-semibold leading-[17px] text-white transition-[background-color,opacity] duration-200 hover:bg-black";

/*
  Settings: how often the business hears about collab requests, and the email it all goes to.
  The schedule (time and time zone; the weekly one goes out on Mondays) belongs to the digest you pick, so it lives with that choice
  instead of appearing as an extra row under the list. Three layouts of the same constants, switched
  from the control panel while they're compared:
    A  inline list: one well of options, the schedule opens inside the chosen row
    B  switch: the page's pill switch picks the rhythm, one sentence under it holds the schedule
    C  preview: three tiles pick the rhythm, an inbox preview shows what lands and when
*/

/* ---------- the preferences, kept per browser ---------- */

type Freq = "instant" | "daily" | "weekly";
type Prefs = { freq: Freq; hour: number; tz: string };

const PREFS_KEY = "cc:email-prefs";
const FALLBACK_TZ = "America/Los_Angeles";
const SERVER: Prefs = { freq: "instant", hour: 9, tz: FALLBACK_TZ };
/* the weekly digest always goes out on a Monday */
const DIGEST_DAY = 1;
const listeners = new Set<() => void>();
let cached: Prefs | null = null;

function detectTz() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || FALLBACK_TZ;
  } catch {
    return FALLBACK_TZ;
  }
}

function readPrefs(): Prefs {
  if (cached) return cached;
  let saved: Partial<Prefs> = {};
  try {
    saved = JSON.parse(localStorage.getItem(PREFS_KEY) ?? "{}");
  } catch {}
  cached = {
    freq: saved.freq === "daily" || saved.freq === "weekly" ? saved.freq : "instant",
    hour: typeof saved.hour === "number" ? saved.hour : 9,
    tz: typeof saved.tz === "string" ? saved.tz : detectTz(),
  };
  return cached;
}

function writePrefs(patch: Partial<Prefs>) {
  cached = { ...readPrefs(), ...patch };
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(cached));
  } catch {}
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
const noop = () => () => {};

/* ---------- times, days and zones in the words people use ---------- */

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const HOURS = Array.from({ length: 15 }, (_, i) => i + 6); // 6:00 AM to 8:00 PM
const hourLabel = (h: number) => `${((h + 11) % 12) + 1}:00 ${h < 12 ? "AM" : "PM"}`;
const city = (tz: string) => tz.split("/").pop()!.replace(/_/g, " ");
/* "Central Time (Chicago)": the zone's everyday name, then the city that pins it down */
function zoneLabel(tz: string) {
  try {
    const name = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "longGeneric" }).formatToParts(new Date()).find((p) => p.type === "timeZoneName")?.value;
    if (name && !name.startsWith("GMT")) return `${name} (${city(tz)})`;
  } catch {}
  return `${city(tz)} time`;
}
const zones = (mine: string) => [...new Set([mine, detectTz(), "America/Los_Angeles", "America/Denver", "America/Chicago", "America/New_York", "Europe/London", "Europe/Paris"])];

/* the day and minute it is right now in that zone */
function nowIn(tz: string) {
  try {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short", hour: "numeric", minute: "numeric", hourCycle: "h23" }).formatToParts(new Date());
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "0";
    return { day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday")), minutes: Number(get("hour")) * 60 + Number(get("minute")) };
  } catch {
    const d = new Date();
    return { day: d.getDay(), minutes: d.getHours() * 60 + d.getMinutes() };
  }
}

/* "tomorrow at 9:00 AM": when the next digest goes out */
function nextDigest(p: Prefs) {
  const now = nowIn(p.tz);
  const at = p.hour * 60;
  let ahead: number;
  if (p.freq === "daily") ahead = now.minutes < at ? 0 : 1;
  else {
    ahead = (DIGEST_DAY - now.day + 7) % 7;
    if (ahead === 0 && now.minutes >= at) ahead = 7;
  }
  const when = ahead === 0 ? "today" : ahead === 1 ? "tomorrow" : ahead === 7 ? `next ${DAYS[DIGEST_DAY]}` : DAYS[DIGEST_DAY];
  return `${when} at ${hourLabel(p.hour)}`;
}

type Option = { id: Freq; title: string; short: string; icon: RemixiconComponentType };
const FREQS: Option[] = [
  { id: "instant", title: "Instant", short: "Each request", icon: RiFlashlightLine },
  { id: "daily", title: "Daily digest", short: "Once a day", icon: RiSunLine },
  { id: "weekly", title: "Weekly digest", short: "Once a week", icon: RiCalendarLine },
];

const hint = (f: Freq, p: Prefs) =>
  f === "instant"
    ? "An email for each request, as soon as it’s checked."
    : f === "daily"
      ? `One email at ${hourLabel(p.hour)} with the day’s new requests.`
      : `One email on ${DAYS[DIGEST_DAY]}s at ${hourLabel(p.hour)} with the week’s requests.`;

/* ---------- the page ---------- */

export default function Settings() {
  const handle = useHandle();
  const name = displayName(handle);
  const { settingsLook } = useControls();
  const prefs = useSyncExternalStore(subscribe, readPrefs, () => SERVER);
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  /* every change saves on the spot */
  const set = (patch: Partial<Prefs>) => writePrefs(patch);

  const Look = settingsLook === "b" ? SwitchLook : settingsLook === "c" ? PreviewLook : ListLook;

  return (
    <main className="relative mx-auto w-full max-w-[600px] px-5 pb-28 pt-[96px] sm:pt-[112px]">
      <Rise i={0}>
        <h1 className="dash-title">Settings</h1>
      </Rise>

      {/* the same title, spacing and grey stack as the Share page */}
      <Rise i={1} className="mt-6">
        <div className={STACK}>
          <section aria-labelledby="settings-emails" className={PANEL}>
            <h2 id="settings-emails" className={HEADING}>
              How often we email you about new collab requests
            </h2>
            <div className="mt-3">
              <Look prefs={prefs} set={set} mounted={mounted} name={name} />
            </div>
          </section>
          <section aria-labelledby="settings-email" className={PANEL}>
            <EmailPanel handle={handle} />
          </section>
        </div>
      </Rise>
    </main>
  );
}

type LookProps = { prefs: Prefs; set: (p: Partial<Prefs>) => void; mounted: boolean; name: string };

/* ---------- A: one list, the schedule inside the chosen row ---------- */

function ListLook({ prefs, set, mounted }: LookProps) {
  return (
    <>
      <div role="radiogroup" aria-labelledby="settings-emails" className={`overflow-hidden ${WELL}`}>
        {FREQS.map((f, i) => {
          const on = prefs.freq === f.id;
          return (
            <div key={f.id} className={`transition-colors duration-200 ${i < FREQS.length - 1 ? "border-b-[0.5px] border-[#e3e3e3]" : ""} ${on ? "bg-lilac" : ""}`}>
              <button
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => set({ freq: f.id })}
                className={`flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition-colors duration-200 ${on ? "" : "hover:bg-[#f4f4f6]"}`}
              >
                <Tile icon={f.icon} on={on} />
                <span className="min-w-0 flex-1 leading-snug">
                  <span className="block text-[15px] font-semibold text-ink">{f.title}</span>
                  <span className="block text-[13px] text-muted">{hint(f.id, prefs)}</span>
                </span>
                <Radio on={on} />
              </button>
              {/* the schedule opens under the text it changes, inside the same row */}
              <AnimatePresence initial={false}>
                {on && f.id !== "instant" && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: EASE }} className="overflow-hidden">
                    {/* the hour, then the zone taking the rest of the row: from where the text starts to the row's
                        right padding. Phones start under the icon instead, so the zone name has room */}
                    <div className="flex flex-wrap items-center gap-2 pb-4 pl-4 pr-4 pt-0.5 sm:pl-[70px]">
                      <TimePick value={prefs.hour} onChange={(hour) => set({ hour })} />
                      <ZonePick value={prefs.tz} onChange={(tz) => set({ tz })} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
      <Next prefs={prefs} mounted={mounted} />
    </>
  );
}

/* ---------- B: the pill switch picks the rhythm, one sentence holds the schedule ---------- */

function SwitchLook({ prefs, set, mounted }: LookProps) {
  return (
    <>
      <div role="radiogroup" aria-labelledby="settings-emails" className={SWITCH_TRACK}>
        <Thumb selected={prefs.freq} />
        {FREQS.map((f) => {
          const on = prefs.freq === f.id;
          const I = f.icon;
          return (
            <button
              key={f.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => set({ freq: f.id })}
              className={`${SWITCH_TAB} flex flex-1 basis-0 items-center justify-center gap-1.5 px-2 ${on ? "text-ink" : "text-muted hover:text-ink"}`}
            >
              <I size={16} aria-hidden="true" className={`relative transition-colors duration-200 ${on ? "text-[#7a5cfa]" : ""}`} />
              <span className="relative">{f.id === "instant" ? "Instant" : f.id === "daily" ? "Daily" : "Weekly"}</span>
            </button>
          );
        })}
      </div>
      {/* the sentence says what you'll get; its blanks are the controls */}
      <div className={`mt-3 flex min-h-[76px] flex-wrap items-center gap-x-2 gap-y-2 px-4 py-3.5 text-[15px] leading-[36px] text-ink ${WELL}`}>
        {prefs.freq === "instant" ? (
          <span className="leading-snug">We’ll email you about each request as soon as your Concierge has checked it.</span>
        ) : (
          <>
            <span>We’ll email you every</span>
            <span>{prefs.freq === "weekly" ? DAYS[DIGEST_DAY] : "day"} at</span>
            <TimePick value={prefs.hour} onChange={(hour) => set({ hour })} />
            <ZonePick value={prefs.tz} onChange={(tz) => set({ tz })} />
          </>
        )}
      </div>
      <Next prefs={prefs} mounted={mounted} />
    </>
  );
}

/* ---------- C: tiles pick the rhythm, an inbox preview shows what lands and when ---------- */

function PreviewLook({ prefs, set, mounted, name }: LookProps) {
  return (
    <>
      <div role="radiogroup" aria-labelledby="settings-emails" className="grid grid-cols-3 gap-2">
        {FREQS.map((f) => {
          const on = prefs.freq === f.id;
          const I = f.icon;
          return (
            <button
              key={f.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => set({ freq: f.id })}
              className={`flex flex-col items-start gap-3 rounded-[20px] border-[0.5px] p-3.5 text-left transition-[background-color,border-color,box-shadow] duration-200 sm:p-4 ${
                on ? "border-[#7a5cfa] bg-lilac shadow-[inset_0_0_0_1px_#7a5cfa]" : "border-[#e3e3e3] bg-[#fafafa] hover:bg-[#f4f4f6]"
              }`}
            >
              <span className={`grid size-9 place-items-center rounded-full bg-white transition-colors duration-200 ${on ? "text-[#7a5cfa]" : "text-ink-2"}`}>
                <I size={18} aria-hidden="true" />
              </span>
              <span className="leading-snug">
                <span className="block text-[15px] font-semibold text-ink">{f.id === "instant" ? "Instant" : f.id === "daily" ? "Daily" : "Weekly"}</span>
                <span className="block text-[13px] text-muted">{f.short}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* the schedule, only where there is one; the row keeps its place so the preview doesn't jump */}
      <div className="mt-3 flex min-h-[36px] flex-wrap items-center gap-2">
        {prefs.freq === "instant" ? (
          <p className="text-[13px] text-muted">Arrives as soon as your Concierge has checked the request.</p>
        ) : (
          <>
            <span className="mr-1 text-[13px] font-semibold text-ink-2">Arrives{prefs.freq === "weekly" ? ` ${DAYS[DIGEST_DAY]}s` : ""}</span>
            <TimePick value={prefs.hour} onChange={(hour) => set({ hour })} />
            <ZonePick value={prefs.tz} onChange={(tz) => set({ tz })} />
          </>
        )}
      </div>

      <InboxPreview prefs={prefs} mounted={mounted} name={name} />
    </>
  );
}

/* what lands in the inbox, built from the real requests so it reads like the email will */
function InboxPreview({ prefs, mounted, name }: { prefs: Prefs; mounted: boolean; name: string }) {
  const newest = [...CREATORS].sort(byNewest);
  const strong = newest.filter((c) => c.fit === "strong");
  const batch = prefs.freq === "daily" ? newest.slice(0, 4) : newest;
  const first = newest[0];
  const mail =
    prefs.freq === "instant"
      ? { when: "Just now", subject: `${first.name} wants to collab with ${name}`, body: `Strong fit · ${first.proposal.create}`, people: [first] }
      : {
          when: prefs.freq === "daily" ? hourLabel(prefs.hour) : `${DAYS[DIGEST_DAY].slice(0, 3)} ${hourLabel(prefs.hour)}`,
          subject: prefs.freq === "daily" ? `${batch.length} new collab requests for ${name}` : `This week: ${batch.length} collab requests for ${name}`,
          body: `${batch[0].name}, ${batch[1].name} and ${batch.length - 2} more. ${batch.filter((c) => c.fit === "strong").length || strong.length} are a strong fit.`,
          people: batch.slice(0, 3),
        };

  return (
    <div className="mt-5">
      <p className="mb-3 text-[14px] font-semibold leading-4 text-[#1c1c1c]">In your inbox</p>
      <div className={`p-[11.5px] ${WELL}`}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${prefs.freq}-${prefs.hour}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="flex gap-3 rounded-[16px] border-[0.5px] border-[#e3e3e3] bg-white p-3.5"
          >
            <BrandIcon size={36} className="shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate text-[13px] font-semibold text-ink">Collab Concierge</span>
                <span className="shrink-0 text-[12px] tabular-nums text-muted">{mail.when}</span>
              </div>
              <p className="mt-0.5 truncate text-[14.5px] font-semibold text-ink">{mail.subject}</p>
              <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-muted">{mail.body}</p>
              <div className="mt-2.5 flex -space-x-2">
                {mail.people.map((c) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={c.id} src={c.avatar} alt="" className="size-6 rounded-full object-cover ring-2 ring-white" />
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      <Next prefs={prefs} mounted={mounted} />
    </div>
  );
}

/* ---------- shared pieces ---------- */

/* the consequence, before you leave: when the next digest goes out, and that quiet days are skipped */
function Next({ prefs, mounted }: { prefs: Prefs; mounted: boolean }) {
  if (prefs.freq === "instant") return null;
  return (
    <p className="mt-3 flex items-center gap-1.5 text-[13px] text-muted">
      <RiTimeLine size={15} aria-hidden="true" className="shrink-0" />
      <span>
        Next one goes out {mounted ? <span className="font-semibold text-ink-2">{nextDigest(prefs)}</span> : "soon"}. We skip it when nothing’s new.
      </span>
    </p>
  );
}

function Tile({ icon: I, on }: { icon: RemixiconComponentType; on: boolean }) {
  return (
    <span className={`grid size-10 shrink-0 place-items-center rounded-full bg-white transition-colors duration-200 ${on ? "text-[#7a5cfa]" : "text-ink-2"}`}>
      <I size={20} aria-hidden="true" />
    </span>
  );
}

const Radio = ({ on }: { on: boolean }) => (
  <span
    aria-hidden="true"
    className={`size-4 shrink-0 rounded-full bg-white transition-[box-shadow] duration-200 ${on ? "shadow-[inset_0_0_0_5px_#7a5cfa]" : "shadow-[inset_0_0_0_1.5px_#c6c6c6]"}`}
  />
);

/*
  A white pill over a native select, so the menu, keyboard and screen readers all work as usual. The pill and
  its focus ring live on the wrapper and the ring is drawn inside it: a ring outside got cut off by the row's
  open animation, which clips, and the browser squared it off while the menu was open. The select itself turns
  the global focus outline off (outline-none!), so the pill's stroke is the only focus mark.
*/
function SelectPill<T extends string | number>({
  label,
  value,
  options,
  onChange,
  grow = false,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  /* take the rest of the row, the chevron pinned to the far end; under 200px it drops to a line of its own */
  grow?: boolean;
}) {
  return (
    <label
      className={`relative inline-flex h-9 cursor-pointer ${grow ? "min-w-[200px] flex-1" : "shrink-0"} transition-[background-color,border-color,box-shadow] duration-200 hover:bg-[#fafafa] focus-within:border-[#8f7cf7] focus-within:shadow-[inset_0_0_0_1.5px_#8f7cf7,0_4px_7px_rgba(0,0,0,0.08)] ${SOFT_PILL}`}
    >
      <span className="sr-only">{label}</span>
      <select
        value={String(value)}
        onChange={(e) => onChange(options.find((o) => String(o.value) === e.target.value)!.value)}
        className={`h-full cursor-pointer appearance-none truncate rounded-full bg-transparent pl-3.5 pr-8 text-[14px] font-semibold text-[#1a1a1a] outline-none! ${grow ? "w-full" : ""}`}
      >
        {options.map((o) => (
          <option key={String(o.value)} value={String(o.value)}>
            {o.label}
          </option>
        ))}
      </select>
      <RiArrowDownSLine size={16} aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
    </label>
  );
}

const TimePick = ({ value, onChange }: { value: number; onChange: (h: number) => void }) => (
  <SelectPill label="Time" value={value} options={HOURS.map((h) => ({ value: h, label: hourLabel(h) }))} onChange={onChange} />
);

const ZonePick = ({ value, onChange }: { value: string; onChange: (tz: string) => void }) => (
  <SelectPill label="Time zone" value={value} options={zones(value).map((z) => ({ value: z, label: zoneLabel(z) }))} onChange={onChange} grow />
);

/* ---------- the account email, laid out like "Your link" ---------- */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function EmailPanel({ handle }: { handle: string }) {
  const say = useToast();
  const id = useId();
  const remembered = useSyncExternalStore(noop, () => recallEmail(), () => null);
  const [changed, setChanged] = useState<string | null>(null);
  const email = changed ?? remembered ?? `hello@${handle.replace(/[^a-z0-9]/gi, "")}.com`;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) input.current?.select();
  }, [editing]);

  const save = (e: FormEvent) => {
    e.preventDefault();
    const next = draft.trim();
    if (!EMAIL.test(next)) return setError("That doesn’t look like an email address.");
    rememberEmail(next);
    setChanged(next);
    setEditing(false);
    say(`Requests and sign-in links now go to ${next}.`);
  };

  /* the pill from "Your link": the value on the left, its one action on the right; phones stack the button */
  const pill = "mt-3 flex flex-col gap-1.5 rounded-[24px] border-[0.5px] p-1.5 transition-[border-color,box-shadow,background-color] duration-200 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:rounded-full sm:p-[5.5px] sm:pl-[23.5px]";

  return (
    <>
      <h2 id="settings-email" className={HEADING}>
        {editing ? <label htmlFor={id}>Your new email</label> : "Your email"}
      </h2>
      {editing ? (
        <form onSubmit={save} noValidate>
          <div
            className={`${pill} ${
              error ? "border-[#c23a56] bg-white" : "border-transparent bg-white shadow-[inset_0_0_0_2px_#8f7cf7,0_0_0_4px_rgba(143,124,247,0.14)]"
            }`}
          >
            <input
              ref={input}
              id={id}
              type="email"
              autoComplete="email"
              value={draft}
              aria-invalid={!!error}
              aria-describedby={error ? `${id}-error` : undefined}
              onChange={(e) => {
                setDraft(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => e.key === "Escape" && setEditing(false)}
              className="min-w-0 flex-1 bg-transparent px-3 py-2 text-[16px] font-semibold leading-[19px] text-ink outline-none sm:p-0"
            />
            <button type="submit" disabled={!draft.trim()} className={`${DARK_PILL} disabled:opacity-25`}>
              <RiCheckLine size={18} aria-hidden="true" />
              Save email
            </button>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <p id={`${id}-error`} className="text-[13px] text-[#c23a56]">
              {error}
            </p>
            <button type="button" onClick={() => setEditing(false)} className="shrink-0 text-[15px] font-semibold leading-5 text-ink-2 transition-colors hover:text-ink">
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className={`${pill} border-[#e3e3e3] bg-[#fafafa]`}>
            <span className="min-w-0 truncate px-3 py-2 text-[16px] font-semibold leading-[19px] text-ink sm:p-0">{email}</span>
            <button
              type="button"
              onClick={() => {
                setDraft(email);
                setError("");
                setEditing(true);
              }}
              className={DARK_PILL}
            >
              <RiPencilLine size={16} aria-hidden="true" />
              Change email
            </button>
          </div>
          {/* like "Test your link": one line under the pill, saying it's confirmed and what goes there */}
          <p className="mt-3 flex items-start gap-1.5 text-[13px] leading-snug text-muted">
            <RiCheckLine size={15} aria-hidden="true" className="mt-px shrink-0 text-[#178a60]" />
            <span>
              <span className="font-semibold text-[#178a60]">Confirmed.</span> Collab request emails and sign-in links go here.
            </span>
          </p>
        </>
      )}
    </>
  );
}
