/**
 * Timezone & Meeting Slot Normalization Utilities
 * Handles dual-party timezone synchronization (e.g. US & India, India & India, Europe, etc.)
 */

export interface TimezoneFormattedResult {
  timeFormatted: string;
  dateFormatted: string;
  zoneAbbr: string;
  fullFormatted: string;
}

/**
 * Safely parses any meeting slot representation (ISO string, "YYYY-MM-DD at HH:mm", timestamp, object)
 * Guaranteed to never return an Invalid Date.
 */
export function parseMeetingSlot(slot: any): Date {
  if (!slot) return new Date();

  // If object with nested time property
  if (typeof slot === "object" && slot !== null) {
    if (slot.startTime) return parseMeetingSlot(slot.startTime);
    if (slot.slotTime) return parseMeetingSlot(slot.slotTime);
    if (slot.id && !slot.id.startsWith("slot_")) return parseMeetingSlot(slot.id);
  }

  const str = String(slot).trim();

  // Handle "YYYY-MM-DD at HH:mm"
  if (str.includes(" at ")) {
    const [datePart, timePart] = str.split(" at ");
    const cleanDate = datePart.trim();
    const cleanTime = timePart.trim();
    const candidate = new Date(`${cleanDate}T${cleanTime}:00`);
    if (!isNaN(candidate.getTime())) return candidate;
  }

  // Handle standard date/ISO parsing
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) return parsed;

  // Fallback to now
  return new Date();
}

/**
 * Common timezone friendly names
 */
export function getTimezoneFriendlyName(tz: string): string {
  if (!tz || tz === "UTC") return "UTC (Coordinated Universal Time)";
  if (tz === "Asia/Kolkata" || tz === "Asia/Calcutta") return "India Standard Time (IST · UTC+5:30)";
  if (tz === "America/New_York") return "US Eastern Time (EST/EDT · New York)";
  if (tz === "America/Los_Angeles") return "US Pacific Time (PST/PDT · California)";
  if (tz === "America/Chicago") return "US Central Time (CST/CDT · Chicago)";
  if (tz === "Europe/London") return "UK / GMT / BST (London)";
  if (tz === "Europe/Berlin" || tz === "Europe/Paris") return "Central European Time (CET/CEST)";
  if (tz === "Asia/Singapore" || tz === "Asia/Dubai") return `${tz.replace("_", " ")}`;
  return tz.replace("_", " ");
}

/**
 * Formats a Date object in a specific IANA timezone (e.g. 'Asia/Kolkata', 'America/New_York')
 */
export function formatInTimezone(date: Date, timeZone: string): TimezoneFormattedResult {
  const safeDate = isNaN(date.getTime()) ? new Date() : date;
  const targetTz = timeZone || "UTC";

  try {
    const timeFormatted = new Intl.DateTimeFormat("en-US", {
      timeZone: targetTz,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(safeDate);

    const dateFormatted = new Intl.DateTimeFormat("en-US", {
      timeZone: targetTz,
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(safeDate);

    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: targetTz,
      timeZoneName: "short",
    }).formatToParts(safeDate);

    let zoneAbbr = parts.find((p) => p.type === "timeZoneName")?.value || targetTz;
    if (zoneAbbr === "GMT+5:30") zoneAbbr = "IST";

    return {
      timeFormatted,
      dateFormatted,
      zoneAbbr,
      fullFormatted: `${dateFormatted} at ${timeFormatted} (${zoneAbbr})`,
    };
  } catch {
    const timeFormatted = safeDate.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    const dateFormatted = safeDate.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
    return {
      timeFormatted,
      dateFormatted,
      zoneAbbr: "Local",
      fullFormatted: `${dateFormatted} at ${timeFormatted}`,
    };
  }
}

/**
 * Checks whether two timezones share the exact same UTC offset right now.
 */
export function isSameTimezone(tz1: string, tz2: string): boolean {
  if (tz1 === tz2) return true;
  if (!tz1 || !tz2) return false;

  try {
    const now = new Date();
    const str1 = new Intl.DateTimeFormat("en-US", { timeZone: tz1, timeZoneName: "shortOffset" }).format(now);
    const str2 = new Intl.DateTimeFormat("en-US", { timeZone: tz2, timeZoneName: "shortOffset" }).format(now);
    return str1 === str2;
  } catch {
    return tz1.toLowerCase() === tz2.toLowerCase();
  }
}

/**
 * Generates an intelligent default meeting slot rounded up to the nearest convenient 30m block.
 */
export function getDefaultMeetingSlot(userTimeZone?: string): {
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  isoStartTime: string;
} {
  const now = new Date();
  
  // Advance 30 minutes from current moment and round to nearest 15/30 min
  const m = now.getMinutes();
  const roundedM = m < 30 ? 30 : 0;
  const roundedH = m >= 30 ? now.getHours() + 1 : now.getHours();

  now.setHours(roundedH, roundedM, 0, 0);

  // Extract local year, month, date
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const mins = String(now.getMinutes()).padStart(2, "0");

  const date = `${year}-${month}-${day}`;
  const time = `${hours}:${mins}`;

  return {
    date,
    time,
    isoStartTime: now.toISOString(),
  };
}

/**
 * Formats a proposed slot for dual timezone display in chat cards.
 */
export function formatDualTimezoneSlot(
  slot: any,
  userTz: string,
  counterpartTz: string,
  counterpartName: string = "Counterpart"
): {
  primary: string;
  secondary?: string;
  isSameZone: boolean;
  userTime: string;
  counterpartTime: string;
} {
  const dateObj = parseMeetingSlot(slot);
  const uTz = userTz || Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata";
  const cTz = counterpartTz || "America/New_York";

  const userFormatted = formatInTimezone(dateObj, uTz);
  const counterpartFormatted = formatInTimezone(dateObj, cTz);
  const sameZone = isSameTimezone(uTz, cTz);

  const primary = `${userFormatted.dateFormatted} at ${userFormatted.timeFormatted} (${userFormatted.zoneAbbr})`;

  let secondary: string | undefined;
  if (!sameZone) {
    secondary = `${counterpartFormatted.timeFormatted} (${counterpartFormatted.zoneAbbr}) for ${counterpartName}`;
  } else {
    secondary = `Both parties in ${userFormatted.zoneAbbr}`;
  }

  return {
    primary,
    secondary,
    isSameZone: sameZone,
    userTime: `${userFormatted.timeFormatted} ${userFormatted.zoneAbbr}`,
    counterpartTime: `${counterpartFormatted.timeFormatted} ${counterpartFormatted.zoneAbbr}`,
  };
}

