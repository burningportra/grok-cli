export interface StatusSegment {
  text: string;
  tone?: "normal" | "muted" | "accent" | "warn";
}

export function compactHomePath(cwd: string, homeDir: string): string {
  if (!homeDir) return cwd;
  if (cwd === homeDir) return "~";
  if (cwd.startsWith(`${homeDir}/`) || cwd.startsWith(`${homeDir}\\`)) {
    return `~${cwd.slice(homeDir.length)}`;
  }
  return cwd;
}

export function buildStatusBarLeft(input: { cwd: string; homeDir: string; sandboxMode: string }): StatusSegment[] {
  const segments: StatusSegment[] = [{ text: compactHomePath(input.cwd, input.homeDir), tone: "muted" }];
  if (input.sandboxMode === "shuru") {
    segments.push({ text: "sandbox", tone: "warn" });
  }
  return segments;
}

export function formatModelStatusName(modelName: string, effortLabel?: string): string {
  if (!modelName) return "";
  return effortLabel ? `${modelName} [${effortLabel}]` : modelName;
}

export function buildStatusBarRight(input: {
  modelName: string;
  contextLabel?: string;
  version?: string;
  fastMode?: boolean;
  effortLabel?: string;
}): StatusSegment[] {
  const segments: StatusSegment[] = [];
  const modelLabel = formatModelStatusName(input.modelName, input.effortLabel);
  if (modelLabel) {
    segments.push({ text: modelLabel, tone: "normal" });
  }
  if (input.fastMode) {
    segments.push({ text: "fast", tone: "accent" });
  }
  if (input.contextLabel) {
    segments.push({ text: input.contextLabel, tone: "muted" });
  }
  if (input.version) {
    segments.push({ text: input.version, tone: "muted" });
  }
  return segments;
}
