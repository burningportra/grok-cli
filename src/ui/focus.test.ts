import { describe, expect, it } from "vitest";
import {
  closeFocus,
  createFocusStack,
  hasFocus,
  isPromptFocused,
  peekFocus,
  popFocus,
  popFocusTo,
  pushFocus,
  replaceTopFocus,
  resetFocus,
} from "./focus";

describe("focus stack", () => {
  it("starts on prompt and can open a session picker", () => {
    const stack = createFocusStack();
    expect(peekFocus(stack)).toBe("prompt");
    expect(isPromptFocused(stack)).toBe(true);

    const next = pushFocus(stack, "session");
    expect(peekFocus(next)).toBe("session");
    expect(hasFocus(next, "session")).toBe(true);
    expect(popFocus(next)).toEqual(["prompt"]);
  });

  it("keeps the MCP picker under its editor and Esc restores one layer", () => {
    const mcp = pushFocus(createFocusStack(), "mcp");
    const editor = pushFocus(mcp, "mcpEditor");

    expect(editor).toEqual(["prompt", "mcp", "mcpEditor"]);
    expect(peekFocus(editor)).toBe("mcpEditor");
    expect(hasFocus(editor, "mcp")).toBe(true);

    const afterEsc = popFocus(editor);
    expect(afterEsc).toEqual(["prompt", "mcp"]);
    expect(peekFocus(afterEsc)).toBe("mcp");
    expect(popFocus(afterEsc)).toEqual(["prompt"]);
  });

  it("does not push a duplicate top and reopens an existing layer in place", () => {
    const mcp = pushFocus(createFocusStack(), "mcp");
    expect(pushFocus(mcp, "mcp")).toEqual(["prompt", "mcp"]);

    const editor = pushFocus(mcp, "mcpEditor");
    expect(pushFocus(editor, "mcp")).toEqual(["prompt", "mcp"]);
  });

  it("replaces connect with telegram token without returning to prompt first", () => {
    const connect = pushFocus(createFocusStack(), "connect");
    const token = replaceTopFocus(connect, "telegramToken");
    expect(token).toEqual(["prompt", "telegramToken"]);
    expect(replaceTopFocus(token, "telegramPair")).toEqual(["prompt", "telegramPair"]);
  });

  it("closes a nested editor without dropping its parent picker", () => {
    const stack = pushFocus(pushFocus(createFocusStack(), "agents"), "agentsEditor");
    expect(closeFocus(stack, "agentsEditor")).toEqual(["prompt", "agents"]);
    expect(closeFocus(stack, "agents")).toEqual(["prompt"]);
    expect(popFocusTo(stack, "agents")).toEqual(["prompt", "agents"]);
  });

  it("never pops below prompt", () => {
    expect(popFocus(createFocusStack())).toEqual(["prompt"]);
    expect(resetFocus()).toEqual(["prompt"]);
    expect(peekFocus([])).toBe("prompt");
  });
});
