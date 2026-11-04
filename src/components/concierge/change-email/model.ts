"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { recallEmail, rememberEmail } from "../store";

/*
  Change email: sign-in is magic-link only, so a new address only takes over once someone opens the link
  sent to it. This file is the whole flow minus the pixels: a stand-in backend kept in localStorage (so a
  second tab opening the link is heard live in the first, like realtime would), and one hook that every
  layout of the modal reads.

  The real backend, when it exists:
    - store pending_email + token + expires_at on the account; swap the email only after the token checks out
    - a new request replaces the old token, so older links read as expired
    - after the swap, send a heads-up to the old address: "Your sign-in email was changed to {new}."
    - other sessions: ask Tony. Until then the current session stays signed in and nothing else is revoked.

  Test addresses for the stand-in: anything at taken.com is "linked to another account", anything at
  offline.com fails like a dropped connection, and a fourth send inside ten minutes is rate limited.
*/

export const TTL_MINUTES = 30;
export const TTL_LABEL = "30 minutes";
const RESEND_AFTER = 60_000;
const RATE_WINDOW = 10 * 60_000;
const RATE_MAX = 3;
const RATE_LOCK = 2 * 60_000;
const SEND_DELAY = 1100;

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type Phase = "enter" | "sending" | "sent" | "confirmed" | "expired" | "used";
export type ErrorKind = "invalid" | "same" | "taken" | "network" | "rate";
export type Pending = { email: string; token: string; expiresAt: number; sentAt: number; device: string };
type Server = { account: string | null; pending: Pending | null; issued: string[]; used: string[]; sends: number[]; lockedUntil: number };

/* ---------- the copy, word for word from the brief ---------- */

export const mmss = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

export const COPY = {
  rowHelper: "You sign in with a link sent to this address. No password needed.",
  enterTitle: "Change your sign-in email",
  enterHelper: "Your current email keeps working until you open the link.",
  sentTitle: "Check your inbox",
  sentBody: (next: string) => `We sent a link to ${next}. Open it to finish the switch. The link works for ${TTL_LABEL}.`,
  sentPill: (current: string) => `Still signed in as ${current} until you open it.`,
  confirmedTitle: "Email updated",
  confirmedBody: (next: string) => `You’ll sign in with ${next} from now on. New creator requests and campaign updates go there too.`,
  expiredTitle: "This link has expired",
  expiredBody: (current: string) => `Nothing changed. You’re still signed in as ${current}.`,
  usedTitle: "This email change is already done.",
  cancelled: "Email change cancelled.",
  errors: {
    invalid: () => "Enter a full email, like name@brand.com.",
    same: () => "That’s already your sign-in email.",
    taken: () => "This email is linked to another Benable account. Use a different one or contact support.",
    network: () => "Couldn’t send the link. Check your connection and try again.",
    rate: (left: number) => `Too many tries. Try again in ${mmss(left)}.`,
  } satisfies Record<ErrorKind, (left: number) => string>,
};

/* ---------- the stand-in backend ---------- */

const KEY = "cc:email-change";
const DEVICE_KEY = "cc:device";
const ACCOUNT_KEY = "cc:account-email";
const listeners = new Set<() => void>();
let cached: Server | null = null;
const EMPTY: Server = { account: null, pending: null, issued: [], used: [], sends: [], lockedUntil: 0 };

function read(): Server {
  if (cached) return cached;
  try {
    cached = { ...EMPTY, ...JSON.parse(localStorage.getItem(KEY) ?? "{}") };
  } catch {
    cached = { ...EMPTY };
  }
  try {
    cached!.account = localStorage.getItem(ACCOUNT_KEY);
  } catch {}
  return cached!;
}

