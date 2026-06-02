"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { type ContactCard } from "./contact-card";
import { EmployeeCard } from "./employee-card";
import { WelcomeSplash } from "./welcome-splash";

// Client orchestrator: shows the branded welcome splash, then transitions to the
// employee contact card. The entrance animation (fade + zoom + rise) reproduces
// the original framer-motion `{opacity, y, scale}` reveal using tw-animate-css —
// no extra animation dependency.
export function ContactCardExperience({ contact }: { contact: ContactCard }) {
  const [started, setStarted] = useState(false);
  const start = useCallback(() => setStarted(true), []);
  const cardRef = useRef<HTMLDivElement>(null);

  // When the splash is replaced (including the automatic countdown path), move
  // focus to the card so keyboard users don't get dropped back to <body>.
  useEffect(() => {
    if (started) cardRef.current?.focus();
  }, [started]);

  return (
    <div className="w-full max-w-md">
      <div
        // Re-keying replays the entrance animation when the card replaces the splash.
        key={started ? "card" : "welcome"}
        ref={started ? cardRef : null}
        tabIndex={started ? -1 : undefined}
        className="animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-8 outline-none duration-500"
      >
        {started ? (
          <EmployeeCard contact={contact} />
        ) : (
          <WelcomeSplash onContinue={start} />
        )}
      </div>

      {/* Announces the view change to screen readers when the card appears. */}
      <p className="sr-only" role="status" aria-live="polite">
        {started ? contact.name : ""}
      </p>
    </div>
  );
}
