import { env } from "../config/env";

const WEEKDAY_NAMES = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

const WEEKDAY_ALIASES: Record<string, (typeof WEEKDAY_NAMES)[number]> = {
  sunday: "sun",
  monday: "mon",
  tuesday: "tue",
  wednesday: "wed",
  thursday: "thu",
  friday: "fri",
  saturday: "sat",
};

export function normalizeScheduleDay(value: string) {
  const normalized = value.trim().toLowerCase();
  return WEEKDAY_ALIASES[normalized] ?? normalized.slice(0, 3);
}

export function getZonedClock(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: env.appTimeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const weekday = normalizeScheduleDay(parts.find((part) => part.type === "weekday")?.value ?? "sun");
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
