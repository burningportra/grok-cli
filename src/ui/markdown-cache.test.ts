import { describe, expect, it } from "vitest";
import { markdownCacheKey, shouldFlushStreamMarkdown } from "./markdown-cache";

describe("markdownCacheKey", () => {
  it("is stable for the same content and width", () => {
    expect(markdownCacheKey("# hello", 80)).toBe(markdownCacheKey("# hello", 80));
  });

  it("changes when content changes", () => {
    expect(markdownCacheKey("# hello", 80)).not.toBe(markdownCacheKey("# hello!", 80));
  });

  it("changes when width changes", () => {
    expect(markdownCacheKey("# hello", 80)).not.toBe(markdownCacheKey("# hello", 40));
  });
});

describe("shouldFlushStreamMarkdown", () => {
  it("never flushes when next equals previous", () => {
    expect(shouldFlushStreamMarkdown({ previous: "hello", next: "hello", elapsedMs: 1_000 })).toBe(false);
    expect(shouldFlushStreamMarkdown({ previous: "", next: "", elapsedMs: 1_000 })).toBe(false);
  });

  it("always flushes a clear from non-empty previous", () => {
    expect(shouldFlushStreamMarkdown({ previous: "hello", next: "", elapsedMs: 0 })).toBe(true);
  });

  it("flushes the first chunk immediately", () => {
    expect(shouldFlushStreamMarkdown({ previous: "", next: "h", elapsedMs: 0 })).toBe(true);
  });

  it("flushes when the default 80ms interval has elapsed", () => {
    expect(shouldFlushStreamMarkdown({ previous: "hel", next: "hell", elapsedMs: 80 })).toBe(true);
    expect(shouldFlushStreamMarkdown({ previous: "hel", next: "hell", elapsedMs: 79 })).toBe(false);
  });

  it("uses a custom interval when provided", () => {
    expect(
      shouldFlushStreamMarkdown({
        previous: "hel",
        next: "hell",
        elapsedMs: 40,
        intervalMs: 40,
      }),
    ).toBe(true);
    expect(
      shouldFlushStreamMarkdown({
        previous: "hel",
        next: "hell",
        elapsedMs: 39,
        intervalMs: 40,
      }),
    ).toBe(false);
  });

  it("flushes when the next chunk ends with a newline", () => {
    expect(shouldFlushStreamMarkdown({ previous: "hello", next: "hello\n", elapsedMs: 0 })).toBe(true);
  });

  it("flushes when a newline appears after the previous content", () => {
    expect(
      shouldFlushStreamMarkdown({
        previous: "hello",
        next: "hello\nworld",
        elapsedMs: 0,
      }),
    ).toBe(true);
  });

  it("does not flush mid-line tokens before the interval", () => {
    expect(shouldFlushStreamMarkdown({ previous: "hel", next: "hell", elapsedMs: 10 })).toBe(false);
  });
});
