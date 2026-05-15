export interface LogEntry {
  level: number;
  time: number;
  context?: string;
  msg: string;
  err?: string;
  req?: { method: string; url: string };
  res?: { statusCode: number };
}

const entries: LogEntry[] = [];
const MAX = 500;

export function pushEntry(raw: string): void {
  try {
    const parsed = JSON.parse(raw.trim());
    if (!parsed.level || !parsed.msg) return;
    entries.push({
      level: parsed.level,
      time: parsed.time ?? Date.now(),
      context: parsed.context,
      msg: parsed.msg,
      err: parsed.err?.message ?? (typeof parsed.err === 'string' ? parsed.err : undefined),
      req: parsed.req,
      res: parsed.res,
    });
    if (entries.length > MAX) entries.splice(0, entries.length - MAX);
  } catch {}
}

export function getEntries(minLevel?: number, search?: string, limit = 200): LogEntry[] {
  let result = minLevel ? entries.filter(e => e.level >= minLevel) : [...entries];
  if (search) {
    const q = search.toLowerCase();
    result = result.filter(e =>
      e.msg.toLowerCase().includes(q) ||
      (e.context?.toLowerCase().includes(q)) ||
      (e.req?.url.toLowerCase().includes(q)),
    );
  }
  return result.slice(-limit).reverse();
}
