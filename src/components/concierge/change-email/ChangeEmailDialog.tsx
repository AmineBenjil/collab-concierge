"use client";

import { RiMailCheckLine, RiMailCloseLine, type RemixiconComponentType } from "@remixicon/react";
import { motion, useReducedMotion } from "motion/react";
import { useId, useState, type FormEvent, type ReactNode } from "react";
import { useToast } from "../Shell";
import "./change-email.css";
import { COPY, mmss, TTL_LABEL, type ChangeEmail } from "./model";
import { AutoHeight, Spinner, Step, sendDisabled, stepKey, useSignIn } from "./shared";

/*
  The change-email dialog, built to the Figma frame "Design Labs › 15678:57989": a 445px white card with a
  lilac gradient header that fades to white, an 80px white circle holding the state's icon, a centred title
  and line under it, labelled 52px wells for the addresses, and two 52px buttons (grey Cancel, violet main).
  Every other step reuses those same pieces: the icon, the title, the line, which wells show and which
  buttons sit at the bottom change with the step; the frame, the gradient and the type stay put.
*/

/* no CSS border: the frame's 0.5px stroke is drawn on top of everything (see the end of the dialog), so the
   gradient runs right to the rounded edge instead of leaving the panel's white showing around it */
export const PANEL = "max-w-[445px] rounded-[24px]";

const ICON_INFO = "/img/change-email/info-12.svg";
const ICON_CLOSE = "/img/change-email/close-16.svg";

/* the design's 12px and 16px icons, drawn through a mask so they take the text colour around them */
function FigmaIcon({ src, size, className = "" }: { src: string; size: number; className?: string }) {
  const mask = `url(${src}) center / contain no-repeat`;
  return <span aria-hidden="true" className={`inline-block shrink-0 bg-current ${className}`} style={{ width: size, height: size, WebkitMask: mask, mask }} />;
}

