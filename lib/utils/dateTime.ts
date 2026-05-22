const TIMEZONE_SUFFIX = /(?:z|[+-]\d{2}:?\d{2})$/i;

export function normalizeDateTime(value: string | null | undefined): string | null {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (!trimmed.includes("T") || TIMEZONE_SUFFIX.test(trimmed)) {
    return trimmed;
  }

  // Bidding service serializes UTC LocalDateTime values without a timezone suffix.
  return `${trimmed}Z`;
}

export function toDate(value: string | null | undefined): Date | null {
  const normalized = normalizeDateTime(value);
  if (!normalized) return null;

  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function toEpochMillis(value: string | null | undefined): number | null {
  const date = toDate(value);
  return date ? date.getTime() : null;
}
