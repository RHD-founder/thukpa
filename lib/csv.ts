export function toCSV<T extends Record<string, unknown>>(
  rows: T[],
  headers?: string[]
) {
  if (!rows.length) return "";
  const cols = headers ?? Object.keys(rows!);
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const head = cols.join(",");
  const body = rows.map((r) => cols.map((c) => esc(r[c])).join(",")).join("\n");
  return [head, body].filter(Boolean).join("\n");
}