export default function ChangeEmailDialog({ m, titleId }: { m: ChangeEmail; titleId: string }) {
  return (
    <div className="relative overflow-clip rounded-[24px] bg-white">
      {/* the gradient stays still while the steps change over it */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[253px] overflow-hidden max-sm:h-[290px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/change-email/bg.png" alt="" className="absolute left-[-1.46%] top-[-78.13%] h-[185.53%] w-[102.92%] max-w-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-white from-[4.688%] to-[rgba(255,255,255,0)] to-[129.47%]" />
      </div>
      <button
        type="button"
        onClick={m.close}
        disabled={m.phase === "sending"}
        aria-label="Close"
        className="absolute right-[9.5px] top-[9.5px] z-10 grid size-11 place-items-center rounded-full text-white transition-colors hover:bg-white/15 disabled:opacity-50"
      >
        <FigmaIcon src={ICON_CLOSE} size={16} />
      </button>
      <AutoHeight>
        <Step k={stepKey(m)}>
          <Body m={m} titleId={titleId} />
        </Step>
      </AutoHeight>
      {/* the design's #d5d5d5 hairline, as a translucent dark line over the content: the same grey on white,
          a slightly deeper lilac on the gradient, never a pale rim against the dark backdrop */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 rounded-[24px] shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.165)]" />
    </div>
  );
}

/* ---------- the steps ---------- */

function Body({ m, titleId }: { m: ChangeEmail; titleId: string }) {
  const signIn = useSignIn(m);
  switch (m.phase) {
    case "enter":
    case "sending":
      return <Enter m={m} titleId={titleId} />;

    case "sent":
      return (
        <>
          <Header icon="/img/change-email/email-sent.svg" titleId={titleId} title={COPY.sentTitle}>
            We sent a link to <b className="font-semibold text-[#1c1c1c]">{m.target}</b>. Open it to finish the switch. The link works for {TTL_LABEL}.
          </Header>
          <Fields>
            <Well label="New email" value={m.target} badge={<Badge tone="mint">Link sent</Badge>} helper={COPY.sentPill(m.account)} />
          </Fields>
          <Buttons>
            <button type="button" data-autofocus onClick={m.close} className={PRIMARY}>
              Got it
            </button>
          </Buttons>
          <Resend m={m} />
        </>
      );

    case "confirmed":
      return (
        <>
          <Header icon={RiMailCheckLine} titleId={titleId} title={COPY.confirmedTitle}>
            You’ll sign in with <b className="font-semibold text-[#1c1c1c]">{m.target}</b> from now on. New creator requests and campaign updates go there too.
          </Header>
          <Fields>
            <Well
              label="Sign-in email"
              value={m.target}
              badge={<Badge tone="mint">Confirmed</Badge>}
              helper={m.otherDevice ? `This browser isn’t signed in yet. We’ll send a sign-in link to ${m.target}.` : undefined}
            />
          </Fields>
          <Buttons>
            <button type="button" data-autofocus onClick={m.otherDevice ? signIn : m.close} className={PRIMARY}>
              {m.otherDevice ? "Sign in" : "Back to settings"}
            </button>
          </Buttons>
        </>
      );

    case "expired":
      return (
        <>
          <Header icon={RiMailCloseLine} titleId={titleId} title={COPY.expiredTitle}>
            Nothing changed. You’re still signed in as <b className="font-semibold text-[#1c1c1c]">{m.account}</b>.
          </Header>
          <Fields>
            <Well label="Current email" value={m.account} />
            {m.lastEmail && m.lastEmail !== m.account && <Well label="New email" value={m.lastEmail} struck badge={<Badge tone="rose">Link expired</Badge>} />}
          </Fields>
          <Buttons>
            <button type="button" onClick={m.keepCurrent} className={`${SECONDARY} grow`}>
              Keep my current email
            </button>
            <button type="button" data-autofocus onClick={m.sendNew} className={PRIMARY}>
              Send a new link
            </button>
          </Buttons>
        </>
      );

    case "used":
      return (
        <>
          <Header icon={RiMailCheckLine} titleId={titleId} title={COPY.usedTitle}>
            This link was already used. Here’s the address you sign in with now.
          </Header>
          <Fields>
            <Well label="Current email" value={m.account} />
          </Fields>
          <Buttons>
            <button type="button" data-autofocus onClick={m.close} className={PRIMARY}>
              Go to settings
            </button>
          </Buttons>
        </>
      );
  }
}

function Enter({ m, titleId }: { m: ChangeEmail; titleId: string }) {
  const id = useId();
  const sending = m.phase === "sending";
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!sendDisabled(m)) void m.send();
  };
  return (
    <form onSubmit={submit} noValidate>
      <Header icon="/img/change-email/email.svg" titleId={titleId} title={COPY.enterTitle}>
        You sign in with a link, so we’ll send one to the new address to make sure it’s yours.
      </Header>
      <Fields>
        <Well label="Current email" value={m.account} />
        <div className="flex flex-col gap-[11px]">
          <label htmlFor={id} className={LABEL}>
            New email
          </label>
          <div className="flex flex-col gap-2">
            <input
              id={id}
              data-autofocus
              type="email"
              inputMode="email"
              autoComplete="email"
              spellCheck={false}
              placeholder="Name@brand.com"
              value={m.draft}
              readOnly={sending}
              aria-invalid={!!m.error}
              aria-describedby={`${id}-msg`}
              onChange={(e) => m.edit(e.target.value)}
              onBlur={m.blur}
              className={`change-email-input h-[52px] w-full rounded-[12px] bg-[#fbfbfb] px-3 text-[14px] text-[#1c1c1c] caret-[#1c1c1c] outline-none transition-[box-shadow] duration-200 placeholder:text-[#aaa] read-only:text-[#717171] ${
                m.error ? "shadow-[inset_0_0_0_1px_#c23a56]" : "shadow-[inset_0_0_0_0.5px_#e3e3e3] focus:shadow-[inset_0_0_0_1px_#7a5cfa]"
              }`}
            />
            <Helper id={`${id}-msg`} error={m.error ? m.errorText : undefined}>
              Your current email keeps working until you open the link
            </Helper>
          </div>
        </div>
      </Fields>
      <Buttons>
        <button type="button" onClick={m.close} disabled={sending} className={`${SECONDARY} w-[107px]`}>
          Cancel
        </button>
        <button type="submit" disabled={sendDisabled(m)} className={PRIMARY}>
          {sending ? (
            <>
              <Spinner />
              Sending link
            </>
          ) : (
            "Send link"
          )}
        </button>
      </Buttons>
    </form>
  );
}

/* ---------- the frame's pieces ---------- */

const LABEL = "text-[16px] font-medium leading-[normal] text-[#1c1c1c]";
const BUTTON = "inline-flex h-[52px] items-center justify-center gap-2 rounded-[12px] px-4 text-[16px] font-medium leading-[normal] transition-[background-color,opacity,transform] duration-200 active:scale-[0.985] disabled:pointer-events-none";
const SECONDARY = `${BUTTON} shrink-0 whitespace-nowrap bg-[#f1f1f1]/80 text-[#1c1c1c] hover:bg-[#e8e8e8] disabled:opacity-50`;
const PRIMARY = `${BUTTON} flex-[1_0_150px] whitespace-nowrap bg-[#7a5cfa] text-white hover:bg-[#6c4ef0] disabled:opacity-40`;

/* the gradient header: the state's icon in its white circle, then the title and the line under it */
function Header({ icon, title, titleId, children }: { icon: string | RemixiconComponentType; title: string; titleId: string; children?: ReactNode }) {
  return (
    <div className="relative flex flex-col items-center px-8 pb-[22px] pt-[49px] text-center">
      <Badge80 icon={icon} />
      <h2 id={titleId} className="mt-[32px] text-[22px] font-semibold! leading-[25.3px]! tracking-[0.07px]! text-[#222]">
        {title}
      </h2>
      {children && <p className="mt-2 max-w-[373px] text-[15px] leading-[normal] text-[#717171]">{children}</p>}
    </div>
  );
}

