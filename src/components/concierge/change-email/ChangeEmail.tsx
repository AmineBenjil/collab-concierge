"use client";

import { RiTimeLine } from "@remixicon/react";
import { AnimatePresence, motion } from "motion/react";
import { useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useToast } from "../Shell";
import { EASE } from "../ui";
import ChangeEmailDialog, { PANEL } from "./ChangeEmailDialog";
import { COPY, useChangeEmail } from "./model";
import { Dialog, INLINE, SOFT_PILL } from "./shared";

/* Share's panel heading; the ! puts plain-text values back over the global h2 rule */
const HEADING = "text-[16px] font-semibold! leading-[20px]! tracking-[-0.01em]! [text-wrap:wrap]! text-[#1c1c1c]";

/*
  Settings → Account: the sign-in email as a read-only row (not an input) with "Change email" inside it,
  a pending change under it, and the modal.
*/
export default function ChangeEmailPanel({ handle }: { handle: string }) {
  const m = useChangeEmail(handle);
  const say = useToast();
  const trigger = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const [resending, setResending] = useState(false);

  const resend = async () => {
    setResending(true);
    const r = await m.resend();
    setResending(false);
    if (r === true) say(`We sent a new link to ${m.pending?.email}.`);
    else if (r === "rate") say("Too many tries. Try again in a couple of minutes.");
    else say(COPY.errors.network());
  };

  return (
    <>
      <h2 id="settings-email" className={HEADING}>
        Your sign-in email
      </h2>
      {/* the "Your link" pill, read-only: the address on the left, its one action on the right; phones stack */}
      <div className="mt-3 flex flex-col gap-1.5 rounded-[24px] border-[0.5px] border-[#e3e3e3] bg-[#fafafa] p-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:rounded-full sm:p-[5.5px] sm:pl-[23.5px]">
        <span className="min-w-0 truncate px-3 py-2 text-[16px] font-semibold leading-[19px] text-ink sm:p-0" suppressHydrationWarning>
          {m.account}
        </span>
        <button ref={trigger} type="button" onClick={m.openChange} aria-haspopup="dialog" className={SOFT_PILL}>
          Change email
        </button>
      </div>
      <p className="mt-3 text-[13px] leading-snug text-muted">{COPY.rowHelper}</p>
      <AnimatePresence initial={false}>
        {m.pending && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: EASE }} className="overflow-hidden">
            <p className="mt-2.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[13px] leading-snug text-ink-2">
              <RiTimeLine size={15} aria-hidden="true" className="shrink-0 text-[#7a5cfa]" />
              <span>
                Pending: <span className="font-semibold text-ink">{m.pending.email}</span>
              </span>
              <span aria-hidden="true" className="text-muted">·</span>
              <button type="button" onClick={resend} disabled={resending} className={INLINE}>
                {resending ? "Resending…" : "Resend"}
              </button>
              <span aria-hidden="true" className="text-muted">·</span>
              <button
                type="button"
                onClick={() => {
                  m.cancelPending();
                  say(COPY.cancelled);
                }}
                className={INLINE}
              >
                Cancel
              </button>
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* on the body: the page fades in through a blur, and a filtered ancestor would pin "fixed" to itself */}
      {m.mounted &&
        createPortal(
          <AnimatePresence>
            {m.open && (
              <Dialog key="change-email" m={m} returnTo={trigger} labelledBy={titleId} className={PANEL}>
                <ChangeEmailDialog m={m} titleId={titleId} />
              </Dialog>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
