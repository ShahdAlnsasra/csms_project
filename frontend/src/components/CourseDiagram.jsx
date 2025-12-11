// frontend/src/components/CourseDiagram.jsx
import React, { useMemo, useState } from "react";
import ReactFlow, { Background, Controls, MiniMap } from "reactflow";
import "reactflow/dist/style.css";

const COL_WIDTH = 320;
const ROW_HEIGHT = 170; // more vertical space between rows

function yearColor(year) {
  if (year === 1) return "#fef3c7"; // yellow
  if (year === 2) return "#dbeafe"; // blue
  if (year === 3) return "#dcfce7"; // green
  return "#fee2e2"; // red/pink
}

// helper: extract prerequisite ids from course
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

function NodeCard({
  course,
  onClick,
  onHover,
  isFocused,
  isPrereq,
  isDependent,
  prereqCourses,
  dependentCourses,
}) {
  let prereqText = "No prerequisites";
  if (prereqCourses && prereqCourses.length > 0) {
    const list = prereqCourses
      .map((p) => p.code || p.name || "")
      .filter(Boolean);
    if (list.length) prereqText = `Prerequisites: ${list.join(", ")}`;
  }

  // small badge text under title (relation to focused course)
  let relationLabel = "";
  if (isFocused) relationLabel = "Selected course";
  else if (isPrereq) relationLabel = "Prerequisite of selected course";
  else if (isDependent) relationLabel = "Depends on selected course";

  return (
    <div
      className="relative group cursor-pointer text-xs text-center"
      onClick={() => onClick && onClick(course)}
      onMouseEnter={() => onHover && onHover(course.id)}
      onMouseLeave={() => onHover && onHover(null)}
    >
      {/* main content */}
      <div className="font-semibold">{course.name}</div>
      <div className="text-[10px]">
        {course.code} · {course.credits} pts
      </div>
      <div className="text-[10px] text-gray-600">
        Year {course.year}, Sem {course.semester}
      </div>

      {relationLabel && (
        <div className="mt-1 text-[9px] text-slate-500">{relationLabel}</div>
      )}

      {/* when this card is focused, show tiny arrows text inside the card */}
      {isFocused && (
        <div className="mt-2 text-[10px] text-left space-y-1">
          <div>
            <span className="font-semibold text-slate-700">← Prerequisites: </span>
            {prereqCourses && prereqCourses.length > 0 ? (
              prereqCourses.map((p, idx) => (
                <span key={p.id}>
                  {idx > 0 && ", "}
                  {p.code || ""} {p.name || ""}
                </span>
              ))
            ) : (
              <span className="text-slate-500">None</span>
            )}
          </div>

          <div>
            <span className="font-semibold text-slate-700">→ Unlocks: </span>
            {dependentCourses && dependentCourses.length > 0 ? (
              dependentCourses.map((d, idx) => (
                <span key={d.id}>
                  {idx > 0 && ", "}
                  {d.code || ""} {d.name || ""}
                </span>
              ))
            ) : (
              <span className="text-slate-500">No courses depend on this</span>
            )}
          </div>
        </div>
      )}

      {/* hover tooltip (like before) */}
      <div
        className="
          pointer-events-none
          absolute left-1/2 top-full mt-1
          -translate-x-1/2 translate-y-1
          w-56 text-left
          rounded-xl border border-slate-200 bg-white shadow-lg
          px-3 py-2
          opacity-0
          group-hover:opacity-100 group-hover:translate-y-2
          transition
          z-50
        "
      >
        <div className="text-[11px] font-semibold text-slate-900 mb-1">
          {course.code} · {course.name}
        </div>
        <div className="text-[10px] text-slate-600 mb-1">
          Credits: {course.credits} · Year {course.year}, Sem{" "}
          {course.semester}
        </div>
        <div className="text-[10px] text-slate-500">{prereqText}</div>
      </div>
    </div>
  );
}

