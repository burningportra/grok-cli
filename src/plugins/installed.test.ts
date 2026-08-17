import { describe, expect, it } from "vitest";
import { isPluginInstalled, normalizeInstalledPlugins, withoutPluginInstalled } from "./installed.js";

describe("normalizeInstalledPlugins", () => {
  it("enables suggester when the plugins key is unset", () => {
    expect(normalizeInstalledPlugins(undefined)).toEqual(["suggester"]);
  });

  it("honors an explicit empty list after uninstall", () => {
    expect(normalizeInstalledPlugins([])).toEqual([]);
    expect(isPluginInstalled([], "suggester")).toBe(false);
    expect(withoutPluginInstalled(["suggester"], "suggester")).toEqual([]);
  });

  it("keeps known installed plugins and drops unknown ids", () => {
    expect(normalizeInstalledPlugins(["suggester", "nope"])).toEqual(["suggester"]);
  });
});
