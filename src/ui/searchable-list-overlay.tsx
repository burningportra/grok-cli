import type { ScrollBoxRenderable } from "@opentui/core";
import { type ReactNode, useEffect, useRef } from "react";
import { formatSearchableListHints, type SearchableListHints } from "./searchable-list";
import type { Theme } from "./theme";

function bottomAlignedModalTop(height: number, panelHeight: number): number {
  return Math.max(2, Math.floor((height - panelHeight) / 2));
}

export function SearchableListOverlay({
  t,
  width,
  height,
  title,
  searchQuery,
  searchPlaceholder,
  selectedIndex: _selectedIndex,
  selectedId,
  itemCount,
  emptyLabel,
  hints,
  panelWidth,
  contentHeight,
  children,
}: {
  t: Theme;
  width: number;
  height: number;
  title: string;
  searchQuery: string;
  searchPlaceholder: string;
  selectedIndex: number;
  selectedId?: string;
  itemCount: number;
  emptyLabel: string;
  hints?: SearchableListHints;
  panelWidth: number;
  contentHeight: number;
  children: ReactNode;
}) {
  const listRef = useRef<ScrollBoxRenderable>(null);
  const panelHeight = Math.min(contentHeight, Math.floor(height * 0.6));
  const overlayBg = "#000000cc" as string;
  const formattedHints = hints ? formatSearchableListHints(hints) : null;

  useEffect(() => {
    if (!selectedId) return;
    listRef.current?.scrollChildIntoView(selectedId);
  }, [selectedId]);

  return (
    <box
      position="absolute"
      left={0}
      top={0}
      width={width}
      height={height}
      alignItems="center"
      paddingTop={bottomAlignedModalTop(height, panelHeight)}
      backgroundColor={overlayBg}
    >
      <box
        width={panelWidth}
        height={panelHeight}
        backgroundColor={t.backgroundPanel}
        paddingTop={1}
        paddingBottom={1}
        flexDirection="column"
      >
        <box flexShrink={0} flexDirection="row" justifyContent="space-between" paddingLeft={2} paddingRight={2}>
          <text fg={t.primary}>
            <b>{title}</b>
          </text>
          <text fg={t.textMuted}>{"esc"}</text>
        </box>
        <box flexShrink={0} paddingLeft={2} paddingRight={2} paddingTop={1} paddingBottom={1}>
          <text fg={t.text}>{searchQuery || <span style={{ fg: t.textMuted }}>{searchPlaceholder}</span>}</text>
        </box>
        <scrollbox ref={listRef} flexGrow={1} minHeight={0}>
          {children}
          {itemCount === 0 ? (
            <box paddingLeft={2} paddingRight={2}>
              <text fg={t.textMuted}>{emptyLabel}</text>
            </box>
          ) : null}
        </scrollbox>
        {formattedHints ? (
          <box flexShrink={0} paddingLeft={2} paddingRight={2} paddingTop={2} paddingBottom={1}>
            <text>
              <span style={{ fg: t.primary }}>{"enter "}</span>
              <span style={{ fg: t.textMuted }}>{formattedHints.enter}</span>
              {formattedHints.extra ? (
                <>
                  <span style={{ fg: t.textDim }}>{" · "}</span>
                  <span style={{ fg: t.textMuted }}>{formattedHints.extra}</span>
                </>
              ) : null}
              <span style={{ fg: t.textDim }}>{" · "}</span>
              <span style={{ fg: t.primary }}>{"esc "}</span>
              <span style={{ fg: t.textMuted }}>{formattedHints.esc}</span>
            </text>
          </box>
        ) : null}
      </box>
    </box>
  );
}
