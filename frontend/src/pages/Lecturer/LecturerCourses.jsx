// LecturerCourses.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AcademicCapIcon,
  MagnifyingGlassIcon,
  SignalIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  DocumentTextIcon,
  ClockIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/solid";

import FancySelect from "../../components/FancySelect";
import { fetchLecturerCourses, fetchDeptCourses, fetchYears } from "../../api/api";

const statusLabel = {
  DRAFT: "Draft",
  PENDING_REVIEW: "Pending reviewer",
  PENDING_DEPT: "Pending department",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export default function LecturerCourses() {
  const [search, setSearch] = useState("");
  const [year, setYear] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");
  const [syllabusFilter, setSyllabusFilter] = useState("all"); // ✅ NEW
  const [courses, setCourses] = useState([]);
  const [yearOptions, setYearOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const getCourseId = (c) => c?.id ?? c?.course_id ?? c?.courseId ?? null;
  const getCourseName = (c) => c?.name ?? c?.course_name ?? "";
  const getCourseCode = (c) => c?.code ?? c?.course_code ?? "";
  const getCourseYear = (c) => c?.year ?? c?.course_year ?? null;

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("csmsUser") || "null");
    if (!user) return;

    const deptId =
      typeof user.department === "number" || typeof user.department === "string"
        ? user.department
        : user.department?.id || user.department_id || user.departmentId;

    setLoading(true);

    Promise.all([
      fetchLecturerCourses({ lecturerId: user.id, departmentId: deptId }),
      fetchDeptCourses({ departmentId: deptId }),
      fetchYears(deptId),
    ])
      .then(([lecturerList, deptList, yearsArr]) => {
        const listToUse =
          Array.isArray(lecturerList) && lecturerList.length > 0
            ? lecturerList
            : Array.isArray(deptList)
            ? deptList
            : [];

        setCourses(listToUse);
        setYearOptions(Array.isArray(yearsArr) ? yearsArr : []);
      })
      .finally(() => setLoading(false));
  }, []);

  const years = useMemo(() => {
    if (yearOptions.length) return yearOptions;
    return Array.from(new Set((courses || []).map(getCourseYear)))
      .filter((y) => y !== null && y !== undefined && y !== "")
      .sort((a, b) => Number(a) - Number(b));
  }, [yearOptions, courses]);

  const courseOptions = useMemo(() => {
    const map = new Map();
    (courses || []).forEach((c) => {
      const id = getCourseId(c);
      if (!id) return;
      const label = `${getCourseName(c)} • ${getCourseCode(c)}`.trim();
      map.set(String(id), { value: String(id), label });
    });
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [courses]);

  const syllabusOptions = useMemo(
    () => [
      { value: "all", label: "Syllabus" },
      { value: "has", label: "Has syllabus" },
      { value: "none", label: "No syllabus" },
    ],
    []
  );

  const filtered = useMemo(() => {
    return (courses || []).filter((c) => {
      const name = getCourseName(c);
      const code = getCourseCode(c);

      const matchesSearch =
        name.toLowerCase().includes(search.toLowerCase()) ||
        String(code).toLowerCase().includes(search.toLowerCase());

      const yearValue = getCourseYear(c);
      const matchesYear = year === "all" || String(yearValue) === String(year);

      const matchesCourse = courseFilter === "all" || String(getCourseId(c)) === String(courseFilter);

      const hasSyllabus = !!c.latest_syllabus;
      const matchesSyllabus =
        syllabusFilter === "all" ||
        (syllabusFilter === "has" ? hasSyllabus : !hasSyllabus);

      return matchesSearch && matchesYear && matchesCourse && matchesSyllabus;
    });
  }, [courses, search, year, courseFilter, syllabusFilter]);

const statusBadge = (course) => {
  const s = course?.latest_syllabus?.status;

  if (!course.latest_syllabus) {
    return (
      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold">
        <ExclamationTriangleIcon className="h-4 w-4" />
        No syllabus
      </span>
    );
  }

  if (s === "APPROVED") {
    return (
      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold">
        <CheckCircleIcon className="h-4 w-4" />
        Approved
      </span>
    );
  }

  if (s === "REJECTED") {
    return (
      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold">
        <ExclamationTriangleIcon className="h-4 w-4" />
        Rejected
      </span>
    );
  }

  if (s === "DRAFT") {
    return (
      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold">
        <PencilSquareIcon className="h-4 w-4" />
        Draft
      </span>
    );
  }

  // ✅ Pending reviewer (וגם אם בטעות מגיע PENDING_DEPT – נציג אותו אותו דבר)
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold">
      <ClockIcon className="h-4 w-4" />
      Pending reviewer
    </span>
  );
};

  const handleOpenCourse = (course) => {
    const id = getCourseId(course);
    if (!id) return;
    // ✅ אם יש סילבוס – לא נכנסים ל”יצירה” אלא ל־versions
    if (course.latest_syllabus) navigate(`/lecturer/courses/${id}`);
    else navigate(`/lecturer/courses/${id}/new`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-700">
          <AcademicCapIcon className="h-4 w-4" />
          Courses
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">Current semester courses</h1>
        <p className="text-sm text-slate-600 max-w-3xl">
          Track syllabus status per course. If a syllabus exists you’ll enter the versions page; if not, you’ll create the first one.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 md:p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-[1.2fr,0.5fr,0.7fr,0.6fr] gap-3">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search course name or code"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-3 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 outline-none"
            />
          </div>

          <FancySelect
            value={year}
            onChange={setYear}
            icon={FunnelIcon}
            placeholder="Year"
            options={[{ value: "all", label: "Year" }, ...years.map((y) => ({ value: String(y), label: String(y) }))]}
          />

          <FancySelect
            value={courseFilter}
            onChange={setCourseFilter}
            icon={FunnelIcon}
            placeholder="Course"
            options={[{ value: "all", label: "Course" }, ...courseOptions]}
          />

          <FancySelect
            value={syllabusFilter}
            onChange={setSyllabusFilter}
            icon={DocumentTextIcon}
            options={syllabusOptions}
          />
        </div>

        <div className="grid gap-3">
          {filtered.map((course) => (
            <button
              key={getCourseId(course) ?? course.id}
              type="button"
              onClick={() => handleOpenCourse(course)}
              className="w-full text-left rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm hover:border-indigo-200 hover:shadow-md transition flex flex-col md:flex-row md:items-center md:justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="text-sm font-semibold text-slate-900">
                  {getCourseName(course)} • {getCourseCode(course)}
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
