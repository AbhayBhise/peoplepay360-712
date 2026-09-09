import { env } from "../config/env";

const WEEKDAY_NAMES = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

export function getZonedClock(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: env.appTimeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const weekday = parts.find((part) => part.type === "weekday")?.value.toLowerCase().slice(0, 3) ?? "sun";
  const rawHour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const hour = rawHour === 24 ? 0 : rawHour;
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);

  return {
    day: WEEKDAY_NAMES.includes(weekday as (typeof WEEKDAY_NAMES)[number])
      ? weekday as (typeof WEEKDAY_NAMES)[number]
      : "sun",
    minutes: hour * 60 + minute,
  };
}
