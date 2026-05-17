import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  AcademicCapIcon,
  MagnifyingGlassIcon,
  SignalIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  ClockIcon,
} from "@heroicons/react/24/solid";
import FancySelect from "../../components/FancySelect";
import {
  fetchLecturerCourses,
  fetchLecturerOfferings,
  fetchTerms,
  fetchYears,
} from "../../api/api";

export default function LecturerCourses() {
  const [search, setSearch] = useState("");
  const [year, setYear] = useState("all");
  const [degreeTrack, setDegreeTrack] = useState("all");
  const [years, setYears] = useState([]);
  const [courses, setCourses] = useState([]);
  const [terms, setTerms] = useState([]);
  const [termId, setTermId] = useState("");
  const [offeringCourses, setOfferingCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const loadCourses = useCallback((user, tid) => {
    setLoading(true);
    const params = {
      lecturerId: user.id,
      departmentId: user.department,
    };
    if (tid) params.termId = tid;
    fetchLecturerCourses(params)
      .then((data) => setCourses(data || []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("csmsUser") || "null");
    if (!user) return;

    fetchYears(user.department).then((y) => setYears(y || []));
    fetchTerms().then((t) => {
      const list = Array.isArray(t) ? t : [];
      setTerms(list);
      const current = list.find((x) => x.is_current);
      const tid = current ? String(current.id) : list[0] ? String(list[0].id) : "";
      if (tid) setTermId(tid);
    });
  }, []);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("csmsUser") || "null");
    if (!user || !termId) return;
    loadCourses(user, termId);
    fetchLecturerOfferings(termId).then((list) => {
      const mapped = (list || []).map((o) => ({
        id: o.course,
        name: o.course_name,
        code: o.course_code,
      }));
      setOfferingCourses(mapped);
    });
  }, [termId, loadCourses]);

  const filtered = useMemo(
    () =>
      courses.filter((c) => {
        const matchesSearch =
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          String(c.code).toLowerCase().includes(search.toLowerCase());
        const matchesYear = year === "all" || c.year === Number(year);
        const matchesDegree =
          degreeTrack === "all" || (c.degree_track || "").toUpperCase() === degreeTrack;
        return matchesSearch && matchesYear && matchesDegree;
      }),
    [courses, search, year, degreeTrack]
  );
  const yearOptions = [
    { value: "all", label: "Year" },
    ...years.map((y) => ({ value: String(y), label: `Year ${y}` })),
  ];
  const degreeOptions = [
    { value: "all", label: "All Degrees" },
    { value: "BSC", label: "B.Sc." },
    { value: "MSC", label: "M.Sc." },
  ];
  const shortTerms = useMemo(() => (Array.isArray(terms) ? terms.slice(0, 10) : []), [terms]);
  const courseById = useMemo(() => {
    const map = new Map();
    courses.forEach((c) => map.set(c.id, c));
    return map;
  }, [courses]);
  const displayedOfferingCourses = useMemo(() => {
    if (degreeTrack === "all") return offeringCourses;
    return offeringCourses.filter((c) => {
      const full = courseById.get(c.id);
      return (full?.degree_track || "").toUpperCase() === degreeTrack;
    });
  }, [offeringCourses, degreeTrack, courseById]);

  const termOptions = shortTerms.map((t) => ({
    value: String(t.id),
    label: `${t.academic_year} · ${t.semester}${t.is_current ? " (Current)" : ""}`,
  }));

  const statusBadge = (course) => {
    if (course.latest_syllabus) {
      const status = String(course.latest_syllabus.status || "").toUpperCase();
      const statusColors = {
        APPROVED: "bg-emerald-100 text-emerald-700 border-emerald-200",
        REJECTED: "bg-rose-100 text-rose-700 border-rose-200",
        PENDING_REVIEW: "bg-amber-100 text-amber-800 border-amber-200",
        PENDING_DEPT: "bg-amber-100 text-amber-800 border-amber-200",
        DRAFT: "bg-slate-100 text-slate-700 border-slate-200",
      };
      const colorClass = statusColors[status] || "bg-slate-100 text-slate-700 border-slate-200";
      const statusLabel = {
        APPROVED: "Approved",
        REJECTED: "Rejected",
        PENDING_REVIEW: "Pending reviewer",
        PENDING_DEPT: "Pending department",
        DRAFT: "Draft",
      };
      const label = statusLabel[status] || status || "Has syllabus";
      
      return (
        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold ${colorClass}`}>
          {status === "APPROVED" ? (
            <CheckCircleIcon className="h-4 w-4" />
          ) : status === "REJECTED" ? (
            <ExclamationTriangleIcon className="h-4 w-4" />
          ) : (
            <ClockIcon className="h-4 w-4" />
          )}
          {label}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold">
        <ExclamationTriangleIcon className="h-4 w-4" />
        No syllabus yet
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-700">
          <AcademicCapIcon className="h-4 w-4" />
          Courses
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
          Current semester courses
        </h1>
        <p className="text-sm text-slate-600 max-w-3xl">
          Track syllabus status per course. Click a course to open all versions from
          current and previous semesters.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 md:p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_minmax(0,11rem)_minmax(0,11rem)] gap-3 items-end">
          <div className="relative min-w-0">
            <MagnifyingGlassIcon className="h-5 w-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search course name or code"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-3 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 outline-none"
            />
          </div>
          <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-2 py-1.5 bg-slate-50/60 min-w-0">
            <FunnelIcon className="h-4 w-4 text-slate-400 shrink-0 hidden sm:block" />
            <div className="min-w-0 flex-1">
              <FancySelect
                value={year}
                onChange={(v) => setYear(String(v))}
                options={yearOptions}
                compact
                placeholder="Catalog year"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-2 py-1.5 bg-slate-50/60 min-w-0">
            <FunnelIcon className="h-4 w-4 text-slate-400 shrink-0 hidden sm:block" />
            <div className="min-w-0 flex-1">
              <FancySelect
                value={degreeTrack}
                onChange={(v) => setDegreeTrack(String(v))}
                options={degreeOptions}
                compact
                placeholder="Degree"
              />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 shrink-0">
            <ClockIcon className="h-4 w-4 text-indigo-500" />
            Term
          </div>
          <div className="w-full sm:w-64 md:w-72 max-w-full min-w-0">
            <FancySelect
              value={termId}
              onChange={(v) => setTermId(String(v))}
              options={termOptions}
              placeholder="Academic term"
              compact
              optionsMaxHeightClass="max-h-56"
            />
          </div>
          <p className="text-[11px] text-slate-500 w-full sm:w-auto sm:flex-1 sm:min-w-[12rem]">
            Lists courses you are assigned to for this term (department offerings). Shorter list — change
            term to see other semesters.
          </p>
        </div>

        {displayedOfferingCourses.length > 0 && (
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-3">
            <p className="text-xs font-semibold text-indigo-700 mb-2">Assigned in selected term</p>
            <div className="flex flex-wrap gap-2">
              {displayedOfferingCourses.map((c) => (
                <span key={`o-${c.id}`} className="rounded-full bg-white border border-indigo-200 px-2.5 py-1 text-xs text-slate-700">
                  {c.code} · {c.name}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-3 max-h-[22rem] overflow-y-auto pr-1">
          {filtered.map((course) => (
            <button
              key={course.id}
              type="button"
              onClick={() => navigate(`/lecturer/courses/${course.id}`)}
              className="w-full text-left rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm hover:border-indigo-200 hover:shadow-md transition flex flex-col md:flex-row md:items-center md:justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="text-sm font-semibold text-slate-900">
                  {course.name} • {course.code}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 font-semibold text-indigo-700">
                    {(course.degree_track || "BSC").toUpperCase()}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-slate-600">
                    Year {course.year} · Sem {course.semester}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-emerald-700">
                    {course.planning_type === "ELECTIVE" ? "Elective" : "Mandatory"}
                  </span>
                </div>
                <div className="text-xs text-slate-500">
                  {course.latest_syllabus?.updated_at
                    ? `Last updated: ${course.latest_syllabus.updated_at.slice(0, 10)}`
                    : "No syllabus submitted yet"}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {statusBadge(course)}
                <SignalIcon className="h-4 w-4 text-slate-400" />
              </div>
            </button>
          ))}

          {loading && (
            <div className="text-sm text-slate-500 border border-dashed border-slate-200 rounded-xl p-6 text-center">
              Loading...
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="text-sm text-slate-500 border border-dashed border-slate-200 rounded-xl p-6 text-center">
              No courses found for this semester.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

