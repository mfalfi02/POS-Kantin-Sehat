/** Provider-neutral image URL handling; storage can be added without changing product CRUD. */
export function normalizeProductImageUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const url = new URL(trimmed);
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("Unsupported image URL protocol");
  return url.toString();
}
