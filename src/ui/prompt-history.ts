import fs from "fs";
import os from "os";
import path from "path";

export const PROMPT_HISTORY_LIMIT = 200;

export interface PromptHistoryState {
  entries: string[];
  index: number;
  draft: string;
}

export function createPromptHistoryState(entries: string[] = []): PromptHistoryState {
  return {
    entries: sanitizePromptHistory(entries),
    index: sanitizePromptHistory(entries).length,
    draft: "",
  };
}

export function sanitizePromptHistory(entries: readonly string[], limit = PROMPT_HISTORY_LIMIT): string[] {
  const cleaned: string[] = [];
  for (const entry of entries) {
    const text = typeof entry === "string" ? entry.trim() : "";
    if (!text) continue;
    if (cleaned[cleaned.length - 1] === text) continue;
    cleaned.push(text);
  }
  return cleaned.slice(-limit);
}

export function recordPrompt(state: PromptHistoryState, text: string): PromptHistoryState {
  const next = text.trim();
  if (!next) {
    return { ...state, index: state.entries.length, draft: "" };
  }

  const entries =
    state.entries[state.entries.length - 1] === next ? state.entries : sanitizePromptHistory([...state.entries, next]);
  return { entries, index: entries.length, draft: "" };
}

export function canRecallOlder(text: string, cursorOffset: number): boolean {
  return !text.slice(0, Math.max(0, cursorOffset)).includes("\n");
}

export function canRecallNewer(text: string, cursorOffset: number): boolean {
  return !text.slice(Math.max(0, cursorOffset)).includes("\n");
}

export function recallOlder(state: PromptHistoryState, currentText: string): PromptHistoryState | null {
  if (state.entries.length === 0 || state.index <= 0) return null;
  const index = state.index - 1;
  const draft = state.index >= state.entries.length ? currentText : state.draft;
  return { ...state, index, draft };
}

export function recallNewer(state: PromptHistoryState): PromptHistoryState | null {
  if (state.index >= state.entries.length) return null;
  return { ...state, index: state.index + 1 };
}

export function recalledPrompt(state: PromptHistoryState): string {
  return state.index >= state.entries.length ? state.draft : (state.entries[state.index] ?? "");
}

export function getPromptHistoryPath(homeDir = os.homedir()): string {
  return path.join(homeDir, ".grok", "prompt-history.json");
}

export function loadPromptHistory(homeDir = os.homedir()): string[] {
  try {
    const raw = fs.readFileSync(getPromptHistoryPath(homeDir), "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? sanitizePromptHistory(parsed.filter((item): item is string => typeof item === "string"))
      : [];
  } catch {
    return [];
  }
}

export function savePromptHistory(entries: readonly string[], homeDir = os.homedir()): void {
  const filePath = getPromptHistoryPath(homeDir);
  fs.mkdirSync(path.dirname(filePath), { recursive: true, mode: 0o700 });
  fs.writeFileSync(filePath, `${JSON.stringify(sanitizePromptHistory(entries), null, 2)}\n`, { mode: 0o600 });
}
