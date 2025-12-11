// frontend/src/components/CourseDiagramSvg.jsx
import React, { useMemo, useState } from "react";

const COL_WIDTH = 320; // base distance between columns (Year/Sem)
const ROW_HEIGHT = 160; // base distance between rows
const CARD_WIDTH = 260;
const CARD_HEIGHT = 90;
const PADDING_X = 40;
const PADDING_Y = 40;

function yearColor(year) {
  if (year === 1) return "#fef3c7"; // yellow
  if (year === 2) return "#dbeafe"; // blue
  if (year === 3) return "#dcfce7"; // green
  return "#fee2e2"; // red/pink
}

function getPrereqIds(course) {
  if (!course) return [];
  if (
    Array.isArray(course.prerequisites_display) &&
    course.prerequisites_display.length > 0
  ) {
    return course.prerequisites_display.map((p) => p.id);
  }
  if (Array.isArray(course.prerequisite_ids)) {
    return course.prerequisite_ids;
  }
  return [];
}

export default function CourseDiagramSvg({ courses, onCourseClick }) {
  const [zoom, setZoom] = useState(1); // 🔍 zoom factor
  const [hoveredId, setHoveredId] = useState(null);

  const {
    nodes,
    edges,
    width,
    height,
    cardWidth,
    cardHeight,
    prereqMap,
    dependentMap,
    columnMeta,
  } = useMemo(() => {
    if (!Array.isArray(courses) || courses.length === 0) {
      return {
        nodes: [],
        edges: [],
        width: 800,
        height: 400,
        cardWidth: CARD_WIDTH * zoom,
        cardHeight: CARD_HEIGHT * zoom,
        prereqMap: new Map(),
        dependentMap: new Map(),
        columnMeta: [],
      };
    }

    const scale = zoom;
    const colWidth = COL_WIDTH * scale;
    const rowHeight = ROW_HEIGHT * scale;
    const cWidth = CARD_WIDTH * scale;
    const cHeight = CARD_HEIGHT * scale;
    const paddingX = PADDING_X * scale;
    const paddingY = PADDING_Y * scale;

    // Map id -> course
    const byId = new Map();
    courses.forEach((c) => {
      if (c && c.id != null) byId.set(c.id, c);
    });

    // track prerequisites / dependents for hover highlighting
    const prereqMapLocal = new Map();
    const dependentMapLocal = new Map();
    courses.forEach((c) => {
      if (!c || c.id == null) return;
      const pIds = getPrereqIds(c);
      prereqMapLocal.set(c.id, pIds);
      pIds.forEach((pid) => {
        if (!dependentMapLocal.has(pid)) dependentMapLocal.set(pid, []);
        dependentMapLocal.get(pid).push(c.id);
      });
    });

    // group by (year, semester)
    const grouped = {};
    courses.forEach((c) => {
      const sem = c.semester || "A";
      const key = `${c.year}-${sem}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(c);
    });

    // sort columns by year + sem
    const colKeys = Object.keys(grouped).sort((a, b) => {
      const [ya, sa] = a.split("-");
      const [yb, sb] = b.split("-");
      const na = parseInt(ya, 10);
      const nb = parseInt(yb, 10);
      if (na !== nb) return na - nb;
      const order = { A: 0, B: 1, SUMMER: 2 };
      return (order[sa] ?? 9) - (order[sb] ?? 9);
    });

    const colIndex = new Map();
    colKeys.forEach((k, idx) => colIndex.set(k, idx));

    // layout: give each course a center (x,y)
    const layout = {}; // id -> { x, y, column, row }
    let maxCol = 0;
    let maxRow = 0;

    colKeys.forEach((key) => {
      const col = colIndex.get(key);
      const list = grouped[key];
      list.sort((a, b) => (a.code || "").localeCompare(b.code || ""));
      list.forEach((c, row) => {
        const x = paddingX + col * colWidth + colWidth / 2;
        const y = paddingY + row * rowHeight + rowHeight / 2;
        layout[c.id] = { x, y, column: col, row };
        if (col > maxCol) maxCol = col;
        if (row > maxRow) maxRow = row;
      });
    });

    const nodes = courses
      .filter((c) => c && c.id != null && layout[c.id])
      .map((c) => ({
        id: c.id,
        course: c,
        ...layout[c.id],
      }));

    // edges from prerequisites
    const edges = [];
    courses.forEach((course) => {
      if (!course || course.id == null) return;
      const toPos = layout[course.id];
      if (!toPos) return;

      const prereqIds = getPrereqIds(course);
      prereqIds.forEach((pid) => {
        const fromPos = layout[pid];
        if (!fromPos) return;

        const x1 = fromPos.x;
        const x2 = toPos.x;

        // 🔹 offsets so arrowheads land just under the target card (pointing up)
        const OFFSET_FROM = 10; // below prereq card
        const OFFSET_TO_BOTTOM = 16; // below target card bottom
        const y1 = fromPos.y + cHeight / 2 + OFFSET_FROM;
        const targetBottom = toPos.y + cHeight / 2 + OFFSET_TO_BOTTOM;

        if (x1 === x2) {
          // same column: drop down then point upward into the target from below
          edges.push({
            id: `${pid}->${course.id}`,
            from: pid,
            to: course.id,
            points: [
              [x1, y1],
              [x2, targetBottom + 14], // allow room for arrow head
              [x2, targetBottom],
            ],
          });
        } else {
          // different columns: down → horizontal → up from below target
          const midY = Math.max(y1, targetBottom) + 20;
          edges.push({
            id: `${pid}->${course.id}`,
            from: pid,
            to: course.id,
            points: [
              [x1, y1],
              [x1, midY],
              [x2, midY],
              [x2, targetBottom + 14],
              [x2, targetBottom],
            ],
          });
        }
      });
    });

    const width = paddingX * 2 + (maxCol + 1) * colWidth;
    const height = paddingY * 2 + (maxRow + 1) * rowHeight + cHeight;

    const columnMeta = colKeys.map((key) => {
      const [year, sem] = key.split("-");
      const col = colIndex.get(key);
      const xCenter = paddingX + col * colWidth + colWidth / 2;
      return {
        key,
        label: `Year ${year} · Sem ${sem}`,
        xCenter,
        width: colWidth,
      };
    });

    return {
      nodes,
      edges,
      width,
      height,
      cardWidth: cWidth,
      cardHeight: cHeight,
      prereqMap: prereqMapLocal,
      dependentMap: dependentMapLocal,
      columnMeta,
    };
  }, [courses, zoom]);

  const focusedPrereqIds = hoveredId ? prereqMap.get(hoveredId) || [] : [];
  const focusedDependentIds = hoveredId
    ? dependentMap.get(hoveredId) || []
    : [];

  const handleZoomIn = () =>
    setZoom((z) => Math.min(z + 0.25, 2.5)); // max x2.5
  const handleZoomOut = () =>
    setZoom((z) => Math.max(z - 0.25, 0.5)); // min x0.5
  const handleReset = () => setZoom(1);

  return (
    <div className="w-full h-[620px] rounded-3xl border border-slate-200 bg-slate-50 overflow-auto relative">
      {/* Column headers aligned with the grid */}
      {columnMeta.length > 0 && (
        <div className="absolute left-0 right-0 top-0 z-10 px-3 pt-3 pointer-events-none">
          <div className="relative" style={{ width }}>
            {columnMeta.map((col) => (
              <div
                key={col.key}
                className="absolute text-[11px] text-slate-600 font-semibold bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg px-3 py-1 shadow-sm"
                style={{
                  left: col.xCenter - col.width / 2 + 8,
                  width: col.width - 16,
                }}
              >
                {col.label}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend chip */}
      <div className="absolute left-3 top-3 z-30 flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-slate-200 shadow-sm text-[11px] text-slate-600">
        <span className="font-semibold text-slate-700">Legend:</span>
        <span className="inline-flex items-center gap-1">
          <span className="h-3 w-3 rounded-sm border border-slate-200 bg-[#fef3c7]" />
          Year 1
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-3 w-3 rounded-sm border border-slate-200 bg-[#dbeafe]" />
          Year 2
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-3 w-3 rounded-sm border border-slate-200 bg-[#dcfce7]" />
          Year 3
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-3 w-3 rounded-sm border border-slate-200 bg-[#fee2e2]" />
          Year 4+
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-3 w-3 rounded-full border border-slate-300 bg-slate-100" />
          prerequisite link
        </span>
      </div>

      {/* 🔍 Zoom controls */}
      <div className="absolute right-3 top-3 z-20 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={handleZoomIn}
          className="px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          +
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          className="px-2 py-1 text-xs font-semibold text-slate-700 border-t border-b border-slate-200 hover:bg-slate-50"
        >
          −
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="px-2 py-1 text-[10px] text-slate-500 hover:bg-slate-50"
        >
          reset
        </button>
      </div>

      {/* SVG arrows behind cards */}
      <svg
        width={width}
        height={height}
        className="absolute top-0 left-0 pointer-events-none"
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="8"
            refY="5"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L10,5 L0,10 z" fill="#94a3b8" />
          </marker>
          <marker
            id="arrowhead-active"
            markerWidth="10"
            markerHeight="10"
            refX="8"
            refY="5"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L10,5 L0,10 z" fill="#4338ca" />
          </marker>
        </defs>

        {edges.map((e) => {
          const isActive =
            hoveredId && (hoveredId === e.from || hoveredId === e.to);
          const strokeColor = isActive ? "#4338ca" : "#94a3b8";
          const strokeWidth = isActive ? 2.4 : 1.6;
          const dash = isActive ? "6 3" : "6 4";
          const markerId = isActive ? "arrowhead-active" : "arrowhead";

          return (
            <polyline
              key={e.id}
              points={e.points.map(([x, y]) => `${x},${y}`).join(" ")}
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeDasharray={dash}
              markerEnd={`url(#${markerId})`}
            />
          );
        })}
      </svg>

      {/* Course cards */}
      <div style={{ width, height }} className="relative">
        {nodes.map((n) => {
          const c = n.course;
          const left = n.x - cardWidth / 2;
          const top = n.y - cardHeight / 2;

          const isHovered = hoveredId === c.id;
          const isPrereq = focusedPrereqIds.includes(c.id);
          const isDependent = focusedDependentIds.includes(c.id);

          let borderColor = "#e2e8f0";
          let shadow = "0 10px 25px rgba(15,23,42,0.08)";
          if (isHovered) {
            borderColor = "#4338ca";
            shadow = "0 14px 28px rgba(67,56,202,0.25)";
          } else if (isPrereq) {
            borderColor = "#10b981";
            shadow = "0 12px 24px rgba(16,185,129,0.18)";
          } else if (isDependent) {
            borderColor = "#0ea5e9";
            shadow = "0 12px 24px rgba(14,165,233,0.18)";
          }

          let prereqText = "No prerequisites";
          if (
            Array.isArray(c.prerequisites_display) &&
            c.prerequisites_display.length > 0
          ) {
            const list = c.prerequisites_display
              .map((p) => p.code || p.name || "")
              .filter(Boolean);
            if (list.length) {
              prereqText = `Prerequisites: ${list.join(", ")}`;
            }
          }

          return (
            <div
              key={c.id}
              className="absolute rounded-xl text-xs text-center cursor-pointer group transition duration-150"
              style={{
                left,
                top,
                width: cardWidth,
                height: cardHeight,
                background: yearColor(c.year),
                border: `1.5px solid ${borderColor}`,
                boxShadow: shadow,
              }}
              onClick={() => onCourseClick && onCourseClick(c)}
              onMouseEnter={() => setHoveredId(c.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <div className="font-semibold mt-2 px-2 truncate">
                {c.name}
              </div>
              <div className="text-[10px] px-2 truncate">
                {c.code} · {c.credits} pts
              </div>
              <div className="text-[10px] text-gray-600">
                Year {c.year}, Sem {c.semester}
              </div>

              {(isPrereq || isDependent || isHovered) && (
                <div className="mt-1 text-[10px] text-slate-600 font-semibold px-2">
                  {isHovered
                    ? "Selected"
                    : isPrereq
                    ? "Prerequisite"
                    : "Depends on selected"}
                </div>
              )}

              {/* hover tooltip */}
              <div
                className="
                  pointer-events-none
                  absolute
                  top-1/2 left-full
                  -translate-y-1/2
                  w-60 text-left
                  rounded-xl border border-slate-200 bg-white shadow-lg
                  px-3 py-2
                  opacity-0
                  group-hover:opacity-100 group-hover:translate-x-2
                  transition
                  z-50
                "
                style={{ marginLeft: 12 }}
              >
                <div className="text-[11px] font-semibold text-slate-900 mb-1">
                  {c.code} · {c.name}
                </div>
                <div className="text-[10px] text-slate-600 mb-1">
                  Credits: {c.credits} · Year {c.year}, Sem {c.semester}
                </div>
                <div className="text-[10px] text-slate-500">
                  {prereqText}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
