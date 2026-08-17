import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it } from "vitest";
import {
  canRecallNewer,
  canRecallOlder,
  createPromptHistoryState,
  loadPromptHistory,
  recalledPrompt,
  recallNewer,
  recallOlder,
  recordPrompt,
  sanitizePromptHistory,
  savePromptHistory,
} from "./prompt-history";

describe("prompt history", () => {
  const tempDirs: string[] = [];

  afterEach(() => {
    for (const dir of tempDirs) fs.rmSync(dir, { recursive: true, force: true });
    tempDirs.length = 0;
  });

  it("drops empties, consecutive dupes, and keeps the newest 200", () => {
    const entries = Array.from({ length: 205 }, (_, i) => `prompt ${i}`);
    const cleaned = sanitizePromptHistory(["", "same", "same", ...entries, "  last  "]);
    expect(cleaned).toHaveLength(200);
    expect(cleaned[0]).toBe("prompt 6");
    expect(cleaned.at(-1)).toBe("last");
  });

  it("walks older then back to the live draft", () => {
    let state = recordPrompt(createPromptHistoryState(), "first");
    state = recordPrompt(state, "second");

    const older = recallOlder(state, "draft in progress");
    expect(older).not.toBeNull();
    expect(recalledPrompt(older!)).toBe("second");

    const oldest = recallOlder(older!, recalledPrompt(older!));
    expect(recalledPrompt(oldest!)).toBe("first");
    expect(recallOlder(oldest!, recalledPrompt(oldest!))).toBeNull();

    const newer = recallNewer(oldest!);
    expect(recalledPrompt(newer!)).toBe("second");
    const draft = recallNewer(newer!);
    expect(recalledPrompt(draft!)).toBe("draft in progress");
    expect(recallNewer(draft!)).toBeNull();
  });

  it("only recalls from the first and last lines", () => {
    expect(canRecallOlder("line one\nline two", 4)).toBe(true);
    expect(canRecallOlder("line one\nline two", 10)).toBe(false);
    expect(canRecallNewer("line one\nline two", 4)).toBe(false);
    expect(canRecallNewer("line one\nline two", 10)).toBe(true);
  });

  it("persists and reloads history", () => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), "grok-history-"));
    tempDirs.push(home);
    savePromptHistory(["alpha", "beta"], home);
    expect(loadPromptHistory(home)).toEqual(["alpha", "beta"]);
  });
});
