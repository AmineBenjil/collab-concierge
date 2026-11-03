"use client";

import { useSyncExternalStore } from "react";

/*
  What a business can change on the Customize page: its Concierge's brief, plus what creators see on
  its link: the welcome DM, its own questions (asked after ours) and the thank-you DM. Kept in localStorage per handle, so the creator page, the
  phone preview's iframe and the editor all read the same copy, and other tabs hear about changes.
*/

export type Question = {
  id: string;
  title: string;
  sub: string;
  kind: "text" | "pick";
  answers: string[];
  other: boolean;
  multi: boolean;
};

/*
  The brief: what the Concierge knows about the business, one long note written however they like.
  Headings split it up (ours to start, theirs to rename, remove or add to), each with free text under
  it. Creators never see it; it lives here so the whole Customize page shares one copy.
*/
export type BriefSection = { id: string; heading: string; text: string };

export const BRIEF: BriefSection[] = [
  {
    id: "about",
    heading: "About us",
    text: "Kona Coffee is a neighborhood café in Los Angeles. We roast our own beans in small batches and pour them as espresso, pour-overs and cold brew.\nWe sell our beans by the bag in the café and online too.",
  },
  {
    id: "collabs",
    heading: "The collabs we want",
    text: "Gifted visits: a creator comes in, has coffee and pastries on us, and posts about it. A bag of beans to take home is the most we add.\nWe don't pay creator fees right now, apart from small UGC deals.",
  },
  {
    id: "who",
    heading: "Who to prioritize",
    text: "Creators with a real Los Angeles audience. Locals come in; followers in other cities don't.\nFood, coffee and lifestyle creators first. We'd host someone with 5,000 followers if the engagement is real.",
  },
  {
    id: "ugc",
    heading: "UGC",
    text: "Open to it. If someone makes great photos or videos of our drinks and gives us full usage rights, a gifted visit or a small fee (under $100) works.",
  },
  {
    id: "dealbreakers",
    heading: "Dealbreakers",
    text: "Bought followers, anything that wouldn't reflect well on us, or low-quality content.",
  },
];

export const newSection = (): BriefSection => ({ id: Math.random().toString(36).slice(2, 10), heading: "", text: "" });

/* gifted: a note on the payment question saying the business usually goes for gifted (unpaid) collabs */
export type Custom = { welcome: string; thanks: string; questions: Question[]; gifted: boolean; brief: BriefSection[] };

export const DEFAULT_CUSTOM: Custom = {
  welcome: "So glad you reached out! Tell us about yourself and what you have in mind. We'll get back to you soon! 💜",
  thanks: "Thank you so much! We can’t wait to review and get back to you! 🙌",
  questions: [],
  gifted: false,
  brief: BRIEF,
};

/* the creator flow's own steps, in order, as the business reads them */
export const ALWAYS_ASKED = [
  { step: "socials", label: "Their socials" },
  { step: "collab", label: "What they have in mind for the collab" },
  { step: "payment", label: "Whether they need payment" },
  { step: "audience", label: "Their audience and content" },
  { step: "based", label: "Their address" },
  { step: "contact", label: "How to reach them" },
] as const;
export type AskedStep = (typeof ALWAYS_ASKED)[number]["step"];

/* the "Other" choice, stored alongside the business's own answers */
export const OTHER = "__other";

export const newQuestion = (): Question => ({ id: Math.random().toString(36).slice(2, 10), title: "", sub: "", kind: "text", answers: ["", ""], other: false, multi: false });

/* one line under a question in the list: "Text answer" or "Pick one · 3 answers + Other" */
export function describe(q: Question) {
  if (q.kind === "text") return "Text answer";
  const n = q.answers.filter((a) => a.trim()).length;
  return `${q.multi ? "Pick any" : "Pick one"} · ${n} answers${q.other ? " + Other" : ""}`;
}

/* what the phone preview is showing; the Customize page sends it to the iframe with every change */
export type Screen =
  | { kind: "opener" }
  | { kind: "step"; step: AskedStep }
  | { kind: "custom"; question: Question; index: number; total: number }
  | { kind: "empty"; total: number }
  | { kind: "done" };
export type PreviewMessage = { type: "cc:customize"; custom: Custom; screen: Screen };
export const READY = "cc:customize-ready";

const key = (handle: string) => `cc:custom:${handle}`;
const listeners = new Set<() => void>();
const cache = new Map<string, { raw: string | null; value: Custom }>();

function read(handle: string): Custom {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(key(handle));
  } catch {}
  const hit = cache.get(handle);
  if (hit && hit.raw === raw) return hit.value;
  let value = DEFAULT_CUSTOM;
  try {
    if (raw) {
      const saved = JSON.parse(raw);
      /* briefs saved before it became one note kept a text per fixed heading; carry those texts over */
      const brief: BriefSection[] = Array.isArray(saved.brief)
        ? saved.brief
        : BRIEF.map((b) => ({ ...b, text: typeof saved.brief?.[b.id] === "string" ? saved.brief[b.id] : b.text }));
      value = { ...DEFAULT_CUSTOM, ...saved, brief };
    }
  } catch {}
  cache.set(handle, { raw, value });
  return value;
}

function subscribe(l: () => void) {
  listeners.add(l);
  window.addEventListener("storage", l);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", l);
  };
}

export function useCustom(handle: string) {
  return useSyncExternalStore(subscribe, () => read(handle), () => DEFAULT_CUSTOM);
}

export function saveCustom(handle: string, next: Custom) {
  try {
    localStorage.setItem(key(handle), JSON.stringify(next));
  } catch {
    cache.set(handle, { raw: null, value: next });
  }
  listeners.forEach((l) => l());
}
