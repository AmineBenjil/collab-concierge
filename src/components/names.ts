/*
  Plain helpers for Instagram handles and the names we show for them.
  No "use client" here, so server pages (the creator link, its metadata) can call them too.
*/

export function cleanHandle(raw: string) {
  return raw.trim().replace(/^@+/, "").replace(/\s+/g, "").toLowerCase();
}

/* handles with no separators that we know how to say */
const KNOWN: Record<string, string> = { foundcoffee: "Found Coffee" };

/* "found.coffee" → "Found Coffee", "tony" → "Tony" */
export function displayName(handle: string) {
  if (KNOWN[handle]) return KNOWN[handle];
  return handle
    .split(/[._-]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}
