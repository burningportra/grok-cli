import { describe, expect, it } from "vitest";
import type { ChatEntry } from "../types/index";
import { chatEntryKey, messageViewUnchanged } from "./chat-entry-render";

function entry(partial: Partial<ChatEntry> = {}): ChatEntry {
  return {
    type: "assistant",
    content: "hello",
    timestamp: new Date("2026-04-22T16:00:00.000Z"),
    ...partial,
  };
}

describe("chatEntryKey", () => {
  it("is stable for the same finished bubble", () => {
    const msg = entry();
    expect(chatEntryKey(msg, 3)).toBe(chatEntryKey(msg, 3));
  });

  it("does not include message content", () => {
    const a = entry({ content: "first draft of a very long answer" });
    const b = entry({ content: "completely different text" });
    expect(chatEntryKey(a, 0)).toBe(chatEntryKey(b, 0));
  });

  it("changes when type, remote key, timestamp, or index change", () => {
    const base = entry({ remoteKey: "tg-1" });
    expect(chatEntryKey(base, 0)).not.toBe(chatEntryKey({ ...base, type: "user" }, 0));
    expect(chatEntryKey(base, 0)).not.toBe(chatEntryKey({ ...base, remoteKey: "tg-2" }, 0));
    expect(chatEntryKey(base, 0)).not.toBe(
      chatEntryKey({ ...base, timestamp: new Date("2026-04-22T16:00:01.000Z") }, 0),
    );
    expect(chatEntryKey(base, 0)).not.toBe(chatEntryKey(base, 1));
  });
});

describe("messageViewUnchanged", () => {
  const theme = { background: "#000" } as never;

  it("skips rerender when the same entry object is still at the same index", () => {
    const msg = entry();
    expect(
      messageViewUnchanged(
        { entry: msg, index: 2, t: theme, modeColor: "#fff", expanded: false, width: 80 },
        { entry: msg, index: 2, t: theme, modeColor: "#fff", expanded: false, width: 80 },
      ),
    ).toBe(true);
  });

  it("rerenders when the entry identity, expand state, or index changes", () => {
    const msg = entry();
    const next = { ...msg };
    const base = { entry: msg, index: 2, t: theme, modeColor: "#fff", expanded: false, width: 80 };
    expect(messageViewUnchanged(base, { ...base, entry: next })).toBe(false);
    expect(messageViewUnchanged(base, { ...base, expanded: true })).toBe(false);
    expect(messageViewUnchanged(base, { ...base, index: 3 })).toBe(false);
    expect(messageViewUnchanged(base, { ...base, width: 40 })).toBe(false);
  });
});
