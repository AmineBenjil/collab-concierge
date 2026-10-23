"use client";

import { useSyncExternalStore } from "react";

/*
  The handle a business is typing into the hero. The phone mock listens so its inbox
  and link card turn into "your" Concierge while you type, like the real product.
*/

const listeners = new Set<() => void>();
let draft = "";

export function cleanHandle(raw: string) {
  return raw.trim().replace(/^@+/, "").replace(/\s+/g, "").toLowerCase();
}

/* "found.coffee" → "Found Coffee", "tony" → "Tony" */
export function displayName(handle: string) {
  return handle
    .split(/[._-]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

export function setDraftHandle(raw: string) {
  const next = cleanHandle(raw);
  if (next === draft) return;
  draft = next;
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/* the business shown in the phone: the typed handle, or the demo café */
export function usePhoneBrand() {
  const handle = useSyncExternalStore(subscribe, () => draft, () => "");
  return handle ? { handle, name: displayName(handle) } : { handle: "foundcoffee", name: "Found Coffee" };
}
