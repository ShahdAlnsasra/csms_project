import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download } from "lucide-react";
import { toPng } from "html-to-image";
import {
  fetchStudentDepartment,
  fetchStudentDepartmentCourses,
} from "../../api/api";
import CourseDiagram from "../../components/CourseDiagramSvg";

function getYearColor(y) {
  if (y === 1) return "#fef3c7";
  if (y === 2) return "#dbeafe";
  if (y === 3) return "#dcfce7";
  return "#fee2e2";
}

function YearsLegend({ totalYears }) {
  if (!totalYears) return null;
  const maxYear = Math.max(1, Math.min(totalYears, 4));
  const items = [];
  for (let y = 1; y <= maxYear; y += 1) {
    items.push(
      <div
        key={y}
        className="flex items-center gap-2 text-[11px] text-slate-600"
      >
        <span
          className="h-3 w-5 rounded-sm border border-slate-200"
          style={{ background: getYearColor(y) }}
        />
        <span>Year {y}</span>
      </div>
    );
  }
  if (totalYears > 4) {
    items.push(
      <div key="more" className="text-[10px] text-slate-500">
        + Years {maxYear + 1}+
      </div>
    );
  }
  return (
    <div className="inline-flex items-center gap-4 rounded-2xl bg-white border border-slate-200 px-4 py-2 shadow-sm">
      <span className="text-[11px] font-semibold text-slate-700 mr-1">
        Year color legend:
      </span>
      {items}
    </div>
  );
}

export default function StudentCourseDiagramPage() {
  const navigate = useNavigate();
  const diagramBoxRef = useRef(null);

  const [department, setDepartment] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    async function loadAll() {
      try {
        setLoading(true);
        setError("");
        const dept = await fetchStudentDepartment();
        setDepartment(dept);
        const list = await fetchStudentDepartmentCourses();
        setCourses(list || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load curriculum diagram.");
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  const handleCourseClick = (course) => {
    navigate(`/student/courses/${course.id}?from=diagram`);
  };

  const handleDownloadImage = async () => {
    const node = diagramBoxRef.current;
    if (!node) return;
    try {
      setExporting(true);
      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#f8fafc",
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `curriculum_diagram_${department?.code || "dept"}.png`;
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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
            Curriculum diagram
          </h1>
          <p className="mt-1 text-sm text-slate-600 max-w-2xl">
            Full department curriculum from Year 1 to Year 4. Hover a course for
            prerequisites, click to open details.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => navigate("/student/dashboard")}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
          </button>
          <button
            type="button"
            onClick={handleDownloadImage}
            disabled={exporting || courses.length === 0}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md"
          >
            <Download className="h-3.5 w-3.5" />
            {exporting ? "Exporting…" : "Download diagram (PNG)"}
          </button>
          {department && (
            <div className="px-4 py-2 rounded-2xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-800">
              <div className="font-semibold">
                {department.code} · {department.name}
              </div>
              <div className="mt-0.5">
                {department.years_of_study} years ·{" "}
                {department.semesters_per_year} semesters/year
              </div>
            </div>
          )}
        </div>
      </div>

      {department && courses.length > 0 && (
        <div className="flex justify-end">
          <YearsLegend totalYears={department.years_of_study} />
        </div>
      )}

      <div ref={diagramBoxRef} className="rounded-3xl overflow-hidden border border-slate-200 shadow-inner bg-slate-50">
        {loading ? (
          <div className="p-8 text-sm text-slate-500">Loading diagram…</div>
        ) : error ? (
          <div className="p-8 text-sm text-red-600">{error}</div>
        ) : courses.length === 0 ? (
          <div className="p-8 text-sm text-slate-500 italic">
            No courses defined yet for this department.
          </div>
        ) : (
          <CourseDiagram courses={courses} onCourseClick={handleCourseClick} />
        )}
      </div>
    </div>
  );
}
