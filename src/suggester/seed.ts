// Seed artifact shape adapted from pi-prompt-suggester (MIT)
// Copyright (c) 2026 Guido Witt-Dörring
// https://github.com/guwidoe/pi-prompt-suggester

import { createHash } from "crypto";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { projectKeyFor } from "./store.js";

export const CURRENT_SEED_VERSION = 1;
export const CURRENT_GENERATOR_VERSION = "2026-08-16.1";
export const SEEDER_PROMPT_VERSION = "2026-08-16.1";

export type ReseedReason = "initial_missing" | "manual" | "key_file_changed";

export type SeedKeyFileCategory = "vision" | "architecture" | "principles_guidelines" | "code_entrypoint" | "other";

export const REQUIRED_SEED_CATEGORIES = ["vision", "architecture", "principles_guidelines"] as const;

export interface SeedCategoryFinding {
  found: boolean;
  rationale: string;
  files: string[];
}

export type SeedCategoryFindings = Record<(typeof REQUIRED_SEED_CATEGORIES)[number], SeedCategoryFinding>;

export interface SeedKeyFile {
  path: string;
  hash: string;
  whyImportant: string;
  category: SeedKeyFileCategory;
}

export interface SeedArtifact {
  seedVersion: number;
  generatedAt: string;
  sourceCommit?: string;
  generatorVersion: string;
  seederPromptVersion: string;
  modelId?: string;
  projectIntentSummary: string;
  objectivesSummary: string;
  constraintsSummary: string;
  principlesGuidelinesSummary: string;
  implementationStatusSummary: string;
  topObjectives: string[];
  constraints: string[];
  keyFiles: SeedKeyFile[];
  categoryFindings: SeedCategoryFindings;
  openQuestions: string[];
  reseedNotes?: string;
  lastReseedReason?: ReseedReason;
  lastChangedFiles?: string[];
}

export interface SeedDraft {
  projectIntentSummary: string;
  objectivesSummary: string;
  constraintsSummary: string;
  principlesGuidelinesSummary: string;
  implementationStatusSummary: string;
  topObjectives: string[];
  constraints: string[];
  keyFiles: Array<Pick<SeedKeyFile, "path" | "whyImportant" | "category">>;
  categoryFindings: SeedCategoryFindings;
  openQuestions: string[];
  reseedNotes?: string;
}

export interface ReseedTrigger {
  reason: ReseedReason;
  changedFiles: string[];
}

export function seedPath(cwd: string, homeDir = os.homedir()): string {
  return path.join(homeDir, ".grok", "prompt-suggester", "projects", projectKeyFor(cwd), "seed.json");
}

export function loadSeed(cwd: string, homeDir = os.homedir()): SeedArtifact | null {
  const filePath = seedPath(cwd, homeDir);
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf-8")) as SeedArtifact;
  } catch {
    return null;
  }
}

export function saveSeed(cwd: string, seed: SeedArtifact, homeDir = os.homedir()): void {
  const filePath = seedPath(cwd, homeDir);
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true, mode: 0o700 });
    fs.writeFileSync(filePath, JSON.stringify(seed, null, 2), { mode: 0o600 });
  } catch {
    /* never block the TUI */
  }
}

export function hashFile(absolutePath: string): string {
  return createHash("sha256").update(fs.readFileSync(absolutePath)).digest("hex");
}

export function compactSeedForPrompt(seed: SeedArtifact | null): string {
  if (!seed) return "none";
  return JSON.stringify(
    {
      projectIntentSummary: seed.projectIntentSummary,
      objectivesSummary: seed.objectivesSummary,
      constraintsSummary: seed.constraintsSummary,
      principlesGuidelinesSummary: seed.principlesGuidelinesSummary,
      implementationStatusSummary: seed.implementationStatusSummary,
      topObjectives: seed.topObjectives,
      constraints: seed.constraints,
      openQuestions: seed.openQuestions,
      keyFiles: seed.keyFiles.map((file) => ({
        path: file.path,
        category: file.category,
        whyImportant: file.whyImportant,
      })),
      categoryFindings: seed.categoryFindings,
    },
    null,
    2,
  );
}

export function validateSeedDraft(draft: SeedDraft): string | null {
  for (const category of REQUIRED_SEED_CATEGORIES) {
    const finding = draft.categoryFindings[category];
    if (!finding || typeof finding.found !== "boolean" || !finding.rationale.trim()) {
      return `missing categoryFindings.${category}`;
    }
    if (finding.found) {
      const tagged = draft.keyFiles.some((file) => file.category === category);
      if (!tagged) return `found ${category} but no key file is tagged with that category`;
    }
  }
  if (draft.keyFiles.length === 0) return "no keyFiles";
  return null;
}

export function parseSeedDraft(value: unknown): SeedDraft | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const findings = parseCategoryFindings(raw.categoryFindings);
  if (!findings) return null;
  const keyFiles = parseKeyFileDrafts(raw.keyFiles);
  if (!keyFiles) return null;
  return {
    projectIntentSummary: asString(raw.projectIntentSummary),
    objectivesSummary: asString(raw.objectivesSummary),
    constraintsSummary: asString(raw.constraintsSummary),
    principlesGuidelinesSummary: asString(raw.principlesGuidelinesSummary),
    implementationStatusSummary: asString(raw.implementationStatusSummary),
    topObjectives: asStringArray(raw.topObjectives),
    constraints: asStringArray(raw.constraints),
    keyFiles,
    categoryFindings: findings,
    openQuestions: asStringArray(raw.openQuestions),
    reseedNotes: asString(raw.reseedNotes) || undefined,
  };
}

function parseCategoryFindings(value: unknown): SeedCategoryFindings | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const findings = {} as SeedCategoryFindings;
  for (const category of REQUIRED_SEED_CATEGORIES) {
    const item = raw[category];
    if (!item || typeof item !== "object") return null;
    const row = item as Record<string, unknown>;
    findings[category] = {
      found: Boolean(row.found),
      rationale: asString(row.rationale),
      files: asStringArray(row.files),
    };
  }
  return findings;
}

function parseKeyFileDrafts(value: unknown): SeedDraft["keyFiles"] | null {
  if (!Array.isArray(value)) return null;
  const files: SeedDraft["keyFiles"] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const filePath = asString(row.path);
    const category = asCategory(row.category);
    if (!filePath || !category) continue;
    files.push({
      path: filePath,
      whyImportant: asString(row.whyImportant) || "High-signal repository file",
      category,
    });
  }
  return files;
}

function asCategory(value: unknown): SeedKeyFileCategory | null {
  if (
    value === "vision" ||
    value === "architecture" ||
    value === "principles_guidelines" ||
    value === "code_entrypoint" ||
    value === "other"
  ) {
    return value;
  }
  return null;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}
