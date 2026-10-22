export const TIMEZONES = {
  IST: {
    key: "IST",
    label: "IST",
    fullLabel: "Indian Standard Time (UTC+5:30)",
    offsetMinutes: 330,
    iana: "Asia/Kolkata",
  },
  UTC: {
    key: "UTC",
    label: "UTC",
    fullLabel: "UTC (Coordinated Universal Time)",
    offsetMinutes: 0,
    iana: "UTC",
  },
  EST: {
    key: "EST",
    label: "EST",
    fullLabel: "EST (US Eastern Time UTC-5)",
    offsetMinutes: -300,
    iana: "America/New_York",
  },
};

/**
 * Formats a UTC ISO-8601 string into the requested timezone.
 */
export function formatToTimezone(isoUtcStr, tzKey = "IST") {
  if (!isoUtcStr) return "Dates To Be Announced by Official Source";
  try {
    const date = new Date(isoUtcStr);
    const tz = TIMEZONES[tzKey] || TIMEZONES.IST;

    const formatter = new Intl.DateTimeFormat("en-IN", {
      timeZone: tz.iana,
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    return `${formatter.format(date)} ${tz.label}`;
  } catch (err) {
    return isoUtcStr;
  }
}

/**
 * Calculates live ticking countdown components.
 */
export function calculateCountdown(dueAtIso) {
  if (!dueAtIso) return null;
  const targetTime = new Date(dueAtIso).getTime();
  const now = Date.now();
  const diff = targetTime - now;

  if (diff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true,
      totalSeconds: 0,
    };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return {
    days,
    hours,
    minutes,
    seconds,
    isExpired: false,
    totalSeconds: Math.floor(diff / 1000),
  };
}

/**
 * Formats relative freshness timestamp.
 */
export function formatFreshness(verifiedAtIso) {
  if (!verifiedAtIso) return "Just verified";
  try {
    const verified = new Date(verifiedAtIso).getTime();
    const diffSeconds = Math.max(0, Math.floor((Date.now() - verified) / 1000));

    if (diffSeconds < 60) return "Verified just now";
    const minutes = Math.floor(diffSeconds / 60);
    if (minutes < 60) return `Verified ${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Verified ${hours}h ago`;
    return `Verified ${Math.floor(hours / 24)}d ago`;
  } catch {
    return "Verified recently";
  }
}
