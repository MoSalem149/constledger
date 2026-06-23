const MONTH_MAP = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Sept: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
};

/** Parse ISO strings and "1 Jan 2026" style dates. */
export function parseFlexibleDate(value) {
  if (!value || value === "—") return null;

  const trimmed = String(value).trim();
  if (!trimmed) return null;

  const iso = new Date(trimmed);
  if (!Number.isNaN(iso.getTime()) && /^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return iso;
  }

  const parts = trimmed.split(/\s+/);
  if (parts.length >= 3) {
    const [d, m, y] = parts;
    const month = MONTH_MAP[m];
    if (month !== undefined && !Number.isNaN(+d) && !Number.isNaN(+y)) {
      const parsed = new Date(+y, month, +d);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }
  }

  const fallback = new Date(trimmed);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

/** Display format used across contract schedule fields. */
export function formatContractDate(date) {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * end = start + durationDays calendar days.
 * Returns null when start is missing/invalid or duration is not a positive integer.
 */
export function computeEndDateFromDuration(startDateRaw, durationDays) {
  const start = parseFlexibleDate(startDateRaw);
  const days = Number(durationDays);
  if (!start || !Number.isInteger(days) || days < 1) return null;

  const end = new Date(start);
  end.setDate(end.getDate() + days);
  return formatContractDate(end);
}

/**
 * duration = calendar days from start to end (inverse of computeEndDateFromDuration).
 * Returns null when dates are missing/invalid or end is not after start.
 */
export function computeDurationFromDates(startDateRaw, endDateRaw) {
  const start = parseFlexibleDate(startDateRaw);
  const end = parseFlexibleDate(endDateRaw);
  if (!start || !end) return null;

  const startUtc = Date.UTC(
    start.getFullYear(),
    start.getMonth(),
    start.getDate(),
  );
  const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  const days = Math.round((endUtc - startUtc) / (1000 * 60 * 60 * 24));
  if (days < 1) return null;
  return days;
}