export default function CourseDiagram({ courses, onCourseClick }) {
  const [focusedId, setFocusedId] = useState(null);

  // build helper maps: id -> course, id -> prereqIds, id -> dependentIds
  const { byId, prereqMap, dependentMap } = useMemo(() => {
    const byIdLocal = new Map();
    const prereqLocal = new Map();
    const dependentLocal = new Map();

    (courses || []).forEach((c) => {
      if (!c || c.id == null) return;
      byIdLocal.set(c.id, c);
    });

    (courses || []).forEach((c) => {
      if (!c || c.id == null) return;
      const pIds = getPrereqIds(c);
      prereqLocal.set(c.id, pIds);

      pIds.forEach((pid) => {
        if (!dependentLocal.has(pid)) dependentLocal.set(pid, []);
        dependentLocal.get(pid).push(c.id);
      });
    });

    return { byId: byIdLocal, prereqMap: prereqLocal, dependentMap: dependentLocal };
  }, [courses]);

  // build ReactFlow nodes (no edges)
  const nodes = useMemo(() => {
    if (!Array.isArray(courses) || courses.length === 0) return [];

    // group courses by (year, semester)
    const grouped = {};
    courses.forEach((c) => {
      const sem = c.semester || "A";
      const key = `${c.year}-${sem}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(c);
    });

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

    const layout = {};
    colKeys.forEach((key) => {
      const column = colIndex.get(key);
      const list = grouped[key];
      list.sort((a, b) => (a.code || "").localeCompare(b.code || ""));
      list.forEach((c, row) => {
        layout[c.id] = {
          x: column * COL_WIDTH,
          y: row * ROW_HEIGHT,
          column,
          row,
        };
      });
    });

    const focusedPrereqIds = focusedId ? prereqMap.get(focusedId) || [] : [];
    const focusedDependentIds = focusedId ? dependentMap.get(focusedId) || [] : [];

    const rfNodes = [];

    Object.entries(layout).forEach(([idStr, pos]) => {
      const id = Number(idStr);
      const c = byId.get(id);
      if (!c) return;

      const prereqIds = prereqMap.get(c.id) || [];
      const depIds = dependentMap.get(c.id) || [];

      const prereqCourses = prereqIds
        .map((pid) => byId.get(pid))
        .filter(Boolean);
      const dependentCourses = depIds
        .map((did) => byId.get(did))
        .filter(Boolean);

      const isFocused = focusedId === c.id;
      const isPrereq = focusedPrereqIds.includes(c.id);
      const isDependent = focusedDependentIds.includes(c.id);

      // dynamic border according to relationship
      let border = "1px solid #e5e7eb";
      if (isFocused) border = "2px solid #4f46e5"; // indigo
      else if (isPrereq) border = "2px solid #10b981"; // green
      else if (isDependent) border = "2px solid #0ea5e9"; // sky

      rfNodes.push({
        id: String(id),
        position: { x: pos.x, y: pos.y },
        data: {
          label: (
            <NodeCard
              course={c}
              onClick={onCourseClick}
              onHover={setFocusedId}
              isFocused={isFocused}
              isPrereq={isPrereq}
              isDependent={isDependent}
              prereqCourses={prereqCourses}
              dependentCourses={dependentCourses}
            />
          ),
        },
        style: {
          borderRadius: 12,
          padding: 8,
          border,
          background: yearColor(c.year),
          boxShadow: "0 4px 8px rgba(15,23,42,0.08)",
          width: 260,
          height: 90,
        },
        selectable: false,
      });
    });

    return rfNodes;
  }, [courses, byId, prereqMap, dependentMap, focusedId, onCourseClick]);

  return (
    <div className="w-full h-[620px] rounded-3xl border border-slate-200 overflow-hidden bg-slate-50">
      <ReactFlow
        nodes={nodes}
        edges={[]} // ❌ no messy connection lines
        fitView
        fitViewOptions={{ padding: 0.2 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        zoomOnScroll
        zoomOnPinch
        zoomOnDoubleClick={false}
        panOnDrag
      >
        <Background gap={20} size={1} />
        <Controls />
        <MiniMap pannable zoomable />
      </ReactFlow>
    </div>
  );
}
