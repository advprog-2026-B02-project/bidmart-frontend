export function maskBidderDisplay(raw?: string | null): string | null {
  if (!raw) return null;
  // if server already censored (contains *), return as-is
  if (raw.includes("***")) return raw;

  // email-aware masking
  const emailMatch = raw.match(/^(.+)@(.+)$/);
  if (emailMatch) {
    const local = emailMatch[1];
    const domain = emailMatch[2];

    const maskPart = (s: string, keepLeft = 2, keepRight = 1) => {
      if (s.length <= keepLeft + keepRight + 1) return s[0] + "*".repeat(Math.max(1, s.length - 1));
      return s.slice(0, keepLeft) + "*".repeat(Math.max(1, s.length - keepLeft - keepRight)) + s.slice(-keepRight);
    };

    const maskedLocal = maskPart(local, 2, 0);
    const domainParts = domain.split(".");
    const maskedDomain = domainParts
      .map((p, i) => (i === domainParts.length - 1 ? p : maskPart(p, 3, 0)))
      .join(".");

    return `${maskedLocal}@${maskedDomain}`;
  }

  // plain name/string -> keep first and last char, mask middle
  const s = raw.trim();
  if (s.length <= 2) return s[0] + "*";
  if (s.length <= 4) return s[0] + "*".repeat(s.length - 1);
  return s[0] + "*".repeat(Math.max(1, s.length - 2)) + s[s.length - 1];
}
