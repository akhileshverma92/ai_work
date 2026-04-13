/** Format seconds as HH:MM:SS */
export function formatHMS(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((n) => String(n).padStart(2, "0")).join(":");
}

/** Format minutes as HH:MM */
export function formatHMFromMinutes(mins: number): string {
  const m = Math.max(0, Math.round(mins));
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

export function formatDateLabel(d: Date): string {
  return d
    .toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    .toUpperCase();
}

export function todayISOInTimezone(offsetMs = 0): string {
  const d = new Date(Date.now() + offsetMs);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function getDayName(d: Date): string {
  return d.toLocaleDateString("en-US", { weekday: "long" });
}

export function getMonthLabel(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function parseISO(dateStr: string): Date {
  return new Date(dateStr);
}

export function addHours(d: Date, hours: number): Date {
  return new Date(d.getTime() + hours * 3600 * 1000);
}

export function formatTimeShort(d: Date): string {
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/** Calendar date YYYY-MM-DD in the user's local timezone. */
export function formatLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Value for `<input type="datetime-local" />` from an ISO string. */
export function isoToDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day}T${h}:${min}`;
}

/** Parse `datetime-local` value (local) to ISO UTC. */
export function datetimeLocalToIso(local: string): string {
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) throw new Error("Invalid date");
  return d.toISOString();
}

/** Value for `<input type="time" />` (HH:mm local) from an ISO string. */
export function isoToTimeInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "09:00";
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

/**
 * Combine calendar date (YYYY-MM-DD) and time (HH:mm or HH:mm:ss) in local TZ → ISO UTC.
 */
export function combineDateAndTimeToIso(workDateYmd: string, timeHm: string): string {
  const trimmed = timeHm.trim();
  if (!trimmed) throw new Error("Time is required");
  const [y, mo, day] = workDateYmd.split("-").map(Number);
  if (!y || !mo || !day) throw new Error("Invalid work date");
  const parts = trimmed.split(":");
  const hh = Number(parts[0]);
  const mm = Number(parts[1] ?? 0);
  const ss = parts[2] !== undefined ? Number(parts[2]) : 0;
  const dt = new Date(y, mo - 1, day, hh, mm, ss, 0);
  if (Number.isNaN(dt.getTime())) throw new Error("Invalid date/time");
  return dt.toISOString();
}
