import { getSupportedReasoningEfforts, parseReasoningEffort } from "../grok/models";
import type { ReasoningEffort } from "../types/index";

export type FastModeCommand = { action: "toggle" } | { action: "set"; enabled: boolean } | { action: "help" };

export type EffortCommand = { action: "open" } | { action: "set"; effort: ReasoningEffort } | { action: "help" };

export type EffortOption = ReasoningEffort | "auto";

export function parseFastModeCommand(cmd: string): FastModeCommand | null {
  const parsed = parseSlashCommand(cmd, ["fast", "priority"]);
  if (!parsed) return null;
  if (!parsed.arg) return { action: "toggle" };
  if (parsed.arg === "on" || parsed.arg === "true" || parsed.arg === "1") return { action: "set", enabled: true };
  if (parsed.arg === "off" || parsed.arg === "false" || parsed.arg === "0") return { action: "set", enabled: false };
  return { action: "help" };
}

export function parseEffortCommand(cmd: string): EffortCommand | null {
  const parsed = parseSlashCommand(cmd, ["effort"]);
  if (!parsed) return null;
  if (!parsed.arg) return { action: "open" };
  const effort = parseReasoningEffort(parsed.arg);
  if (effort) return { action: "set", effort };
  return { action: "help" };
}

export function applyFastModeCommand(current: boolean, command: FastModeCommand): boolean | null {
  if (command.action === "toggle") return !current;
  if (command.action === "set") return command.enabled;
  return null;
}

export function applyEffortCommand(modelId: string, command: EffortCommand): ReasoningEffort | undefined | null {
  if (command.action === "set") {
    const supported = getSupportedReasoningEfforts(modelId);
    return supported.includes(command.effort) ? command.effort : null;
  }
  return null;
}

export function formatFastModeConfirmation(enabled: boolean): string {
  return enabled
    ? "Fast Mode on — xAI priority processing (2x rates). Effort is unchanged."
    : "Fast Mode off — default scheduling.";
}

export function formatEffortConfirmation(modelId: string, effort: ReasoningEffort | undefined): string {
  const supported = getSupportedReasoningEfforts(modelId);
  if (supported.length === 0) {
    return "This model does not support reasoning effort.";
  }
  return effort
    ? `Reasoning effort set to ${effort} for this model.`
    : `Reasoning effort set to auto for this model (API default).`;
}

export function formatEffortHelp(modelId: string): string {
  const supported = getSupportedReasoningEfforts(modelId);
  if (supported.length === 0) {
    return "This model does not support reasoning effort.";
  }
  return `Usage: /effort [${supported.join("|")}]\nBare /effort opens the effort picker.`;
}

export function getEffortOptions(modelId: string): EffortOption[] {
  const supported = getSupportedReasoningEfforts(modelId);
  return supported.length > 0 ? ["auto", ...supported] : [];
}

export function formatEffortOption(effort: ReasoningEffort | undefined): EffortOption {
  return effort ?? "auto";
}

export function indexOfEffortOption(modelId: string, current: ReasoningEffort | undefined): number {
  const options = getEffortOptions(modelId);
  const index = options.indexOf(formatEffortOption(current));
  return index >= 0 ? index : 0;
}

export function describeEffortOption(option: EffortOption): string {
  switch (option) {
    case "auto":
      return "API default";
    case "low":
      return "faster";
    case "medium":
      return "balanced";
    case "high":
      return "deeper";
    case "xhigh":
      return "maximum";
  }
}

export function effortOptionToValue(option: EffortOption): ReasoningEffort | undefined {
  return option === "auto" ? undefined : option;
}

export function formatFastModeHelp(): string {
  return "Usage: /fast [on|off]\nBare /fast toggles xAI priority processing (2x rates).";
}

function parseSlashCommand(cmd: string, names: string[]): { name: string; arg: string } | null {
  const trimmed = cmd.trim();
  if (!trimmed.startsWith("/")) return null;
  const [rawName, ...rest] = trimmed.slice(1).split(/\s+/);
  const name = rawName?.toLowerCase();
  if (!name || !names.includes(name)) return null;
  return { name, arg: rest.join(" ").trim().toLowerCase() };
}
