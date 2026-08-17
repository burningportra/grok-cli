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

export function buildStatusBarRight(input: {
  modelName: string;
  contextLabel?: string;
  version?: string;
}): StatusSegment[] {
  const segments: StatusSegment[] = [];
  if (input.modelName) {
    segments.push({ text: input.modelName, tone: "normal" });
  }
  if (input.contextLabel) {
    segments.push({ text: input.contextLabel, tone: "muted" });
  }
  if (input.version) {
    segments.push({ text: input.version, tone: "muted" });
  }
  return segments;
}
