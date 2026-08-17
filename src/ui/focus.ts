export const FOCUS_KINDS = [
  "prompt",
  "slash",
  "model",
  "sandbox",
  "recap",
  "effort",
  "wallet",
  "apiKey",
  "connect",
  "telegramToken",
  "telegramPair",
  "mcp",
  "mcpEditor",
  "agents",
  "agentsEditor",
  "schedule",
  "session",
  "update",
  "plan",
  "payment",
  "btw",
] as const;

export type FocusKind = (typeof FOCUS_KINDS)[number];

const ROOT_FOCUS: FocusKind = "prompt";

export function createFocusStack(initial: FocusKind = ROOT_FOCUS): FocusKind[] {
  return initial === ROOT_FOCUS ? [ROOT_FOCUS] : [ROOT_FOCUS, initial];
}

export function peekFocus(stack: readonly FocusKind[]): FocusKind {
  return stack[stack.length - 1] ?? ROOT_FOCUS;
}

export function hasFocus(stack: readonly FocusKind[], kind: FocusKind): boolean {
  return stack.includes(kind);
}

export function pushFocus(stack: readonly FocusKind[], kind: FocusKind): FocusKind[] {
  if (kind === ROOT_FOCUS) return resetFocus();
  if (peekFocus(stack) === kind) return stack.length ? [...stack] : [ROOT_FOCUS];
  const existing = stack.lastIndexOf(kind);
  if (existing >= 0) return stack.slice(0, existing + 1);
  return [...(stack.length ? stack : [ROOT_FOCUS]), kind];
}

export function popFocus(stack: readonly FocusKind[]): FocusKind[] {
  if (stack.length <= 1) return [ROOT_FOCUS];
  return stack.slice(0, -1);
}

export function popFocusTo(stack: readonly FocusKind[], kind: FocusKind): FocusKind[] {
  const index = stack.lastIndexOf(kind);
  if (index < 0) return [ROOT_FOCUS];
  return stack.slice(0, index + 1);
}

export function closeFocus(stack: readonly FocusKind[], kind: FocusKind): FocusKind[] {
  const index = stack.lastIndexOf(kind);
  if (index < 0) return stack.length ? [...stack] : [ROOT_FOCUS];
  const next = stack.slice(0, index);
  return next.length ? next : [ROOT_FOCUS];
}

export function replaceTopFocus(stack: readonly FocusKind[], kind: FocusKind): FocusKind[] {
  if (kind === ROOT_FOCUS) return [ROOT_FOCUS];
  if (stack.length <= 1) return [ROOT_FOCUS, kind];
  return [...stack.slice(0, -1), kind];
}

export function resetFocus(): FocusKind[] {
  return [ROOT_FOCUS];
}

export function isPromptFocused(stack: readonly FocusKind[]): boolean {
  return peekFocus(stack) === ROOT_FOCUS;
}
