"use client";

import {
  RiArrowDownSLine,
  RiCalendarLine,
  RiFlashlightLine,
  RiSunLine,
  RiTimeLine,
  type RemixiconComponentType,
} from "@remixicon/react";
import { AnimatePresence, motion } from "motion/react";
import { useSyncExternalStore } from "react";
import ChangeEmailPanel from "./change-email/ChangeEmail";
import { useHandle } from "./store";
import { EASE, Rise } from "./ui";

/* the Share page's pieces, so Settings reads as the same app: a grey stack of white panels, a quiet heading
   on each, and #fafafa wells with a half-pixel hairline inside them */
const STACK = "flex flex-col gap-1 overflow-hidden rounded-[24px] border border-[#ececf1] bg-[#f2f2f2]";
const PANEL = "bg-white px-5 py-5 sm:px-6";
/* Share's panel heading. These are h2s for screen readers, and the global h2 rule (bold, tight tracking, 1.05
   line height) is unlayered, so it beats plain utilities; the ! puts Share's plain-text values back */
const HEADING = "text-[16px] font-semibold! leading-[20px]! tracking-[-0.01em]! [text-wrap:wrap]! text-[#1c1c1c]";
const WELL = "rounded-[20px] border-[0.5px] border-[#e3e3e3] bg-[#fafafa]";
/* the white pill ("Copy reply") */
const SOFT_PILL = "rounded-full border-[0.5px] border-[#e3e3e3] bg-white text-[#1a1a1a] shadow-[0_4px_7px_rgba(0,0,0,0.08)]";

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

type Option = { id: Freq; title: string; icon: RemixiconComponentType };
const FREQS: Option[] = [
  { id: "instant", title: "Instant", icon: RiFlashlightLine },
  { id: "daily", title: "Daily digest", icon: RiSunLine },
  { id: "weekly", title: "Weekly digest", icon: RiCalendarLine },
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
  const prefs = useSyncExternalStore(subscribe, readPrefs, () => SERVER);
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  /* every change saves on the spot */
  const set = (patch: Partial<Prefs>) => writePrefs(patch);

  return (
    <main className="relative mx-auto w-full max-w-[600px] px-5 pb-28 pt-[96px] sm:pt-[112px]">
      <Rise i={0}>
        <h1 className="dash-title">Settings</h1>
      </Rise>

      {/* the same title, spacing and grey stack as the Share page */}
      <Rise i={1} className="mt-6">
        <div className={STACK}>
          <section aria-labelledby="settings-emails" aria-describedby="settings-emails-sub" className={PANEL}>
            <h2 id="settings-emails" className={HEADING}>
              Notifications
            </h2>
            <p id="settings-emails-sub" className="mt-1 text-[14px] leading-snug text-muted">
              How often we email you about new collab requests
            </p>
            <div className="mt-4">
              <ListLook prefs={prefs} set={set} mounted={mounted} />
            </div>
          </section>
          <section aria-labelledby="settings-email" className={PANEL}>
            <ChangeEmailPanel handle={handle} />
          </section>
        </div>
      </Rise>
    </main>
  );
}

type LookProps = { prefs: Prefs; set: (p: Partial<Prefs>) => void; mounted: boolean };

/* ---------- one list, the schedule inside the chosen row ---------- */

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
