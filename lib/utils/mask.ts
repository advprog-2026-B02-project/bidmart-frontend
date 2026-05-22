export function maskBidderDisplay(raw?: string | null): string | null {
  if (!raw) return null;
  // if server already censored (contains ***), return as-is
  if (raw.includes("***")) return raw;

  // email-aware masking: always show only first char, then three asterisks, then @domain
  const emailMatch = raw.match(/^(.+)@(.+)$/);
  if (emailMatch) {
    const local = emailMatch[1];
    const domain = emailMatch[2];
    const maskedLocal = local[0] + "***";
    return `${maskedLocal}@${domain}`;
  }

  // plain name/string: first char + three asterisks
  const s = raw.trim();
  if (!s) return null;
  return s[0] + "***";
}
