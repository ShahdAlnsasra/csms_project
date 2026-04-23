import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Network } from "lucide-react";
import { toPng } from "html-to-image";
import CourseDiagram from "../../components/CourseDiagramSvg";
import {
  downloadAdminCourseSyllabusPdf,
  fetchAdminDepartments,
  fetchDeptCourses,
} from "../../api/api";

function getDegreeLabel(deg) {
  if (deg === "MSC") return "M.Sc.";
  if (deg === "BOTH") return "B.Sc. + M.Sc.";
  return "B.Sc.";
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

function AnimatedCourseGraphPreview({
  courses,
  progress,
  phaseText,
  showProgress,
  onCourseClick,
  exportRef,
}) {
  const [zoom, setZoom] = useState(1);
  const [hoveredId, setHoveredId] = useState(null);
  const { nodes, edges, width, height, prereqMap, dependentMap } = useMemo(() => {
    const list = Array.isArray(courses) ? courses : [];
    if (!list.length) {
      return {
        nodes: [],
        edges: [],
        width: 900,
        height: 520,
        prereqMap: new Map(),
        dependentMap: new Map(),
      };
    }

    const COL_WIDTH = 260 * zoom;
    const ROW_HEIGHT = 95 * zoom;
    const CARD_W = 175 * zoom;
    const CARD_H = 48 * zoom;
    const PADDING_X = 48 * zoom;
    const PADDING_Y = 54 * zoom;

    const grouped = {};
    list.forEach((c) => {
      const sem = c.semester || "A";
      const key = `${c.year}-${sem}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(c);
    });

    const colKeys = Object.keys(grouped).sort((a, b) => {
      const [ya, sa] = a.split("-");
      const [yb, sb] = b.split("-");
      const na = Number(ya);
      const nb = Number(yb);
      if (na !== nb) return na - nb;
      const order = { A: 0, B: 1, SUMMER: 2 };
      return (order[sa] ?? 9) - (order[sb] ?? 9);
    });

    const colIndex = new Map();
    colKeys.forEach((k, idx) => colIndex.set(k, idx));

    const nodesLocal = [];
    let maxCol = 0;
    let maxRow = 0;
    colKeys.forEach((key) => {
      const col = colIndex.get(key);
      const items = grouped[key].sort((a, b) =>
        String(a.code || "").localeCompare(String(b.code || ""))
      );
      items.forEach((c, row) => {
        const x = PADDING_X + col * COL_WIDTH;
        const y = PADDING_Y + row * ROW_HEIGHT + 40;
        nodesLocal.push({ ...c, x, y, w: CARD_W, h: CARD_H });
        maxCol = Math.max(maxCol, col);
        maxRow = Math.max(maxRow, row);
      });
    });

    const posById = new Map(nodesLocal.map((n) => [n.id, n]));
    const prereqMapLocal = new Map();
    const dependentMapLocal = new Map();
    const edgesLocal = [];
    nodesLocal.forEach((n) => {
      const pids = getPrereqIds(n);
      prereqMapLocal.set(n.id, pids);
      pids.forEach((pid) => {
        const from = posById.get(pid);
        const to = posById.get(n.id);
        if (!from || !to) return;
        if (!dependentMapLocal.has(pid)) dependentMapLocal.set(pid, []);
        dependentMapLocal.get(pid).push(n.id);
        const x1 = from.x + from.w;
        const y1 = from.y + from.h / 2;
        const x2 = to.x;
        const y2 = to.y + to.h / 2;
        const mx = (x1 + x2) / 2;
        edgesLocal.push({
          id: `${pid}->${n.id}`,
          fromId: pid,
          toId: n.id,
          d: `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`,
        });
      });
    });

    return {
      nodes: nodesLocal,
      edges: edgesLocal,
      width: PADDING_X * 2 + (maxCol + 1) * COL_WIDTH + CARD_W,
      height: PADDING_Y * 2 + (maxRow + 1) * ROW_HEIGHT + 130,
      prereqMap: prereqMapLocal,
      dependentMap: dependentMapLocal,
    };
  }, [courses, zoom]);

  const visibleNodes = Math.max(
    1,
    Math.min(
      nodes.length,
      showProgress ? Math.floor((progress / 100) * nodes.length) : nodes.length
    )
  );
  const visibleEdges = Math.max(
    0,
    Math.min(
      edges.length,
      showProgress ? Math.floor((progress / 100) * edges.length) : edges.length
    )
  );
  const hoveredPrereqs = hoveredId ? prereqMap.get(hoveredId) || [] : [];
  const hoveredDependents = hoveredId ? dependentMap.get(hoveredId) || [] : [];
  const byId = useMemo(() => {
    const map = new Map();
    nodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [nodes]);

  const stagedLabels = [
    "Parsing department courses",
    "Positioning year/semester nodes",
    "Tracing prerequisite paths",
    "Optimizing graph layout",
    "Finalizing interactions",
  ];
  const visibleCount = Math.max(
    1,
    Math.min(stagedLabels.length, Math.floor((progress / 100) * stagedLabels.length))
  );
  return (
    <div className="h-[78vh] min-h-[700px] relative overflow-hidden bg-gradient-to-br from-slate-50 via-indigo-50/40 to-violet-50/30">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.12),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(139,92,246,0.1),transparent_40%)]" />
      {showProgress && (
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-3 rounded-xl border border-indigo-100 bg-white/90 px-3 py-2 text-xs text-indigo-700 shadow-sm z-30">
          <span className="font-semibold">{phaseText || "Building course graph..."}</span>
          <span className="rounded-md bg-indigo-50 border border-indigo-100 px-2 py-0.5 font-bold">
            {progress}%
          </span>
        </div>
      )}
      <div className="absolute right-4 top-16 z-30 flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(2.2, z + 0.2))}
          className="px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(0.7, z - 0.2))}
          className="px-3 py-1 text-xs font-semibold text-slate-700 border-t border-slate-200 hover:bg-slate-50"
        >
          -
        </button>
        <button
          type="button"
          onClick={() => setZoom(1)}
          className="px-3 py-1 text-[10px] text-slate-600 border-t border-slate-200 hover:bg-slate-50"
        >
          reset
        </button>
      </div>
      {!showProgress && (
        <div className="absolute left-4 top-4 z-30 rounded-xl border border-indigo-100 bg-white/90 px-3 py-2 text-xs text-indigo-700 shadow-sm">
          Hover a course to isolate related links. Click for details.
        </div>
      )}
      <div className="absolute inset-0 overflow-auto">
        <div
          ref={exportRef}
          className="relative mx-auto mt-14"
          style={{ width, height, background: "#f8fafc" }}
        >
          <svg width={width} height={height} className="absolute inset-0">
            <defs>
              <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
            {edges.slice(0, visibleEdges).map((e, idx) => {
              const connected =
                hoveredId &&
                (hoveredId === e.fromId ||
                  hoveredId === e.toId ||
                  hoveredPrereqs.includes(e.fromId) ||
                  hoveredDependents.includes(e.toId));
              const dimmed = hoveredId && !connected;
              const stroke = connected ? "url(#g1)" : "#94a3b8";
              const lineOpacity = dimmed ? 0.08 : connected ? 1 : 0.24;
              return (
                <path
                  key={e.id}
                  d={e.d}
                  stroke={stroke}
                  strokeWidth={
                    connected
                      ? Math.max(2.8, zoom * 2.6)
                      : Math.max(1.4, zoom * 1.4)
                  }
                  fill="none"
                  strokeDasharray={Math.max(300, 420 * zoom)}
                  strokeDashoffset={
                    showProgress ? Math.max(300, 420 * zoom) : 0
                  }
                  opacity={lineOpacity}
                >
                  {showProgress && (
                    <animate
                      attributeName="stroke-dashoffset"
                      from={Math.max(300, 420 * zoom)}
                      to="0"
                      begin={`${0.1 + idx * 0.05}s`}
                      dur="0.7s"
                      fill="freeze"
                    />
                  )}
                </path>
              );
            })}
          </svg>
          {nodes.slice(0, visibleNodes).map((n, idx) => (
            <div
              key={n.id}
              className="absolute rounded-xl border bg-white/95 shadow-sm px-2 py-1.5 text-[11px] cursor-pointer transition"
              style={{
                left: n.x,
                top: n.y,
                width: n.w,
                height: n.h,
                borderColor:
                  hoveredId === n.id
                    ? "#4f46e5"
                    : hoveredPrereqs.includes(n.id)
                    ? "#10b981"
                    : hoveredDependents.includes(n.id)
                    ? "#0ea5e9"
                    : "#e2e8f0",
                boxShadow:
                  hoveredId === n.id
                    ? "0 8px 22px rgba(79,70,229,0.22)"
                    : "0 2px 8px rgba(15,23,42,0.08)",
                animation: showProgress ? "fadeIn .35s ease forwards" : undefined,
                animationDelay: `${0.05 + idx * 0.04}s`,
                opacity: showProgress ? 0 : 1,
              }}
              onMouseEnter={() => setHoveredId(n.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => onCourseClick && onCourseClick(n)}
            >
              <div className="font-semibold text-slate-800 truncate" style={{ fontSize: `${Math.max(9, 11 * zoom)}px` }}>
                {n.code} - {n.name}
              </div>
              <div className="text-slate-500" style={{ fontSize: `${Math.max(8, 10 * zoom)}px` }}>
                Year {n.year} · Sem {n.semester}
              </div>
              {!showProgress && hoveredId === n.id && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-56 rounded-xl border border-slate-200 bg-white shadow-xl p-2 z-40 text-[10px] text-slate-700">
                  <div className="font-semibold text-[11px] text-slate-900">
                    {n.code} · {n.name}
                  </div>
                  <div className="mt-1">
                    Credits: {n.credits} · Year {n.year} · Sem {n.semester}
                  </div>
                  <div className="mt-1 text-slate-600">
                    Prerequisites:{" "}
                    {(prereqMap.get(n.id) || [])
                      .map((id) => byId.get(id)?.code)
                      .filter(Boolean)
                      .join(", ") || "None"}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      {showProgress && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[min(92%,620px)] rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm">
          <div className="mb-2 h-2 w-full rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {stagedLabels.slice(0, visibleCount).map((label) => (
              <span
                key={label}
                className="text-[11px] rounded-full border border-indigo-100 bg-indigo-50 px-2 py-1 text-indigo-700"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      )}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default function SystemAdminDepartmentDiagrams() {
  const navigate = useNavigate();
  const diagramRef = useRef(null);
  const aiExportRef = useRef(null);

  const [departments, setDepartments] = useState([]);
  const [selectedDeptId, setSelectedDeptId] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationPhase, setGenerationPhase] = useState("Preparing data...");
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [previewCourses, setPreviewCourses] = useState([]);
  const [diagramMode, setDiagramMode] = useState("ai");
  const [selectedDegree, setSelectedDegree] = useState("BSC");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const selectedDepartment = useMemo(
    () =>
      departments.find((d) => String(d.id) === String(selectedDeptId)) || null,
    [departments, selectedDeptId]
  );
  const coursesById = useMemo(() => {
    const map = new Map();
    (courses || []).forEach((c) => map.set(c.id, c));
    return map;
  }, [courses]);
  const selectedPrerequisites = useMemo(() => {
    if (!selectedCourse) return [];
    const ids = getPrereqIds(selectedCourse);
    return ids.map((id) => coursesById.get(id)).filter(Boolean);
  }, [selectedCourse, coursesById]);
  const selectedDependents = useMemo(() => {
    if (!selectedCourse) return [];
    return (courses || []).filter((c) =>
      getPrereqIds(c).includes(selectedCourse.id)
    );
  }, [selectedCourse, courses]);

  useEffect(() => {
    async function loadDepartments() {
      try {
        setLoadingDepartments(true);
        setError("");
        const deps = await fetchAdminDepartments();
        const list = Array.isArray(deps) ? deps : [];
        setDepartments(list);
        if (list.length > 0) {
          setSelectedDeptId(list[0].id);
        }
      } catch (e) {
        console.error(e);
        setError("Failed to load departments.");
      } finally {
        setLoadingDepartments(false);
      }
    }
    loadDepartments();
  }, []);

  useEffect(() => {
    if (!selectedDepartment) return;
    if (selectedDepartment.degree === "MSC") {
      setSelectedDegree("MSC");
    } else {
      setSelectedDegree("BSC");
    }
  }, [selectedDepartment]);

  useEffect(() => {
    let cancelled = false;
    let hideTimer = null;
    async function loadCourses() {
      if (!selectedDeptId) {
        setCourses([]);
        setPreviewCourses([]);
        return;
      }
      const startedAt = Date.now();
      let progressTimer = null;
      try {
        setLoadingCourses(true);
        setIsGenerating(true);
        setGenerationProgress(7);
        setGenerationPhase("Preparing data...");
        setPreviewCourses([]);
        setError("");
        progressTimer = setInterval(() => {
          if (cancelled) return;
          setGenerationProgress((prev) => {
            const next = Math.min(92, prev + (prev < 45 ? 7 : prev < 75 ? 4 : 2));
            if (next < 25) setGenerationPhase("Parsing department courses...");
            else if (next < 50) setGenerationPhase("Placing nodes by year and semester...");
            else if (next < 75) setGenerationPhase("Drawing prerequisite connections...");
            else setGenerationPhase("Applying interaction layer...");
            return next;
          });
        }, 140);
        const degreeTrack =
          selectedDepartment?.degree === "BOTH" ? selectedDegree : selectedDepartment?.degree;
        const list = await fetchDeptCourses({
          departmentId: selectedDeptId,
          degreeTrack: degreeTrack || undefined,
        });
        if (!cancelled) {
          const normalized = Array.isArray(list) ? list : [];
          setCourses(normalized);
          setPreviewCourses(normalized);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) setError("Failed to load department curriculum.");
      } finally {
        if (progressTimer) clearInterval(progressTimer);
        if (!cancelled) {
          setLoadingCourses(false);
          const elapsed = Date.now() - startedAt;
          setGenerationProgress(100);
          setGenerationPhase("Complete.");
          const minAnimationMs = 1900;
          const waitMs = Math.max(0, minAnimationMs - elapsed);
          hideTimer = setTimeout(() => {
            if (!cancelled) setIsGenerating(false);
          }, waitMs);
        }
      }
    }
    loadCourses();
    return () => {
      cancelled = true;
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [selectedDeptId, selectedDegree, selectedDepartment]);

  const handleDownload = async () => {
    const node =
      diagramMode === "ai" ? aiExportRef.current || diagramRef.current : diagramRef.current;
    if (!node || !selectedDepartment) return;
    try {
      setExporting(true);
      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#f8fafc",
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `department_diagram_${selectedDepartment.code || selectedDepartment.id}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      console.error(e);
      alert("Could not export diagram image.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-white/95 backdrop-blur px-5 py-5 shadow-lg flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 shadow-sm">
            <Network className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-500">
              Visual Curriculum Map
            </p>
            <h1 className="mt-1 text-xl md:text-2xl font-bold text-slate-900">
              Department Diagrams
            </h1>
            <p className="mt-2 text-sm text-slate-600 max-w-3xl">
              Explore each department’s curriculum map. Hover courses to inspect
              prerequisites and click a course card to open a quick detail panel.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate("/system-admin/departments/manage")}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to departments
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={exporting || !selectedDepartment || courses.length === 0}
            className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-200"
          >
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-white/20 border border-white/30">
              <Download className="h-3.5 w-3.5" />
            </span>
            {exporting ? "Exporting..." : "Download diagram"}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[320px,1fr] gap-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 mb-3">
            Departments
          </div>
          {loadingDepartments ? (
            <div className="text-sm text-slate-500 py-6">Loading departments...</div>
          ) : departments.length === 0 ? (
            <div className="text-sm text-slate-500 py-6">No departments found.</div>
          ) : (
            <div className="space-y-2 max-h-[620px] overflow-auto pr-1">
              {departments.map((dept) => {
                const active = String(dept.id) === String(selectedDeptId);
                return (
                  <button
                    key={dept.id}
                    type="button"
                    onClick={() => {
                      setSelectedCourse(null);
                      setSelectedDeptId(dept.id);
                    }}
                    className={`w-full text-left rounded-2xl border px-3 py-3 transition ${
                      active
                        ? "bg-indigo-50 border-indigo-200"
                        : "bg-white border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="text-sm font-semibold text-slate-900">
                      {dept.code} - {dept.name}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-600">
                      {getDegreeLabel(dept.degree)} · {dept.years_of_study} years ·{" "}
                      {dept.semesters_per_year} sem/year
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
          {selectedDepartment && (
            <div className="rounded-2xl bg-indigo-50 border border-indigo-100 px-4 py-3">
              <div className="text-sm font-semibold text-indigo-900">
                {selectedDepartment.code} · {selectedDepartment.name}
              </div>
              <div className="text-xs text-indigo-800 mt-1">
                {getDegreeLabel(selectedDepartment.degree)} ·{" "}
                {selectedDepartment.years_of_study} years ·{" "}
                {selectedDepartment.semesters_per_year} semesters per year
              </div>
            </div>
          )}

          <div className="inline-flex rounded-full bg-slate-100 p-1 text-xs font-medium shadow-inner w-fit">
            <button
              type="button"
              onClick={() => setDiagramMode("ai")}
              className={`px-4 py-1.5 rounded-full transition font-semibold ${
                diagramMode === "ai"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-200/70"
                  : "text-slate-600 hover:bg-slate-200"
              }`}
            >
              AI Graph
            </button>
            <button
              type="button"
              onClick={() => setDiagramMode("classic")}
              className={`px-4 py-1.5 rounded-full transition font-semibold ${
                diagramMode === "classic"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-200/70"
                  : "text-slate-600 hover:bg-slate-200"
              }`}
            >
              Classic Diagram
            </button>
          </div>
          {selectedDepartment?.degree === "BOTH" && (
            <div className="inline-flex rounded-full bg-slate-100 p-1 text-xs font-medium shadow-inner w-fit">
              <button
                type="button"
                onClick={() => setSelectedDegree("BSC")}
                className={`px-4 py-1.5 rounded-full transition font-semibold ${
                  selectedDegree === "BSC"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200/70"
                    : "text-slate-600 hover:bg-slate-200"
                }`}
              >
                B.Sc.
              </button>
              <button
                type="button"
                onClick={() => setSelectedDegree("MSC")}
                className={`px-4 py-1.5 rounded-full transition font-semibold ${
                  selectedDegree === "MSC"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200/70"
                    : "text-slate-600 hover:bg-slate-200"
                }`}
              >
                M.Sc.
              </button>
            </div>
          )}

          <div ref={diagramRef} className="rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden">
            {courses.length === 0 && (loadingCourses || isGenerating) ? (
              <div className="h-[620px] p-8 text-sm text-slate-500">
                Generating diagram...
              </div>
            ) : courses.length === 0 ? (
              <div className="p-8 text-sm text-slate-500 italic">
                No courses available for this department yet.
              </div>
            ) : diagramMode === "ai" ? (
              previewCourses.length > 0 ? (
                <AnimatedCourseGraphPreview
                  courses={previewCourses}
                  progress={loadingCourses || isGenerating ? generationProgress : 100}
                  phaseText={loadingCourses || isGenerating ? generationPhase : "Complete."}
                  showProgress={loadingCourses || isGenerating}
                  onCourseClick={setSelectedCourse}
                  exportRef={aiExportRef}
                />
              ) : (
                <div className="h-[620px] p-8 text-sm text-slate-500">
                  Generating diagram...
                </div>
              )
            ) : (
              <CourseDiagram
                courses={courses}
                onCourseClick={setSelectedCourse}
                containerClassName="w-full h-[78vh] min-h-[700px] rounded-3xl border border-slate-200 bg-slate-50 overflow-auto relative"
                autoFitToViewport
                viewportHeight={700}
              />
            )}
          </div>
        </div>
      </div>

      {selectedCourse && (
        <div className="fixed inset-0 z-50 bg-slate-900/35 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-600">
                  Course Details
                </p>
                <h2 className="mt-2 text-xl font-bold text-slate-900">
                  {selectedCourse.code} · {selectedCourse.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCourse(null)}
                className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl bg-slate-50 px-3 py-2 text-slate-700">
                <span className="font-semibold">Credits:</span> {selectedCourse.credits}
              </div>
              <div className="rounded-xl bg-slate-50 px-3 py-2 text-slate-700">
                <span className="font-semibold">Year:</span> {selectedCourse.year}
              </div>
              <div className="rounded-xl bg-slate-50 px-3 py-2 text-slate-700">
                <span className="font-semibold">Semester:</span> {selectedCourse.semester}
              </div>
              <div className="rounded-xl bg-slate-50 px-3 py-2 text-slate-700">
                <span className="font-semibold">Code:</span> {selectedCourse.code}
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-700 leading-relaxed">
              {selectedCourse.description || "No description available for this course."}
            </p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                <p className="font-semibold text-slate-900 mb-1">Prerequisites</p>
                {selectedPrerequisites.length === 0 ? (
                  <p className="text-slate-500">None</p>
                ) : (
                  selectedPrerequisites.map((c) => (
                    <p key={c.id} className="text-slate-700">
                      {c.code} - {c.name}
                    </p>
                  ))
                )}
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                <p className="font-semibold text-slate-900 mb-1">Unlocks Courses</p>
                {selectedDependents.length === 0 ? (
                  <p className="text-slate-500">No dependent courses</p>
                ) : (
                  selectedDependents.map((c) => (
                    <p key={c.id} className="text-slate-700">
                      {c.code} - {c.name}
                    </p>
                  ))
                )}
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                disabled={pdfLoading || !selectedCourse?.has_approved_syllabus}
                onClick={async () => {
                  try {
                    setPdfLoading(true);
                    await downloadAdminCourseSyllabusPdf(
                      selectedCourse.id,
                      selectedCourse.name
                    );
                  } catch (e) {
                    let msg = "Could not download syllabus.";
                    const detail = e?.response?.data?.detail;
                    if (typeof detail === "string" && detail.trim()) {
                      msg = detail;
                    } else if (Array.isArray(detail) && detail.length > 0) {
                      msg = String(detail[0]);
                    } else if (e?.response?.status === 404) {
                      msg = "No approved syllabus available yet.";
                    } else if (e?.response?.status === 403) {
                      msg = "You do not have permission to download this syllabus.";
                    }
                    alert(msg);
                  } finally {
                    setPdfLoading(false);
                  }
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold px-3 py-2 shadow-md"
              >
                {pdfLoading ? "Preparing..." : "Download syllabus (PDF)"}
              </button>
            </div>
            {!selectedCourse?.has_approved_syllabus && (
              <p className="mt-2 text-[11px] text-slate-500 text-right">
                No approved syllabus available for download.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
