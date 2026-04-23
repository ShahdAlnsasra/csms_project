import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClockIcon, MagnifyingGlassIcon } from "@heroicons/react/24/solid";
import { fetchLecturerSyllabuses } from "../../api/api";
import FancySelect from "../../components/FancySelect";

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
  const [academicYearFilter, setAcademicYearFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const studyYears = useMemo(() => {
    const ys = Array.from(new Set(items.map((h) => h.course_year))).filter((y) => y != null);
    return ys.sort((a, b) => a - b);
  }, [items]);

  const academicYears = useMemo(() => {
    const ys = Array.from(new Set(items.map((h) => h.academic_year).filter(Boolean)));
    return ys.sort();
  }, [items]);

  const courses = useMemo(() => {
    const cs = Array.from(new Set(items.map((h) => h.course_name))).filter(Boolean);
    return cs.sort((a, b) => a.localeCompare(b));
  }, [items]);

  const statusOptions = useMemo(
    () => [
      { value: "all", label: "All statuses" },
      { value: "APPROVED", label: "Approved" },
      { value: "REJECTED", label: "Rejected" },
      { value: "PENDING_REVIEW", label: "Pending review" },
      { value: "PENDING_DEPT", label: "Pending dept" },
    ],
    []
  );

  const academicYearOptions = useMemo(
    () => [
      { value: "all", label: "All syllabus years" },
      ...academicYears.map((y) => ({ value: y, label: y })),
    ],
    [academicYears]
  );

  const studyYearOptions = useMemo(
    () => [
      { value: "all", label: "All study years" },
      ...studyYears.map((y) => ({ value: String(y), label: `Year ${y} (catalog)` })),
    ],
    [studyYears]
  );

  const courseOptions = useMemo(
    () => [
      { value: "all", label: "All courses" },
      ...courses.map((c) => ({ value: c, label: c })),
    ],
    [courses]
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
    const snippet = [item.purpose, item.course_description].filter(Boolean).join(" ") || "";
    const matchesSearch =
      (item.course_name || "").toLowerCase().includes(search.toLowerCase()) ||
      snippet.toLowerCase().includes(search.toLowerCase()) ||
      (item.academic_year || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const matchesAcademicYear =
      academicYearFilter === "all" || item.academic_year === academicYearFilter;
    const matchesYear = yearFilter === "all" || item.course_year === Number(yearFilter);
    const matchesCourse = courseFilter === "all" || item.course_name === courseFilter;
    return matchesSearch && matchesStatus && matchesAcademicYear && matchesYear && matchesCourse;
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
          Search and filter by status, syllabus academic year (e.g. 2025-2026), catalog study year, or
          course. Open any version for details.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 md:p-5 space-y-4">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12 lg:items-end">
          <div className="relative lg:col-span-12 xl:col-span-5">
            <MagnifyingGlassIcon className="h-5 w-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search syllabus, course, or academic year"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-3 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 outline-none"
            />
          </div>
          <div className="lg:col-span-12 xl:col-span-7 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <FancySelect
              value={statusFilter}
              onChange={(v) => setStatusFilter(String(v))}
              options={statusOptions}
              placeholder="Status"
              compact
            />
            <FancySelect
              value={academicYearFilter}
              onChange={(v) => setAcademicYearFilter(String(v))}
              options={academicYearOptions}
              placeholder="Syllabus year"
              compact
              optionsMaxHeightClass="max-h-56"
            />
            <FancySelect
              value={yearFilter}
              onChange={(v) => setYearFilter(String(v))}
              options={studyYearOptions}
              placeholder="Catalog year"
              compact
            />
            <FancySelect
              value={courseFilter}
              onChange={(v) => setCourseFilter(String(v))}
              options={courseOptions}
              placeholder="Course"
              compact
              optionsMaxHeightClass="max-h-72"
            />
          </div>
        </div>

        <div className="grid gap-3">
          {filtered.map((item) => {
            const preview =
              [item.purpose, item.course_description].filter(Boolean).join(" ") || "Syllabus";
            return (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm hover:border-indigo-200 hover:shadow-md transition flex flex-col md:flex-row md:items-center md:justify-between gap-3"
            >
              <div className="space-y-1 min-w-0">
                <div className="text-sm font-semibold text-slate-900 truncate">
                  {item.course_name}
                  <span className="font-normal text-slate-500">
                    {" "}
                    · {item.course_code} · Sem {item.course_semester || "—"} · catalog Y{item.course_year}
                  </span>
                </div>
                {item.academic_year && (
                  <div className="text-[11px] font-medium text-indigo-700">
                    Syllabus academic year: {item.academic_year}
                  </div>
                )}
                <div className="text-xs text-slate-600 line-clamp-2">
                  {preview.slice(0, 140)}
                </div>
                <div className="text-xs text-slate-500">
                  Updated: {item.updated_at?.slice(0, 10) || ""}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
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
            );
          })}

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
