import { useEffect, useState } from "react";
import { getCountdown } from "../lib/time";

export function useCountdown(date: string, time: string, timeZone: string) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return getCountdown(date, time, timeZone, now);
}
