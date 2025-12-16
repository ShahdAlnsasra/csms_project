import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FunnelIcon, MagnifyingGlassIcon, ClockIcon } from "@heroicons/react/24/solid";
import { fetchLecturerSyllabuses } from "../../api/api";

const statusColors = {
  APPROVED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  REJECTED: "bg-rose-100 text-rose-700 border-rose-200",
  PENDING_REVIEW: "bg-amber-100 text-amber-800 border-amber-200",
  PENDING_DEPT: "bg-amber-100 text-amber-800 border-amber-200",
};

const statusLabel = {
  APPROVED: "Approved",
  REJECTED: "Rejected",
  PENDING_REVIEW: "Pending review",
  PENDING_DEPT: "Pending dept",
};

export default function LecturerHistory() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const years = useMemo(
    () => Array.from(new Set(items.map((h) => h.course_year))).filter(Boolean),
    [items]
  );
  const courses = useMemo(
    () => Array.from(new Set(items.map((h) => h.course_name))).filter(Boolean),
    [items]
  );

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("csmsUser") || "null");
    if (!user) return;
    setLoading(true);
    fetchLecturerSyllabuses({ lecturerId: user.id })
      .then((data) => setItems(data || []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = items.filter((item) => {
    const matchesSearch =
      (item.course_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (item.content || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const matchesYear = yearFilter === "all" || item.course_year === Number(yearFilter);
    const matchesCourse = courseFilter === "all" || item.course_name === courseFilter;
    return matchesSearch && matchesStatus && matchesYear && matchesCourse;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-700">
          <ClockIcon className="h-4 w-4" />
          History
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
          All syllabus versions you have written
        </h1>
        <p className="text-sm text-slate-600 max-w-3xl">
          Search and filter by approval status, year, or course name. Open any version
          to view details with read-only safety.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 md:p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-[1.4fr,repeat(3,0.6fr)] gap-3">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search syllabus or course"
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
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="PENDING_REVIEW">Pending review</option>
              <option value="PENDING_DEPT">Pending dept</option>
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
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="bg-transparent text-sm text-slate-800 flex-1 outline-none"
            >
              <option value="all">Course</option>
              {courses.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm hover:border-indigo-200 hover:shadow-md transition flex flex-col md:flex-row md:items-center md:justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="text-sm font-semibold text-slate-900">
                  {item.course_name} • {item.course_semester || ""} {item.course_year}
                </div>
                <div className="text-xs text-slate-600 line-clamp-2">
                  {(item.content || "").slice(0, 140) || "Syllabus content"}
                </div>
                <div className="text-xs text-slate-500">
                  Updated: {item.updated_at?.slice(0, 10) || ""}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
                    statusColors[item.status] || "bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  {statusLabel[item.status] || item.status}
                </span>
                <button
                  type="button"
                  className="text-sm font-semibold text-indigo-700 hover:text-indigo-600"
                  onClick={() =>
                    navigate(
                      `/lecturer/courses/${item.course || item.course_id || "course"}/versions/${item.id}`,
                      { state: { version: item } }
                    )
                  }
                >
                  View details
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
              No syllabus versions match your filters yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

