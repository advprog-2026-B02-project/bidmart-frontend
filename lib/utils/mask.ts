function maskEmail(raw: string): string | null {
  const trimmed = raw.trim();
  const match = trimmed.match(/^([^@\s]+)@([^@\s]+)$/);
  if (!match) return null;
  const local = match[1];
  const domain = match[2];
  const first = local[0] ?? "";
  const last = local.length > 2 ? local[local.length - 1] : "";
  return `${first}***${last}@${domain}`;
}

export function maskBidderDisplay(raw?: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const maskedEmail = maskEmail(trimmed);
  if (maskedEmail) return maskedEmail;
  const cleanedServerMask = trimmed.replace(/[()]/g, "").trim();
  if (cleanedServerMask.includes("***")) {
    const serverMaskedEmail = maskEmail(cleanedServerMask);
    return serverMaskedEmail ?? cleanedServerMask;
  }
  return `${trimmed[0]}***`;
}
