import type { ChatEntry } from "../types/index";
import type { Theme } from "./theme";

export function chatEntryKey(entry: ChatEntry, index: number): string {
  return `${entry.timestamp.getTime()}-${entry.type}-${entry.remoteKey ?? ""}-${index}`;
}

export interface MessageViewCompareProps {
  entry: ChatEntry;
  index: number;
  t: Theme;
  modeColor: string;
  expanded: boolean;
  width: number;
}

export function messageViewUnchanged(prev: MessageViewCompareProps, next: MessageViewCompareProps): boolean {
  return (
    prev.entry === next.entry &&
    prev.index === next.index &&
    prev.t === next.t &&
    prev.modeColor === next.modeColor &&
    prev.expanded === next.expanded &&
    prev.width === next.width
  );
}
