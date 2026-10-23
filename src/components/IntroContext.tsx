"use client";

import { useReducedMotion } from "motion/react";
import { createContext, useContext, useState, type ReactNode } from "react";

type IntroState = { done: boolean; setDone: (v: boolean) => void; reduced: boolean };

const Ctx = createContext<IntroState>({ done: true, setDone: () => {}, reduced: false });

export function IntroProvider({ children }: { children: ReactNode }) {
  const [doneState, setDone] = useState(false);
  const reduced = useReducedMotion() ?? false;
  const done = reduced || doneState;

  return <Ctx.Provider value={{ done, setDone, reduced }}>{children}</Ctx.Provider>;
}

export const useIntro = () => useContext(Ctx);
