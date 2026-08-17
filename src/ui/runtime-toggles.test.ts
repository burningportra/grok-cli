import { describe, expect, it } from "vitest";
import {
  applyEffortCommand,
  applyFastModeCommand,
  effortOptionToValue,
  formatEffortConfirmation,
  formatFastModeConfirmation,
  getEffortOptions,
  indexOfEffortOption,
  parseEffortCommand,
  parseFastModeCommand,
} from "./runtime-toggles";

describe("runtime toggles", () => {
  it("parses /fast toggle and explicit on/off", () => {
    expect(parseFastModeCommand("/fast")).toEqual({ action: "toggle" });
    expect(parseFastModeCommand("/priority on")).toEqual({ action: "set", enabled: true });
    expect(parseFastModeCommand("/fast off")).toEqual({ action: "set", enabled: false });
    expect(parseFastModeCommand("/fast maybe")).toEqual({ action: "help" });
    expect(parseFastModeCommand("/models")).toBeNull();
  });

  it("parses /effort open and explicit levels", () => {
    expect(parseEffortCommand("/effort")).toEqual({ action: "open" });
    expect(parseEffortCommand("/effort xhigh")).toEqual({ action: "set", effort: "xhigh" });
    expect(parseEffortCommand("/effort banana")).toEqual({ action: "help" });
  });

  it("toggles Fast Mode independently of effort", () => {
    expect(applyFastModeCommand(false, { action: "toggle" })).toBe(true);
    expect(applyFastModeCommand(true, { action: "set", enabled: false })).toBe(false);
    expect(formatFastModeConfirmation(true)).toContain("2x");
  });

  it("lists effort options and finds the current index", () => {
    expect(getEffortOptions("grok-4.6")).toEqual(["auto", "low", "medium", "high", "xhigh"]);
    expect(getEffortOptions("grok-3-mini")).toEqual(["auto", "low", "high"]);
    expect(indexOfEffortOption("grok-4.6", undefined)).toBe(0);
    expect(indexOfEffortOption("grok-4.6", "high")).toBe(3);
    expect(effortOptionToValue("auto")).toBeUndefined();
    expect(applyEffortCommand("grok-3-mini", { action: "set", effort: "medium" })).toBeNull();
    expect(formatEffortConfirmation("grok-4.20-non-reasoning", undefined)).toContain("does not support");
  });
});
