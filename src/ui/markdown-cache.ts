export function markdownCacheKey(content: string, width: number): string {
  return `${width}:${content}`;
}

const DEFAULT_FLUSH_INTERVAL_MS = 80;

/** True when the live stream markdown should re-render. */
export function shouldFlushStreamMarkdown(input: {
  previous: string;
  next: string;
  elapsedMs: number;
  intervalMs?: number;
}): boolean {
  const { previous, next, elapsedMs, intervalMs = DEFAULT_FLUSH_INTERVAL_MS } = input;

  if (next === previous) return false;
  if (next === "") return true;

  if (elapsedMs >= intervalMs) return true;
  if (previous === "") return true;
  if (next.endsWith("\n")) return true;

  const added = next.startsWith(previous) ? next.slice(previous.length) : next;
  return added.includes("\n");
}