function write(patch: Partial<Server>) {
  const next = { ...read(), ...patch };
  cached = next;
  try {
    const { account, ...rest } = next;
    localStorage.setItem(KEY, JSON.stringify(rest));
    if (account) localStorage.setItem(ACCOUNT_KEY, account);
    else localStorage.removeItem(ACCOUNT_KEY);
  } catch {}
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  const fromElsewhere = (e: StorageEvent) => {
    if (e.key !== KEY && e.key !== ACCOUNT_KEY && e.key !== null) return;
    cached = null;
    l();
  };
  listeners.add(l);
  window.addEventListener("storage", fromElsewhere);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", fromElsewhere);
  };
}

function device() {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) localStorage.setItem(DEVICE_KEY, (id = Math.random().toString(36).slice(2)));
    return id;
  } catch {
    return "this-device";
  }
}

const token = () => Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

type SendResult = { ok: true; pending: Pending } | { ok: false; error: ErrorKind; until?: number };

/* POST /account/email-change: validates, rate limits, stores the pending email and mails the link */
async function requestChange(email: string, current: string, opts: { delay?: number; from?: string } = {}): Promise<SendResult> {
  await wait(opts.delay ?? SEND_DELAY);
  const s = read();
  const now = Date.now();
  const domain = email.split("@")[1]?.toLowerCase();
  if (s.lockedUntil > now) return { ok: false, error: "rate", until: s.lockedUntil };
  if (email.toLowerCase() === current.toLowerCase()) return { ok: false, error: "same" };
  if (domain === "offline.com") return { ok: false, error: "network" };
  if (domain === "taken.com") return { ok: false, error: "taken" };
  const sends = s.sends.filter((t) => now - t < RATE_WINDOW);
  if (sends.length >= RATE_MAX) {
    write({ sends, lockedUntil: now + RATE_LOCK });
    return { ok: false, error: "rate", until: now + RATE_LOCK };
  }
  const pending: Pending = { email, token: token(), expiresAt: now + TTL_MINUTES * 60_000, sentAt: now, device: opts.from ?? device() };
  write({ pending, issued: [...s.issued, pending.token].slice(-20), sends: [...sends, now] });
  return { ok: true, pending };
}

export type Verified = { result: "confirmed" | "expired" | "used"; email: string; otherDevice: boolean };

/* GET /account/email-change/confirm?token=: the only place the email actually changes */
function verify(t: string): Verified {
  const s = read();
  const account = s.account ?? "";
  if (s.used.includes(t)) return { result: "used", email: account, otherDevice: false };
  const p = s.pending;
  /* unknown, replaced by a newer request, or past its time: all read as expired, and nothing changes */
  if (!p || p.token !== t || p.expiresAt < Date.now()) return { result: "expired", email: account, otherDevice: false };
  write({ account: p.email, pending: null, used: [...s.used, t].slice(-20) });
  rememberEmail(p.email);
  // heads-up to the old address; a real mailer goes here
  console.info(`[email] to ${account}: Your sign-in email was changed to ${p.email}.`);
  return { result: "confirmed", email: p.email, otherDevice: p.device !== device() };
}

function cancelChange() {
  write({ pending: null });
}

/* the link the email carries; it lands on Settings, which checks it and opens the result */
export const confirmUrl = (t: string) => `/settings?confirm=${encodeURIComponent(t)}`;

/* for the control panel: open the pending link in a new tab, run its clock out, or start over */
export const demo = {
  openLink() {
    const p = read().pending;
    if (p) window.open(confirmUrl(p.token), "_blank", "noopener");
    return !!p;
  },
  expireLink() {
    const p = read().pending;
    if (p) write({ pending: { ...p, expiresAt: Date.now() - 1 } });
    return !!p;
  },
  reset() {
    write({ ...EMPTY });
  },
};

/* ---------- the hook every layout reads ---------- */

export type QaState = "enter" | "sending" | "sent" | "confirmed" | "expired" | "used" | "other-device" | "invalid" | "same" | "taken" | "network" | "rate" | "pending";
export const QA_STATES: QaState[] = ["pending", "enter", "invalid", "same", "taken", "network", "rate", "sending", "sent", "confirmed", "other-device", "expired", "used"];
const SAMPLE = "maya@konacoffee.co";

const noop = () => () => {};

