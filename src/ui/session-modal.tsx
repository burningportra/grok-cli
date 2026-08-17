import type { SessionInfo } from "../types/index";
import { SearchableListOverlay } from "./searchable-list-overlay";
import type { Theme } from "./theme";

export type SessionBrowseRow = { kind: "session"; session: SessionInfo };

export function buildSessionBrowseRows(sessions: SessionInfo[], query: string): SessionBrowseRow[] {
  const q = query.trim().toLowerCase();
  const filtered = q
    ? sessions.filter((session) => {
        const title = (session.title ?? "").toLowerCase();
        const recap = (session.recap?.text ?? "").toLowerCase();
        return (
          title.includes(q) ||
          recap.includes(q) ||
          session.id.toLowerCase().includes(q) ||
          session.model.toLowerCase().includes(q) ||
          session.mode.toLowerCase().includes(q)
        );
      })
    : sessions;

  return filtered.map((session) => ({ kind: "session" as const, session }));
}

export function formatSessionUpdatedAt(updatedAt: Date, now = new Date()): string {
  const deltaMs = Math.max(0, now.getTime() - updatedAt.getTime());
  const minutes = Math.floor(deltaMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return updatedAt.toISOString().slice(0, 10);
}

export function formatSessionRowTitle(session: SessionInfo): string {
  const title = session.title?.trim();
  return title || "Untitled";
}

export function formatSessionRowMeta(session: SessionInfo): string {
  return `${session.id} · ${session.mode} · ${session.model}`;
}

export function SessionBrowserModal({
  t,
  width,
  height,
  selectedIndex,
  searchQuery,
  rows,
  currentSessionId,
}: {
  t: Theme;
  width: number;
  height: number;
  selectedIndex: number;
  searchQuery: string;
  rows: SessionBrowseRow[];
  currentSessionId: string | null;
}) {
  const selected = rows[selectedIndex];
  return (
    <SearchableListOverlay
      t={t}
      width={width}
      height={height}
      title="Resume session"
      searchQuery={searchQuery}
      searchPlaceholder="Search by title, id, recap..."
      selectedIndex={selectedIndex}
      selectedId={selected ? `session-${selected.session.id}` : undefined}
      itemCount={rows.length}
      emptyLabel="No saved sessions yet"
      hints={{ enter: "resume" }}
      panelWidth={Math.min(72, width - 6)}
      contentHeight={Math.max(rows.length, 1) * 2 + 10}
    >
      {rows.map((row, idx) => {
        const selectedRow = idx === selectedIndex;
        const session = row.session;
        const current = session.id === currentSessionId;
        const recap = session.recap?.text?.replace(/\s+/g, " ").trim();
        return (
          <box
            key={`session-${session.id}`}
            id={`session-${session.id}`}
            width="100%"
            backgroundColor={selectedRow ? t.selectedBg : undefined}
            paddingLeft={2}
            paddingRight={2}
          >
            <box width="100%" flexDirection="row" justifyContent="space-between">
              <text fg={current ? t.accent : selectedRow ? t.selected : t.text}>
                <b>{formatSessionRowTitle(session)}</b>
                {current ? " (current)" : ""}
              </text>
              <text fg={selectedRow ? t.primary : t.textMuted}>{formatSessionUpdatedAt(session.updatedAt)}</text>
            </box>
            <text fg={t.textMuted}>{formatSessionRowMeta(session)}</text>
            {recap ? <text fg={t.textDim}>{recap}</text> : null}
          </box>
        );
      })}
    </SearchableListOverlay>
  );
}
