import { describe, expect, it } from "vitest";
import {
  appendSearchQuery,
  applySearchableListKey,
  backspaceSearchQuery,
  clampSelectedIndex,
  formatSearchableListHints,
  moveSelectedIndex,
} from "./searchable-list";

describe("clampSelectedIndex", () => {
  it("returns 0 for an empty list", () => {
    expect(clampSelectedIndex(0, 0)).toBe(0);
    expect(clampSelectedIndex(3, 0)).toBe(0);
    expect(clampSelectedIndex(-1, 0)).toBe(0);
  });

  it("clamps to the last valid index", () => {
    expect(clampSelectedIndex(0, 3)).toBe(0);
    expect(clampSelectedIndex(2, 3)).toBe(2);
    expect(clampSelectedIndex(9, 3)).toBe(2);
  });

  it("clamps negative indexes to 0", () => {
    expect(clampSelectedIndex(-1, 4)).toBe(0);
    expect(clampSelectedIndex(-20, 1)).toBe(0);
  });
});

describe("moveSelectedIndex", () => {
  it("moves within bounds without wrapping", () => {
    expect(moveSelectedIndex(1, 4, 1)).toBe(2);
    expect(moveSelectedIndex(1, 4, -1)).toBe(0);
  });

  it("stops at the first and last items", () => {
    expect(moveSelectedIndex(0, 3, -1)).toBe(0);
    expect(moveSelectedIndex(2, 3, 1)).toBe(2);
    expect(moveSelectedIndex(0, 3, -5)).toBe(0);
    expect(moveSelectedIndex(1, 3, 10)).toBe(2);
  });

  it("stays at 0 when the list is empty", () => {
    expect(moveSelectedIndex(0, 0, 1)).toBe(0);
    expect(moveSelectedIndex(4, 0, -1)).toBe(0);
  });
});

describe("appendSearchQuery", () => {
  it("appends a single visible character", () => {
    expect(appendSearchQuery("", "a")).toBe("a");
    expect(appendSearchQuery("mo", "d")).toBe("mod");
    expect(appendSearchQuery("billing", " ")).toBe("billing ");
    expect(appendSearchQuery("", "4")).toBe("4");
    expect(appendSearchQuery("", "/")).toBe("/");
  });

  it("ignores empty, multi-character, and control-looking keys", () => {
    expect(appendSearchQuery("mcp", "")).toBe("mcp");
    expect(appendSearchQuery("mcp", "enter")).toBe("mcp");
    expect(appendSearchQuery("mcp", "up")).toBe("mcp");
    expect(appendSearchQuery("mcp", "\u001b")).toBe("mcp");
    expect(appendSearchQuery("mcp", "\n")).toBe("mcp");
    expect(appendSearchQuery("mcp", "\t")).toBe("mcp");
    expect(appendSearchQuery("mcp", "\u007f")).toBe("mcp");
  });
});

describe("backspaceSearchQuery", () => {
  it("drops the last character", () => {
    expect(backspaceSearchQuery("models")).toBe("model");
    expect(backspaceSearchQuery("a")).toBe("");
  });

  it("leaves an empty query empty", () => {
    expect(backspaceSearchQuery("")).toBe("");
  });
});

describe("formatSearchableListHints", () => {
  it("always includes esc close and passes enter through", () => {
    expect(formatSearchableListHints({ enter: "select" })).toEqual({
      enter: "select",
      esc: "close",
    });
  });

  it("passes extra through when provided", () => {
    expect(formatSearchableListHints({ enter: "open", extra: "ctrl+a add" })).toEqual({
      enter: "open",
      extra: "ctrl+a add",
      esc: "close",
    });
  });
});

describe("applySearchableListKey", () => {
  const base = { index: 1, length: 4, query: "mo" };

  it("moves up and down without wrapping", () => {
    expect(applySearchableListKey({ ...base, name: "up" })).toEqual({ action: "move", index: 0 });
    expect(applySearchableListKey({ ...base, name: "down" })).toEqual({ action: "move", index: 2 });
  });

  it("backspaces the query and resets the index", () => {
    expect(applySearchableListKey({ ...base, name: "backspace" })).toEqual({
      action: "query",
      query: "m",
      index: 0,
    });
  });

  it("appends a visible character and resets the index", () => {
    expect(applySearchableListKey({ ...base, sequence: "d" })).toEqual({
      action: "query",
      query: "mod",
      index: 0,
    });
  });

  it("ignores enter, modifiers, and empty sequences", () => {
    expect(applySearchableListKey({ ...base, name: "return" })).toEqual({ action: "none" });
    expect(applySearchableListKey({ ...base, sequence: "d", ctrl: true })).toEqual({ action: "none" });
    expect(applySearchableListKey({ ...base, sequence: "enter" })).toEqual({ action: "none" });
  });
});