export function useChangeEmail(handle: string) {
  const server = useSyncExternalStore(subscribe, read, () => EMPTY);
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const fallback = (mounted ? recallEmail() : null) ?? `hello@${handle.replace(/[^a-z0-9]/gi, "")}.com`;
  const account = server.account ?? fallback;

  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("enter");
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<ErrorKind | null>(null);
  const [rateUntil, setRateUntil] = useState(0);
  /* the address this run of the modal is about: what was sent, or what was confirmed */
  const [target, setTarget] = useState("");
  const [otherDevice, setOtherDevice] = useState(false);
  const [now, setNow] = useState(0);
  const sentToken = useRef<string | null>(null);
  const run = useRef(0);

  /* the row only shows a change that can still go through; the expired step still knows where it was headed */
  const last = server.pending;
  const pending = last && (now === 0 || last.expiresAt > now) ? last : null;
  const resendLeft = pending ? pending.sentAt + RESEND_AFTER - now : 0;
  const rateLeft = Math.max(rateUntil, server.lockedUntil) - now;

  /* a clock while anything is counting down */
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    if (!(open && phase === "sent") && !(rateLeft > 0) && !pending) return;
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [open, phase, rateLeft > 0, pending]); // eslint-disable-line react-hooks/exhaustive-deps

  /* live in the open tab: the link was opened somewhere else and the account moved to what we sent */
  useEffect(() => {
    if (open && phase === "sent" && sentToken.current && server.used.includes(sentToken.current)) {
      setOtherDevice(false);
      setPhase("confirmed");
    }
  }, [open, phase, server.used]);

  const begin = useCallback((prefill = "") => {
    run.current++;
    setDraft(prefill);
    setError(null);
    setPhase("enter");
    setOpen(true);
  }, []);

  /* "Change email" from Settings. While a link is out and the resend countdown is still running, it reopens
     the same "Check your inbox" step instead of a blank form, so there's no way to fire off a second link
     early. Once the countdown is done, it opens the form again, empty. */
  const openChange = useCallback(() => {
    const p = read().pending;
    if (p && p.expiresAt > Date.now() && p.sentAt + RESEND_AFTER > Date.now()) {
      run.current++;
      sentToken.current = p.token;
      setTarget(p.email);
      setOtherDevice(false);
      setError(null);
      setNow(Date.now());
      setPhase("sent");
      setOpen(true);
      return;
    }
    begin();
  }, [begin]);

  const close = useCallback(() => {
    run.current++;
    setOpen(false);
  }, []);

  const send = useCallback(
    async (email = draft.trim()) => {
      if (!EMAIL_RE.test(email)) return setError("invalid");
      if (email.toLowerCase() === account.toLowerCase()) return setError("same");
      if (rateLeft > 0) return setError("rate");
      const mine = ++run.current;
      setError(null);
      setPhase("sending");
      const res = await requestChange(email, account);
      if (mine !== run.current) return;
      if (!res.ok) {
        if (res.until) setRateUntil(res.until);
        setError(res.error);
        setPhase("enter");
        return;
      }
      sentToken.current = res.pending.token;
      setTarget(email);
      setNow(Date.now());
      setPhase("sent");
    },
    [draft, account, rateLeft],
  );

  /* on leaving the field: only a full address counts, and only once they've stopped typing */
  const blur = useCallback(() => {
    const v = draft.trim();
    if (v && !EMAIL_RE.test(v)) setError("invalid");
  }, [draft]);

  const edit = useCallback((v: string) => {
    setDraft(v);
    setError((e) => (e === "rate" ? e : null));
  }, []);

  /* from the sent footer or the pending row: a fresh link to the same address (the old one stops working) */
  const resend = useCallback(async () => {
    const email = pending?.email ?? target;
    if (!email) return false;
    const res = await requestChange(email, account, { delay: 500 });
    if (res.ok) {
      sentToken.current = res.pending.token;
      setNow(Date.now());
      return true;
    }
    if (res.until) setRateUntil(res.until);
    return res.error;
  }, [pending, target, account]);

  const cancelPending = useCallback(() => {
    cancelChange();
    sentToken.current = null;
  }, []);

  /* expired: a new link to the address that was pending, or back to the form if nothing was */
  const sendNew = useCallback(() => {
    const email = last?.email ?? target;
    if (email && email.toLowerCase() !== account.toLowerCase()) {
      setDraft(email);
      void send(email);
    } else begin();
  }, [last, target, account, send, begin]);

  const keepCurrent = useCallback(() => {
    cancelChange();
    close();
  }, [close]);

  /* ?state= for QA: each one reached through the real flow, so the row and the modal agree */
  async function seed(s: QaState) {
    const current = read().account ?? fallback;
    const sample = current.toLowerCase() === SAMPLE ? "maya.k@konacoffee.co" : SAMPLE;
    const instant = { delay: 0 };
    const fresh = () => write({ sends: [], lockedUntil: 0 });
    fresh();
    setOtherDevice(false);
    switch (s) {
      case "pending":
        await requestChange(sample, current, instant);
        return;
      case "enter":
        return begin();
      case "invalid":
        begin("maya@konacoffee");
        return setError("invalid");
      case "same":
        begin(current);
        return setError("same");
      case "taken":
        begin("maya@taken.com");
        return setError("taken");
      case "network":
        begin(sample);
        return setError("network");
      case "rate": {
        const until = Date.now() + RATE_LOCK;
        write({ lockedUntil: until });
        setRateUntil(until);
        begin(sample);
        return setError("rate");
      }
      case "sending":
        run.current++;
        setDraft(sample);
        setPhase("sending");
        return setOpen(true);
      case "sent": {
        const r = await requestChange(sample, current, instant);
        if (!r.ok) return;
        sentToken.current = r.pending.token;
        setTarget(sample);
        setNow(Date.now());
        setPhase("sent");
        return setOpen(true);
      }
      case "confirmed":
      case "other-device":
      case "used":
      case "expired": {
        const r = await requestChange(sample, current, { delay: 0, from: s === "other-device" ? "another-browser" : undefined });
        if (!r.ok) return;
        if (s === "expired") write({ pending: { ...r.pending, expiresAt: Date.now() - 1 } });
        let v = verify(r.pending.token);
        if (s === "used") v = verify(r.pending.token);
        setTarget(v.email);
        setOtherDevice(v.otherDevice);
        setPhase(v.result);
        return setOpen(true);
      }
    }
  }

  /* the link lands here: /settings?confirm=<token>. Checked once, then the token leaves the address bar */
  function land() {
    const url = new URL(window.location.href);
    const t = url.searchParams.get("confirm");
    const qa = url.searchParams.get("state") as QaState | null;
    if (t) {
      url.searchParams.delete("confirm");
      window.history.replaceState(null, "", url);
      const v = verify(t);
      setTarget(v.email);
      setOtherDevice(v.otherDevice);
      setPhase(v.result);
      setOpen(true);
      return;
    }
    if (qa) void seed(qa);
  }

  const landed = useRef(false);
  useEffect(() => {
    if (!mounted || landed.current) return;
    landed.current = true;
    void Promise.resolve().then(land);
  }, [mounted]); // eslint-disable-line react-hooks/exhaustive-deps



  /* the rate-limit message counts down, then clears itself */
  const shown = error === "rate" && rateLeft <= 0 ? null : error;

  return {
    mounted,
    account,
    pending,
    lastEmail: last?.email ?? target,
    open,
    phase,
    draft,
    error: shown,
    errorText: shown ? COPY.errors[shown](rateLeft) : "",
    valid: EMAIL_RE.test(draft.trim()),
    rateLeft,
    resendLeft,
    target,
    otherDevice,
    begin,
    openChange,
    close,
    send,
    blur,
    edit,
    resend,
    cancelPending,
    sendNew,
    keepCurrent,
  };
}

export type ChangeEmail = ReturnType<typeof useChangeEmail>;
