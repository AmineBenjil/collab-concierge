"use client";

import { useSyncExternalStore } from "react";

/*
  A/B switches for the control panel. Choices persist per browser (localStorage, guarded),
  and every component reading them updates together, including the creator flow inside the
  Customize page's phone (it hears other documents' writes through the storage event).
  The server always renders the defaults.
*/

export type HeroBg = "v1" | "v2";
/* step 4 of the creator flow: a local spot asks where they're based, a brand that ships asks for a shipping address */
export type AddressAsk = "local" | "shipping";

const HERO_KEY = "cc:hero-bg";
const ADDRESS_KEY = "cc:address-ask";
const listeners = new Set<() => void>();
const cache: { heroBg?: HeroBg; address?: AddressAsk } = {};

function get(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function put(key: string, v: string) {
  try {
    localStorage.setItem(key, v);
  } catch {}
  listeners.forEach((l) => l());
}

function setHeroBg(v: HeroBg) {
  cache.heroBg = v;
  put(HERO_KEY, v);
}

function setAddress(v: AddressAsk) {
  cache.address = v;
  put(ADDRESS_KEY, v);
}

function subscribe(l: () => void) {
  const fromElsewhere = (e: StorageEvent) => {
    if (e.key !== HERO_KEY && e.key !== ADDRESS_KEY) return;
    delete cache.heroBg;
    delete cache.address;
    l();
  };
  listeners.add(l);
  window.addEventListener("storage", fromElsewhere);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", fromElsewhere);
  };
}

export function useControls() {
  const heroBg = useSyncExternalStore(subscribe, () => (cache.heroBg ??= get(HERO_KEY) === "v2" ? "v2" : "v1"), () => "v1" as HeroBg);
  const address = useSyncExternalStore(subscribe, () => (cache.address ??= get(ADDRESS_KEY) === "shipping" ? "shipping" : "local"), () => "local" as AddressAsk);
  return { heroBg, setHeroBg, address, setAddress };
}
