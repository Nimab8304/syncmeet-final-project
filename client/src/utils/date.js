// client/src/utils/date.js
export function formatLocal(dt) {
  if (!dt) return "";
  try {
    const d = typeof dt === "string" ? new Date(dt) : dt;
    return d.toLocaleString();
  } catch {
    return String(dt);
  }
}

export function formatLocalRange(start, end) {
  const s = formatLocal(start);
  const e = formatLocal(end);
  if (!s && !e) return "";
  if (s && !e) return s;
  if (!s && e) return e;
  return `${s} — ${e}`;
}
