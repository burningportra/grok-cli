import { describe, expect, it } from "vitest";
import {
  cycleReasoningEffort,
  DEFAULT_MODEL,
  getEffectiveReasoningEffort,
  getModelInfo,
  getSupportedReasoningEfforts,
  normalizeModelId,
  parseReasoningEffort,
} from "./models";

describe("models", () => {
  it("keeps the default model on a canonical reasoning id", () => {
    expect(DEFAULT_MODEL).toBe("grok-4.6");
  });

  it("normalizes aliases to canonical ids", () => {
    expect(normalizeModelId("grok-4-1-fast")).toBe("grok-4.3");
    expect(normalizeModelId("xai/grok-code-fast-1")).toBe("grok-4.3");
    expect(normalizeModelId("grok-4.20-0309-non-reasoning")).toBe("grok-4.20-non-reasoning");
    expect(normalizeModelId("x-ai/grok-3")).toBe("grok-4.20-non-reasoning");
    expect(normalizeModelId("grok-4.20-multi-agent")).toBe("grok-4.20-multi-agent-0309");
    expect(normalizeModelId("x-ai/grok-4.20-multi-agent-beta")).toBe("grok-4.20-multi-agent-0309");
    expect(normalizeModelId("grok-4.6")).toBe("grok-4.6");
    expect(normalizeModelId("grok-4.5-latest")).toBe("grok-4.5");
  });

  it("returns model metadata for aliased ids", () => {
    expect(getModelInfo("grok-4-1-fast")?.id).toBe("grok-4.3");
    expect(getModelInfo("grok-4.6")?.id).toBe("grok-4.6");
    expect(getModelInfo("grok-4.5-latest")?.id).toBe("grok-4.5");
    expect(getModelInfo("grok-4.20-multi-agent")?.responsesOnly).toBe(true);
    expect(getModelInfo("grok-4.20-multi-agent")?.supportsClientTools).toBe(false);
  });

  it("reports supported reasoning-effort levels", () => {
    expect(getSupportedReasoningEfforts("grok-3-mini")).toEqual(["low", "high"]);
    expect(getSupportedReasoningEfforts("grok-4.6")).toEqual(["low", "medium", "high", "xhigh"]);
    expect(getSupportedReasoningEfforts("grok-4.5")).toEqual(["low", "medium", "high", "xhigh"]);
    expect(getSupportedReasoningEfforts("grok-4.3")).toEqual(["low", "medium", "high", "xhigh"]);
    expect(getSupportedReasoningEfforts("grok-4.20-0309-reasoning")).toEqual(["low", "medium", "high", "xhigh"]);
    expect(getSupportedReasoningEfforts("grok-4.20-multi-agent-0309")).toEqual([]);
    expect(getSupportedReasoningEfforts("grok-4.20-non-reasoning")).toEqual([]);
    expect(getSupportedReasoningEfforts("grok-code-fast-1")).toEqual(["low", "medium", "high", "xhigh"]);
    expect(getSupportedReasoningEfforts("grok-3")).toEqual([]);
  });

  it("parses and cycles reasoning effort", () => {
    expect(parseReasoningEffort("XHIGH")).toBe("xhigh");
    expect(parseReasoningEffort("nope")).toBeUndefined();
    expect(cycleReasoningEffort("grok-4.6")).toBe("low");
    expect(cycleReasoningEffort("grok-4.6", "low")).toBe("medium");
    expect(cycleReasoningEffort("grok-4.6", "xhigh")).toBeUndefined();
    expect(cycleReasoningEffort("grok-3-mini", "low")).toBe("high");
    expect(cycleReasoningEffort("grok-3-mini", "high")).toBeUndefined();
    expect(cycleReasoningEffort("grok-4.20-non-reasoning")).toBeUndefined();
  });

  it("resolves effective reasoning effort with defaults and overrides", () => {
    expect(getEffectiveReasoningEffort("grok-3-mini")).toBeUndefined();
    expect(getEffectiveReasoningEffort("grok-3-mini", "high")).toBe("high");
    expect(getEffectiveReasoningEffort("grok-3-mini", "low")).toBe("low");
    expect(getEffectiveReasoningEffort("grok-4.20-multi-agent-0309")).toBeUndefined();
    expect(getEffectiveReasoningEffort("grok-4.20-multi-agent-0309", "high")).toBeUndefined();
    expect(getEffectiveReasoningEffort("grok-4.6", "xhigh")).toBe("xhigh");
    expect(getEffectiveReasoningEffort("grok-4.3", "medium")).toBe("medium");
    expect(getEffectiveReasoningEffort("grok-code-fast-1", "high")).toBe("high");
    expect(getEffectiveReasoningEffort("grok-4.20-non-reasoning", "high")).toBeUndefined();
  });
});
