"use client";

import { useSyncExternalStore } from "react";

/*
  A/B switches for the control panel. Choices persist per browser (localStorage, guarded),
  and every component reading them updates together. The server always renders the defaults.
*/

export type HeroBg = "v1" | "v2";

const KEY = "cc:hero-bg";
const listeners = new Set<() => void>();
let current: HeroBg | null = null;

function read(): HeroBg {
  try {
    return localStorage.getItem(KEY) === "v2" ? "v2" : "v1";
  } catch {
    return "v1";
  }
}

function setHeroBg(v: HeroBg) {
  current = v;
  try {
    localStorage.setItem(KEY, v);
  } catch {}
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useControls() {
  const heroBg = useSyncExternalStore(subscribe, () => (current ??= read()), () => "v1" as HeroBg);
  return { heroBg, setHeroBg };
}
