"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Tile, areAdjacent } from "@/lib/grid";

interface BoardProps {
  tiles: Tile[];
  disabled?: boolean;
  // Color of the active trail (parent decides based on live validity).
  trailColor: string;
  onPathChange: (path: number[]) => void;
  onCommit: (path: number[]) => void;
}

// Only register a cell once the pointer is within this fraction of its center,
// which makes diagonal swipes feel deliberate instead of twitchy.
const HIT_SHRINK = 0.62;

export default function Board({
  tiles,
  disabled,
  trailColor,
  onPathChange,
  onCommit,
}: BoardProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [path, setPath] = useState<number[]>([]);
  const pathRef = useRef<number[]>([]);
  const rectsRef = useRef<DOMRect[]>([]);
  const wrapRectRef = useRef<DOMRect | null>(null);
  const centersRef = useRef<{ x: number; y: number }[]>([]);
  const draggingRef = useRef(false);

  const measure = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    wrapRectRef.current = wrap.getBoundingClientRect();
    const cells = wrap.querySelectorAll<HTMLElement>("[data-cell]");
    const rects: DOMRect[] = [];
    const centers: { x: number; y: number }[] = [];
    cells.forEach((c) => {
      const r = c.getBoundingClientRect();
      rects[Number(c.dataset.cell)] = r;
      centers[Number(c.dataset.cell)] = {
        x: r.left + r.width / 2,
        y: r.top + r.height / 2,
      };
    });
    rectsRef.current = rects;
    centersRef.current = centers;
  }, []);

  useLayoutEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure, tiles]);

  // Notify the parent of selection changes from an effect — never from inside a
  // setState updater (that would update Page during Board's render).
  useEffect(() => {
    pathRef.current = path;
    onPathChange(path);
  }, [path, onPathChange]);

  const cellAtPoint = useCallback((x: number, y: number): number => {
    const rects = rectsRef.current;
    for (let i = 0; i < rects.length; i++) {
      const r = rects[i];
      if (!r) continue;
      const padX = (r.width * (1 - HIT_SHRINK)) / 2;
      const padY = (r.height * (1 - HIT_SHRINK)) / 2;
      if (
        x >= r.left + padX &&
        x <= r.right - padX &&
        y >= r.top + padY &&
        y <= r.bottom - padY
      ) {
        return i;
      }
    }
    return -1;
  }, []);

  const extend = useCallback(
    (idx: number) => {
      if (idx < 0) return;
      setPath((prev) => {
        if (prev.length === 0) return [idx];
        const last = prev[prev.length - 1];
        if (idx === last) return prev;
        // Backtrack: dragging onto the second-to-last tile undoes the last hop.
        if (prev.length >= 2 && idx === prev[prev.length - 2]) {
          return prev.slice(0, -1);
        }
        if (prev.includes(idx)) return prev; // no reusing a tile
        if (!areAdjacent(tiles[last], tiles[idx])) return prev;
        return [...prev, idx];
      });
    },
    [tiles]
  );

  const start = useCallback(
    (e: React.PointerEvent) => {
      if (disabled) return;
      measure();
      draggingRef.current = true;
      wrapRef.current?.setPointerCapture(e.pointerId);
      extend(cellAtPoint(e.clientX, e.clientY));
    },
    [disabled, measure, extend, cellAtPoint]
  );

  const move = useCallback(
    (e: React.PointerEvent) => {
      if (!draggingRef.current || disabled) return;
      extend(cellAtPoint(e.clientX, e.clientY));
    },
    [disabled, extend, cellAtPoint]
  );

  const end = useCallback(() => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    const committed = pathRef.current;
    if (committed.length) onCommit(committed);
    setPath([]); // parent is notified via the path effect
  }, [onCommit]);

  // Build the SVG polyline through selected cell centers, relative to wrapper.
  const wrapRect = wrapRectRef.current;
  const points =
    wrapRect && path.length > 1
      ? path
          .map((i) => {
            const c = centersRef.current[i];
            return `${c.x - wrapRect.left},${c.y - wrapRect.top}`;
          })
          .join(" ")
      : "";

  return (
    <div
      ref={wrapRef}
      className="board"
      onPointerDown={start}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      style={{ touchAction: "none" }}
    >
      <svg className="trail" aria-hidden>
        {points && (
          <polyline
            points={points}
            fill="none"
            stroke={trailColor}
            strokeWidth={14}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.55}
          />
        )}
      </svg>
      {tiles.map((t) => {
        const order = path.indexOf(t.index);
        const selected = order !== -1;
        return (
          <div
            key={t.index}
            data-cell={t.index}
            className={"cell" + (selected ? " selected" : "")}
            style={
              selected
                ? ({
                    "--sel": trailColor,
                  } as React.CSSProperties)
                : undefined
            }
          >
            <span>{t.letter}</span>
          </div>
        );
      })}
    </div>
  );
}
