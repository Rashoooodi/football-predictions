"use client";

import { useState, useEffect } from "react";

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

  const deadlineMs = new Date(deadline + (deadline.endsWith("Z") ? "" : "Z")).getTime();
  const kickoffMs = new Date(kickoff + (kickoff.endsWith("Z") ? "" : "Z")).getTime();
  const liveEnd = kickoffMs + 2 * 60 * 60 * 1000;

  function format(ms: number): string {
    if (ms <= 0) return "0m";
    const h = Math.floor(ms / (1000 * 60 * 60));
    const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((ms % (1000 * 60)) / 1000);
    if (h > 0) return h + "h " + m + "m";
    if (m > 0) return m + "m " + s + "s";
    return s + "s";
  }

  let label = "";
  let color = "text-gray-400";

  if (now < deadlineMs) {
    label = "Predictions close in " + format(deadlineMs - now);
    color = "text-accent";
  } else if (now < kickoffMs) {
    label = "Match starts in " + format(kickoffMs - now);
    color = "text-yellow-400";
  } else if (now < liveEnd) {
    label = "LIVE";
    color = "text-red-400";
  } else {
    label = "Finished";
    color = "text-gray-500";
  }

  return (
    <div className={"text-center text-sm font-medium mt-2 " + color}>
      {label}
    </div>
  );
}
