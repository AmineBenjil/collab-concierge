"use client";

import { useSyncExternalStore } from "react";
import { cleanHandle } from "../names";
import { CREATORS, declineMessage, type Status } from "./data";

/*
  Client-only state for the business side of the demo. It lives at module level so it
  survives switching between Share and Dashboard (client navigation), and resets on reload.
*/

const noop = () => () => {};

/* the business's handle from ?handle=, read on the client so the pages themselves stay static */
export function useHandle() {
  const raw = useSyncExternalStore(
    noop,
    () => new URLSearchParams(window.location.search).get("handle") ?? "",
    () => "",
  );
  return cleanHandle(raw) || "foundcoffee";
}

/* ---------- each creator's status: new request, moving forward, declined ---------- */

type Statuses = Record<string, Status>;
const INITIAL: Statuses = Object.fromEntries(CREATORS.map((c) => [c.id, c.status]));
let statuses = INITIAL;
const listeners = new Set<() => void>();

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function setStatus(id: string, status: Status) {
  statuses = { ...statuses, [id]: status };
  listeners.forEach((l) => l());
}

export function useStatuses() {
  return useSyncExternalStore(subscribe, () => statuses, () => INITIAL);
}

/* ---------- which requests the business has opened, so tab badges can show what's new ---------- */

let seen: ReadonlySet<string> = new Set();
const NONE: ReadonlySet<string> = new Set();
const seenListeners = new Set<() => void>();

export function markSeen(id: string) {
  if (seen.has(id)) return;
  seen = new Set(seen).add(id);
  seenListeners.forEach((l) => l());
}

export function useSeen() {
  return useSyncExternalStore(
    (l) => {
      seenListeners.add(l);
      return () => seenListeners.delete(l);
    },
    () => seen,
    () => NONE,
  );
}

/* ---------- the business's decline message, edited once and reused for every creator ---------- */

let customDecline: string | null = null;
export const getDeclineMessage = (business: string) => customDecline ?? declineMessage(business);
export const saveDeclineMessage = (text: string) => {
  customDecline = text.trim() || null;
};

/* ---------- the email they activated with, shown in the account menu ---------- */

const EMAIL_KEY = "cc:email";
export function rememberEmail(email: string) {
  try {
    sessionStorage.setItem(EMAIL_KEY, email);
  } catch {}
}
export function recallEmail() {
  try {
    return sessionStorage.getItem(EMAIL_KEY);
  } catch {
    return null;
  }
}
