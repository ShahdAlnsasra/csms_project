import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusCircleIcon,
  DocumentMagnifyingGlassIcon,
} from "@heroicons/react/24/solid";
import {
  fetchLecturerSyllabuses,
  fetchLecturerSyllabusFilters,
  fetchLecturerCourseById,
} from "../../api/api";

const statusColors = {
  APPROVED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  REJECTED: "bg-rose-100 text-rose-700 border-rose-200",
  PENDING_REVIEW: "bg-amber-100 text-amber-800 border-amber-200",
  PENDING_DEPT: "bg-amber-100 text-amber-800 border-amber-200",
  DRAFT: "bg-slate-100 text-slate-700 border-slate-200",
};

export default function LecturerCourseVersions() {
  const { courseId } = useParams();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [semesterFilter, setSemesterFilter] = useState("all");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ statuses: [], years: [], semesters: [] });
  const [courseName, setCourseName] = useState("");
  const navigate = useNavigate();

  const years = useMemo(
    () => filters.years || Array.from(new Set(items.map((v) => v.course_year || v.year))),
    [filters.years, items]
  );

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("csmsUser") || "null");
    if (!user) return;
    setLoading(true);
    fetchLecturerSyllabusFilters({ lecturerId: user.id, courseId }).then((data) =>
      setFilters(data || { statuses: [], years: [], semesters: [] })
    );
    fetchLecturerCourseById({ lecturerId: user.id, courseId }).then((c) =>
      setCourseName(c?.name || courseId)
    );
    fetchLecturerSyllabuses({ lecturerId: user.id, courseId })
      .then((data) => setItems(data || []))
      .finally(() => setLoading(false));
  }, [courseId]);

  const filtered = items.filter((v) => {
    const matchesSearch =
      (v.course_name || "")
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      (v.content || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || v.status === statusFilter;
    const matchesYear =
      yearFilter === "all" || (v.course_year || v.year) === Number(yearFilter);
    const matchesSemester =
      semesterFilter === "all" || (v.course_semester || v.semester) === semesterFilter;
    return matchesSearch && matchesStatus && matchesYear && matchesSemester;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-700">
          <DocumentMagnifyingGlassIcon className="h-4 w-4" />
          {courseId} • Versions
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
          {courseName || "Course"} • Versions
        </h1>
        <p className="text-sm text-slate-600 max-w-3xl">
          Quickly search by status, year, or semester. Open any version to view details
          or start a new draft with AI assistance.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(`/lecturer/courses/${courseId}/new`)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-600 to-sky-500 text-white text-sm font-semibold shadow-lg hover:shadow-xl transition"
        >
          <PlusCircleIcon className="h-5 w-5" />
          Add new syllabus
        </button>
        <div className="text-xs text-slate-500">
          Generate a brand-new syllabus with AI or reuse a prior version.
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 md:p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-[1.4fr,repeat(3,0.6fr)] gap-3">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search version or notes"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-3 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 outline-none"
            />
          </div>
          <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50/60">
            <FunnelIcon className="h-5 w-5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-sm text-slate-800 flex-1 outline-none"
            >
              <option value="all">Status</option>
              {(filters.statuses || []).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50/60">
            <FunnelIcon className="h-5 w-5 text-slate-400" />
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="bg-transparent text-sm text-slate-800 flex-1 outline-none"
            >
              <option value="all">Year</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50/60">
            <FunnelIcon className="h-5 w-5 text-slate-400" />
            <select
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="bg-transparent text-sm text-slate-800 flex-1 outline-none"
            >
              <option value="all">Semester</option>
              {(filters.semesters || []).map((sem) => (
                <option key={sem} value={sem}>
                  {sem}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-3">
          {filtered.map((version) => (
            <div
              key={version.id}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm hover:border-indigo-200 hover:shadow-md transition flex flex-col md:flex-row md:items-center md:justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="text-sm font-semibold text-slate-900">
                  {version.course_name || courseId} • {version.course_semester || version.semester || ""}{" "}
                  {version.course_year || version.year}
                </div>
                <div className="text-xs text-slate-600 line-clamp-2">
                  {(version.content || "").slice(0, 140) || "Syllabus version"}
                </div>
                <div className="text-xs text-slate-500">
                  Updated: {version.updated_at?.slice(0, 10) || ""}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
                    statusColors[version.status] ||
                    "bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  {version.status}
                </span>
                <button
                  type="button"
                  className="text-sm font-semibold text-indigo-700 hover:text-indigo-600"
                  onClick={() =>
                    navigate(`/lecturer/courses/${courseId}/versions/${version.id}`, {
                      state: { version },
                    })
                  }
                >
                  View
                </button>
              </div>
            </div>
          ))}

          {loading && (
            <div className="text-sm text-slate-500 border border-dashed border-slate-200 rounded-xl p-6 text-center">
              Loading...
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="text-sm text-slate-500 border border-dashed border-slate-200 rounded-xl p-6 text-center">
              No versions match your filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

