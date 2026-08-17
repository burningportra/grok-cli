import { describe, expect, it } from "vitest";
import { buildStatusBarLeft, buildStatusBarRight, compactHomePath, formatModelStatusName } from "./status-bar";

describe("compactHomePath", () => {
  it("replaces a home directory prefix with ~", () => {
    expect(compactHomePath("/Users/kev/Documents/GitHub/grok-cli", "/Users/kev")).toBe("~/Documents/GitHub/grok-cli");
  });

  it("replaces an exact home directory with ~", () => {
    expect(compactHomePath("/Users/kev", "/Users/kev")).toBe("~");
  });

  it("only rewrites the prefix at the start of the path", () => {
    expect(compactHomePath("/tmp/Users/kev/project", "/Users/kev")).toBe("/tmp/Users/kev/project");
  });

  it("does not rewrite a longer sibling path that shares a string prefix", () => {
    expect(compactHomePath("/Users/kevin/src", "/Users/kev")).toBe("/Users/kevin/src");
  });

  it("leaves non-home paths unchanged", () => {
    expect(compactHomePath("/opt/app", "/Users/kev")).toBe("/opt/app");
  });

  it("does not strip a trailing slash from cwd", () => {
    expect(compactHomePath("/Users/kev/src/", "/Users/kev")).toBe("~/src/");
  });

  it("does not treat a trailing slash on homeDir as optional", () => {
    expect(compactHomePath("/Users/kev/src", "/Users/kev/")).toBe("/Users/kev/src");
  });
});

describe("buildStatusBarLeft", () => {
  it("returns the compacted cwd as a muted segment", () => {
    expect(
      buildStatusBarLeft({
        cwd: "/Users/kev/Documents/GitHub/grok-cli",
        homeDir: "/Users/kev",
        sandboxMode: "off",
      }),
    ).toEqual([{ text: "~/Documents/GitHub/grok-cli", tone: "muted" }]);
  });

  it("appends a warn sandbox segment only for shuru mode", () => {
    expect(
      buildStatusBarLeft({
        cwd: "/Users/kev/project",
        homeDir: "/Users/kev",
        sandboxMode: "shuru",
      }),
    ).toEqual([
      { text: "~/project", tone: "muted" },
      { text: "sandbox", tone: "warn" },
    ]);
  });

  it("does not append sandbox for other modes", () => {
    expect(
      buildStatusBarLeft({
        cwd: "/tmp",
        homeDir: "/Users/kev",
        sandboxMode: "docker",
      }),
    ).toEqual([{ text: "/tmp", tone: "muted" }]);
  });
});

describe("buildStatusBarRight", () => {
  it("returns the model name as a normal segment", () => {
    expect(buildStatusBarRight({ modelName: "grok-4" })).toEqual([{ text: "grok-4", tone: "normal" }]);
  });

  it("appends optional context and version as muted segments", () => {
    expect(
      buildStatusBarRight({
        modelName: "grok-4",
        contextLabel: "12k/128k",
        version: "1.2.3",
      }),
    ).toEqual([
      { text: "grok-4", tone: "normal" },
      { text: "12k/128k", tone: "muted" },
      { text: "1.2.3", tone: "muted" },
    ]);
  });

  it("attaches effort to the model name and keeps fast as a badge", () => {
    expect(formatModelStatusName("Grok 4.6", "auto")).toBe("Grok 4.6 [auto]");
    expect(
      buildStatusBarRight({
        modelName: "Grok 4.6",
        fastMode: true,
        effortLabel: "low",
      }),
    ).toEqual([
      { text: "Grok 4.6 [low]", tone: "normal" },
      { text: "fast", tone: "accent" },
    ]);
  });

  it("skips empty strings", () => {
    expect(
      buildStatusBarRight({
        modelName: "",
        contextLabel: "",
        version: "",
      }),
    ).toEqual([]);
  });

  it("keeps model and version when context is omitted", () => {
    expect(buildStatusBarRight({ modelName: "grok-4", version: "0.1.0" })).toEqual([
      { text: "grok-4", tone: "normal" },
      { text: "0.1.0", tone: "muted" },
    ]);
  });
});
