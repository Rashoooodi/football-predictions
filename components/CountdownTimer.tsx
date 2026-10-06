"use client";

import { useState, useEffect } from "react";
import { formatCountdown, matchPhase } from "@/lib/countdown";

export default function CountdownTimer({
  deadline,
  kickoff,
}: {
  deadline: string;
  kickoff: string;
}) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const deadlineMs = new Date(deadline).getTime();
  const kickoffMs = new Date(kickoff).getTime();
  const phase = matchPhase(now, deadlineMs, kickoffMs);

  let label = "";
  let color = "text-gray-400";

  if (phase === "open") {
    label = "Predictions close in " + formatCountdown(deadlineMs - now);
    color = "text-accent";
  } else if (phase === "locked") {
    label = "Match starts in " + formatCountdown(kickoffMs - now);
    color = "text-yellow-400";
  } else if (phase === "live") {
    label = "LIVE";
    color = "text-red-400";
  } else {
    label = "Finished";
    color = "text-gray-500";
  }

  return (
    <div aria-live="polite" className={"text-center text-sm font-medium mt-2 " + color}>
      {label}
    </div>
  );
}
