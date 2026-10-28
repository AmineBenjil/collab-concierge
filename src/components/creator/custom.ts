"use client";

import { useSyncExternalStore } from "react";

/*
  What a business can change about its link (the Customize page): the welcome DM, its own questions
  (asked after ours) and the thank-you DM. Kept in localStorage per handle, so the creator page, the
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

export type Custom = { welcome: string; thanks: string; questions: Question[] };

export const DEFAULT_CUSTOM: Custom = {
  welcome: "So glad you reached out! Tell us about yourself and what you have in mind. We'll get back to you soon! 💜",
  thanks: "Thank you so much! We can’t wait to review and get back to you! 🙌",
  questions: [],
};

/* the creator flow's own steps, in order, as the business reads them */
export const ALWAYS_ASKED = [
  { step: "socials", label: "Their socials" },
  { step: "collab", label: "What they have in mind for the collab" },
  { step: "payment", label: "Whether they need payment" },
  { step: "audience", label: "Their audience and content" },
  { step: "based", label: "Where they're based" },
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
    if (raw) value = { ...DEFAULT_CUSTOM, ...JSON.parse(raw) };
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
