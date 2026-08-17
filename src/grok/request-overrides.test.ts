import { afterEach, describe, expect, it, vi } from "vitest";
import * as settings from "../utils/settings";
import {
  applyLiveRequestOverrides,
  resolveLiveRequestOverrides,
  withoutLiveRequestOverrides,
} from "./request-overrides";

describe("applyLiveRequestOverrides", () => {
  it("adds service_tier to chat completions when Fast Mode is on", () => {
    expect(
      applyLiveRequestOverrides({
        url: "https://api.x.ai/v1/chat/completions",
        body: { model: "grok-4.6", messages: [] },
        fastMode: true,
      }),
    ).toEqual({
      model: "grok-4.6",
      messages: [],
      service_tier: "priority",
    });
  });

  it("writes reasoning_effort on chat and reasoning.effort on responses", () => {
    expect(
      applyLiveRequestOverrides({
        url: "https://api.x.ai/v1/chat/completions",
        body: { model: "grok-4.6" },
        reasoningEffort: "xhigh",
      }),
    ).toEqual({
      model: "grok-4.6",
      reasoning_effort: "xhigh",
    });

    expect(
      applyLiveRequestOverrides({
        url: "https://api.x.ai/v1/responses",
        body: { model: "grok-4.6", reasoning: { store: true } },
        reasoningEffort: "medium",
      }),
    ).toEqual({
      model: "grok-4.6",
      reasoning: { store: true, effort: "medium" },
    });
  });

  it("leaves image, video, and batch URLs unchanged", () => {
    const body = { model: "grok-imagine-image", prompt: "logo" };
    expect(
      applyLiveRequestOverrides({
        url: "https://api.x.ai/v1/images/generations",
        body,
        fastMode: true,
        reasoningEffort: "low",
      }),
    ).toBe(body);
  });
});

describe("resolveLiveRequestOverrides", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reads the live Fast Mode and effort settings", () => {
    vi.spyOn(settings, "resolveFastMode").mockReturnValue(true);
    vi.spyOn(settings, "getReasoningEffortForModel").mockReturnValue("medium");

    expect(resolveLiveRequestOverrides("https://api.x.ai/v1/chat/completions", { model: "grok-4.6" })).toEqual({
      model: "grok-4.6",
      service_tier: "priority",
      reasoning_effort: "medium",
    });
  });

  it("skips overrides inside withoutLiveRequestOverrides", () => {
    vi.spyOn(settings, "resolveFastMode").mockReturnValue(true);
    vi.spyOn(settings, "getReasoningEffortForModel").mockReturnValue("high");
    const body = { model: "grok-4.20-non-reasoning" };

    expect(
      withoutLiveRequestOverrides(() => resolveLiveRequestOverrides("https://api.x.ai/v1/chat/completions", body)),
    ).toBe(body);
  });
});
