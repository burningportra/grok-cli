import type { ReasoningEffort } from "../types/index";
import { getReasoningEffortForModel, resolveFastMode } from "../utils/settings";
import { normalizeModelId } from "./models";

export const PRIORITY_SERVICE_TIER = "priority";

export type LiveRequestKind = "chat" | "responses" | "other";

export function getLiveRequestKind(url: string): LiveRequestKind {
  const pathname = extractPathname(url);
  if (pathname.endsWith("/chat/completions")) return "chat";
  if (pathname.endsWith("/responses")) return "responses";
  return "other";
}

export function applyLiveRequestOverrides(args: {
  url: string;
  body: unknown;
  fastMode?: boolean;
  reasoningEffort?: ReasoningEffort;
}): unknown {
  const kind = getLiveRequestKind(args.url);
  if (kind === "other" || !isJsonObject(args.body)) return args.body;

  const next: Record<string, unknown> = { ...args.body };
  let changed = false;

  if (args.fastMode) {
    next.service_tier = PRIORITY_SERVICE_TIER;
    changed = true;
  }

  if (args.reasoningEffort) {
    if (kind === "responses") {
      const existing = isJsonObject(next.reasoning) ? next.reasoning : {};
      next.reasoning = { ...existing, effort: args.reasoningEffort };
    } else {
      next.reasoning_effort = args.reasoningEffort;
    }
    changed = true;
  }

  return changed ? next : args.body;
}

let skipLiveRequestOverrides = 0;

export function withoutLiveRequestOverrides<T>(fn: () => T): T {
  skipLiveRequestOverrides += 1;
  try {
    return fn();
  } finally {
    skipLiveRequestOverrides -= 1;
  }
}

export function resolveLiveRequestOverrides(url: string, body: unknown): unknown {
  if (skipLiveRequestOverrides > 0) return body;
  if (getLiveRequestKind(url) === "other" || !isJsonObject(body)) return body;
  const modelId = typeof body.model === "string" ? normalizeModelId(body.model) : "";
  return applyLiveRequestOverrides({
    url,
    body,
    fastMode: resolveFastMode(),
    reasoningEffort: modelId ? getReasoningEffortForModel(modelId) : undefined,
  });
}

type FetchInput = Parameters<typeof fetch>[0];

export function wrapFetchWithLiveRequestOverrides(fetchImpl: typeof fetch = fetch): typeof fetch {
  return async (input, init) => {
    const rewritten = await rewriteLiveFetchInput(input, init);
    return fetchImpl(rewritten.input, rewritten.init);
  };
}

async function rewriteLiveFetchInput(
  input: FetchInput,
  init?: RequestInit,
): Promise<{ input: FetchInput; init?: RequestInit }> {
  const url = requestUrl(input);
  if (getLiveRequestKind(url) === "other") return { input, init };

  const source = init ?? (input instanceof Request ? input : undefined);
  if (!source) return { input, init };

  const method = (source.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
  if (method !== "POST") return { input, init };

  const rawBody = await readBodyText(source);
  if (rawBody == null) return { input, init };

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return { input, init };
  }

  const nextBody = resolveLiveRequestOverrides(url, parsed);
  if (nextBody === parsed) return { input, init };

  const headers = new Headers(source.headers);
  const serialized = JSON.stringify(nextBody);
  headers.set("content-type", "application/json");
  headers.delete("content-length");

  if (input instanceof Request && init == null) {
    return {
      input: new Request(input, { body: serialized, headers }),
    };
  }

  return {
    input,
    init: {
      ...init,
      method: source.method ?? "POST",
      headers,
      body: serialized,
    },
  };
}

function requestUrl(input: FetchInput): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

function extractPathname(url: string): string {
  try {
    return new URL(url, "https://api.x.ai").pathname;
  } catch {
    return url;
  }
}

async function readBodyText(source: RequestInit | Request): Promise<string | null> {
  if (typeof source.body === "string") return source.body;
  if (source.body instanceof Uint8Array) return new TextDecoder().decode(source.body);
  if (source instanceof Request) {
    try {
      return await source.clone().text();
    } catch {
      return null;
    }
  }
  return null;
}

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
