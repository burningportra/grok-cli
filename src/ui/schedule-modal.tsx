import type { StoredSchedule } from "../tools/schedule";
import { SearchableListOverlay } from "./searchable-list-overlay";
import type { Theme } from "./theme";

export type ScheduleBrowseRow = { kind: "schedule"; schedule: StoredSchedule };

export function buildScheduleBrowseRows(schedules: StoredSchedule[], query: string): ScheduleBrowseRow[] {
  const q = query.trim().toLowerCase();
  const filtered = q
    ? schedules.filter(
        (schedule) =>
          schedule.name.toLowerCase().includes(q) ||
          schedule.id.toLowerCase().includes(q) ||
          schedule.instruction.toLowerCase().includes(q) ||
          (schedule.cron ?? "").toLowerCase().includes(q),
      )
    : schedules;

  return filtered.map((schedule) => ({ kind: "schedule" as const, schedule }));
}

export function ScheduleBrowserModal({
  t,
  width,
  height,
  selectedIndex,
  searchQuery,
  rows,
}: {
  t: Theme;
  width: number;
  height: number;
  selectedIndex: number;
  searchQuery: string;
  rows: ScheduleBrowseRow[];
}) {
  const selected = rows[selectedIndex];
  return (
    <SearchableListOverlay
      t={t}
      width={width}
      height={height}
      title="Schedules"
      searchQuery={searchQuery}
      searchPlaceholder="Search by name, cron, instruction..."
      selectedIndex={selectedIndex}
      selectedId={selected ? `schedule-${selected.schedule.id}` : undefined}
      itemCount={rows.length}
      emptyLabel="No schedules yet"
      hints={{ enter: "details", extra: "ctrl+x remove" }}
      panelWidth={Math.min(60, width - 6)}
      contentHeight={Math.max(rows.length, 1) + 10}
    >
      {rows.map((row, idx) => {
        const selectedRow = idx === selectedIndex;
        const schedule = row.schedule;
        const scheduleText = schedule.cron ?? "runs once immediately";
        return (
          <box
            key={`schedule-${schedule.id}`}
            id={`schedule-${schedule.id}`}
            width="100%"
            backgroundColor={selectedRow ? t.selectedBg : undefined}
            paddingLeft={2}
            paddingRight={2}
          >
            <box width="100%" flexDirection="row">
              <text fg={selectedRow ? t.primary : t.text}>
                <b>{schedule.name}</b>
              </text>
              <text fg={t.textMuted}>{` - ${scheduleText}`}</text>
            </box>
          </box>
        );
      })}
    </SearchableListOverlay>
  );
}
