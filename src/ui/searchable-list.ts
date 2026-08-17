export function clampSelectedIndex(index: number, length: number): number {
  if (length <= 0) return 0;
  if (index < 0) return 0;
  if (index > length - 1) return length - 1;
  return index;
}

export function moveSelectedIndex(index: number, length: number, delta: number): number {
  return clampSelectedIndex(index + delta, length);
}

export function appendSearchQuery(query: string, key: string): string {
  if (!isVisibleSearchChar(key)) return query;
  return query + key;
}

export function backspaceSearchQuery(query: string): string {
  return query.slice(0, -1);
}

export interface SearchableListHints {
  enter: string;
  extra?: string;
}

export function formatSearchableListHints(hints: SearchableListHints): {
  enter: string;
  extra?: string;
  esc: string;
} {
  return hints.extra === undefined
    ? { enter: hints.enter, esc: "close" }
    : { enter: hints.enter, extra: hints.extra, esc: "close" };
}

export type SearchableListKeyResult =
  | { action: "move"; index: number }
  | { action: "query"; query: string; index: 0 }
  | { action: "none" };

export function applySearchableListKey(input: {
  name?: string;
  sequence?: string;
  ctrl?: boolean;
  meta?: boolean;
  index: number;
  length: number;
  query: string;
}): SearchableListKeyResult {
  if (input.name === "up") {
    return { action: "move", index: moveSelectedIndex(input.index, input.length, -1) };
  }
  if (input.name === "down") {
    return { action: "move", index: moveSelectedIndex(input.index, input.length, 1) };
  }
  if (input.name === "backspace") {
    return { action: "query", query: backspaceSearchQuery(input.query), index: 0 };
  }
  if (input.sequence && !input.ctrl && !input.meta) {
    const next = appendSearchQuery(input.query, input.sequence);
    if (next !== input.query) {
      return { action: "query", query: next, index: 0 };
    }
  }
  return { action: "none" };
}

function isVisibleSearchChar(key: string): boolean {
  if (key.length !== 1) return false;
  const code = key.charCodeAt(0);
  return code >= 32 && code !== 127;
}