/* the 80px white circle. A string is one of the design's own 56px envelopes (enter: purple with an info
   badge, sent: green with a check); the steps not drawn yet use Remix's mail icons in the enter purple,
   with the same pale disc behind the corner badge, so they read as one set */
function Badge80({ icon: I }: { icon: string | RemixiconComponentType }) {
  const reduce = useReducedMotion();
  return (
    <motion.span
      className="grid size-20 shrink-0 place-items-center rounded-[200px] bg-white shadow-[0px_4px_14px_0px_rgba(0,0,0,0.08)]"
      initial={reduce ? false : { scale: 0.9 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 380, damping: 24 }}
    >
      {typeof I === "string" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={I} alt="" width={56} height={56} />
      ) : (
        <span aria-hidden="true" className="relative size-14">
          <span className="absolute left-[30.3px] top-[27px] size-[23.3px] rounded-full bg-[#F7E7FF]" />
          <I size={56} className="relative text-[#CB5CFA]" />
        </span>
      )}
    </motion.span>
  );
}

const Fields = ({ children }: { children: ReactNode }) => <div className="flex flex-col gap-4 px-8 pt-4">{children}</div>;
/* side by side as in the design; when two long labels can't share a phone's width, the main one wraps
   above the other (wrap-reverse) and both take the full row */
const Buttons = ({ children }: { children: ReactNode }) => <div className="flex flex-wrap-reverse items-center gap-x-[18px] gap-y-3 px-8 pb-8 pt-[50px]">{children}</div>;

/* a read-only address, the same 52px well as the design's "Current email" */
function Well({ label, value, badge, helper, struck = false }: { label: string; value: string; badge?: ReactNode; helper?: string; struck?: boolean }) {
  return (
    <div className="flex flex-col gap-[11px]">
      <div className={LABEL}>{label}</div>
      <div className="flex flex-col gap-2">
        <div className="flex h-[52px] items-center gap-2 rounded-[12px] bg-[#fbfbfb] pl-3 pr-4 shadow-[inset_0_0_0_0.5px_#e3e3e3]">
          <span className={`min-w-0 flex-1 truncate text-[14px] leading-[normal] ${struck ? "text-[#aaa] line-through" : "text-[#1c1c1c]"}`}>{value}</span>
          {badge}
        </div>
        {helper && <Helper>{helper}</Helper>}
      </div>
    </div>
  );
}

/* the 12px info line under a field; an error takes its place in red, read out politely */
function Helper({ id, error, children }: { id?: string; error?: string; children: ReactNode }) {
  return (
    <div id={id} aria-live={id ? "polite" : undefined} className={`flex items-start gap-2 text-[12px] leading-[normal] ${error ? "text-[#c23a56]" : "text-[#717171]"}`}>
      <FigmaIcon src={ICON_INFO} size={12} className="mt-px" />
      <span className="min-w-0 flex-1">{error ?? children}</span>
    </div>
  );
}

const TONES = { violet: "bg-[#f3f0ff] text-[#6b4ef0]", mint: "bg-[#e6f6ef] text-[#178a60]", rose: "bg-[#fdecef] text-[#c23a56]" };
function Badge({ tone, children }: { tone: keyof typeof TONES; children: ReactNode }) {
  return <span className={`inline-flex h-6 shrink-0 items-center rounded-full px-2.5 text-[12px] font-medium ${TONES[tone]}`}>{children}</span>;
}

/* under the buttons in the sent step: "Didn't get it? Check spam, resend in 0:42 or use a different address." */
function Resend({ m }: { m: ChangeEmail }) {
  const say = useToast();
  const [busy, setBusy] = useState(false);
  const link =
    "relative font-medium text-[#1c1c1c] underline decoration-[#d5d5d5] underline-offset-[3px] transition-colors hover:decoration-[#1c1c1c] after:absolute after:-inset-x-1 after:-inset-y-3.5 after:content-['']";
  const resend = async () => {
    setBusy(true);
    const r = await m.resend();
    setBusy(false);
    if (r === true) say(`We sent a new link to ${m.target}.`);
    else if (r === "rate") say("Too many tries. Try again in a couple of minutes.");
    else say(COPY.errors.network());
  };
  return (
    <p className="-mt-4 px-8 pb-7 text-center text-[13px] leading-relaxed text-[#717171]">
      Didn’t get it? Check spam,{" "}
      {m.resendLeft > 0 ? (
        <>
          resend in <span className="font-medium tabular-nums text-[#1c1c1c]">{mmss(m.resendLeft)}</span>
        </>
      ) : (
        <button type="button" onClick={resend} disabled={busy} className={link}>
          {busy ? "resending…" : "resend"}
        </button>
      )}{" "}
      or{" "}
      <button type="button" onClick={() => m.begin(m.target)} className={link}>
        use a different address
      </button>
      .
    </p>
  );
}
