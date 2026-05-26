import { useRef, type PointerEvent, type ReactElement } from "react";

export type LayoutZoneBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type LayoutZoneOption = {
  id: string;
  label: string;
  bounds: LayoutZoneBounds;
};

const CARD_WIDTH = 1400;
const CARD_HEIGHT = 2000;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function toPercent(value: number, total: number): string {
  return `${(value / total) * 100}%`;
}

export function LayoutZoneEditor({
  zones,
  selectedZoneId,
  frontArtSrc,
  onSelectZone,
  onMoveZone
}: {
  zones: LayoutZoneOption[];
  selectedZoneId: string;
  frontArtSrc?: string;
  onSelectZone: (zoneId: string) => void;
  onMoveZone: (zoneId: string, bounds: LayoutZoneBounds) => void;
}): ReactElement {
  const editorRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    zoneId: string;
    startX: number;
    startY: number;
    startBounds: LayoutZoneBounds;
  } | null>(null);

  function beginDrag(event: PointerEvent<HTMLButtonElement>, zone: LayoutZoneOption): void {
    onSelectZone(zone.id);
    dragRef.current = {
      zoneId: zone.id,
      startX: event.clientX,
      startY: event.clientY,
      startBounds: zone.bounds
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveDrag(event: PointerEvent<HTMLButtonElement>): void {
    const drag = dragRef.current;
    const editor = editorRef.current;
    if (!drag || !editor) {
      return;
    }

    const rect = editor.getBoundingClientRect();
    const dx = ((event.clientX - drag.startX) / rect.width) * CARD_WIDTH;
    const dy = ((event.clientY - drag.startY) / rect.height) * CARD_HEIGHT;
    const nextX = clamp(drag.startBounds.x + dx, 0, CARD_WIDTH - drag.startBounds.width);
    const nextY = clamp(drag.startBounds.y + dy, 0, CARD_HEIGHT - drag.startBounds.height);

    onMoveZone(drag.zoneId, {
      ...drag.startBounds,
      x: Math.round(nextX),
      y: Math.round(nextY)
    });
  }

  function endDrag(event: PointerEvent<HTMLButtonElement>): void {
    const drag = dragRef.current;
    if (drag && event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragRef.current = null;
  }

  return (
    <div className="layout-editor" ref={editorRef}>
      {frontArtSrc ? <img src={frontArtSrc} alt="" /> : null}
      {zones.map((zone) => (
        <button
          key={zone.id}
          type="button"
          className={zone.id === selectedZoneId ? "layout-zone active" : "layout-zone"}
          style={{
            left: toPercent(zone.bounds.x, CARD_WIDTH),
            top: toPercent(zone.bounds.y, CARD_HEIGHT),
            width: toPercent(zone.bounds.width, CARD_WIDTH),
            height: toPercent(zone.bounds.height, CARD_HEIGHT)
          }}
          onPointerDown={(event) => beginDrag(event, zone)}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onClick={() => onSelectZone(zone.id)}
        >
          {zone.label}
        </button>
      ))}
    </div>
  );
}
