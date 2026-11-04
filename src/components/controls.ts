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
/* the preview side of Customize: the lilac wash from the design, or plain white */
export type StageBg = "gradient" | "white";
/* which Settings layout is showing while the three are compared */
export type SettingsLook = "a" | "b" | "c";

const HERO_KEY = "cc:hero-bg";
const ADDRESS_KEY = "cc:address-ask";
const STAGE_KEY = "cc:stage-bg";
const SETTINGS_KEY = "cc:settings-look";
const KEYS = [HERO_KEY, ADDRESS_KEY, STAGE_KEY, SETTINGS_KEY];
const listeners = new Set<() => void>();
const cache: { heroBg?: HeroBg; address?: AddressAsk; stageBg?: StageBg; settingsLook?: SettingsLook } = {};

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

function setStageBg(v: StageBg) {
  cache.stageBg = v;
  put(STAGE_KEY, v);
}

function setSettingsLook(v: SettingsLook) {
  cache.settingsLook = v;
  put(SETTINGS_KEY, v);
}

function subscribe(l: () => void) {
  const fromElsewhere = (e: StorageEvent) => {
    if (!e.key || !KEYS.includes(e.key)) return;
    delete cache.heroBg;
    delete cache.address;
    delete cache.stageBg;
    delete cache.settingsLook;
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
  const stageBg = useSyncExternalStore(subscribe, () => (cache.stageBg ??= get(STAGE_KEY) === "white" ? "white" : "gradient"), () => "gradient" as StageBg);
  const settingsLook = useSyncExternalStore(
    subscribe,
    () => (cache.settingsLook ??= (["a", "b", "c"] as const).find((v) => v === get(SETTINGS_KEY)) ?? "a"),
    () => "a" as SettingsLook,
  );
  return { heroBg, setHeroBg, address, setAddress, stageBg, setStageBg, settingsLook, setSettingsLook };
}
