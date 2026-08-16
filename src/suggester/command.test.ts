import { describe, expect, it } from "vitest";
import { parseSuggesterCommand } from "./command.js";

describe("parseSuggesterCommand", () => {
  it("parses on, off, status, and help", () => {
    expect(parseSuggesterCommand("/suggester")).toEqual({ action: "status", rest: "" });
    expect(parseSuggesterCommand("/suggester status")).toEqual({ action: "status", rest: "" });
    expect(parseSuggesterCommand("/suggester on")).toEqual({ action: "on", rest: "" });
    expect(parseSuggesterCommand("/SUGGESTER off")).toEqual({ action: "off", rest: "" });
    expect(parseSuggesterCommand("/suggester auto")).toEqual({ action: "auto", rest: "" });
    expect(parseSuggesterCommand("/suggester ghost")).toEqual({ action: "ghost", rest: "" });
    expect(parseSuggesterCommand("/suggester reseed")).toEqual({ action: "reseed", rest: "" });
    expect(parseSuggesterCommand("/suggester instruction set keep it short")).toEqual({
      action: "instruction",
      rest: "set keep it short",
    });
    expect(parseSuggesterCommand("/suggester model seeder grok-3-mini")).toEqual({
      action: "model",
      rest: "seeder grok-3-mini",
    });
    expect(parseSuggesterCommand("/suggester mystery")).toEqual({ action: "help", rest: "" });
  });

  it("ignores unrelated commands", () => {
    expect(parseSuggesterCommand("/btw hello")).toBeNull();
    expect(parseSuggesterCommand("suggester on")).toBeNull();
  });
});
