// import React, { useEffect, useMemo, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import {
//   AcademicCapIcon,
//   MagnifyingGlassIcon,
//   SignalIcon,
//   CheckCircleIcon,
//   ExclamationTriangleIcon,
//   FunnelIcon,
// } from "@heroicons/react/24/solid";
// import { fetchLecturerCourses } from "../../api/api";

// export default function LecturerCourses() {
//   const [search, setSearch] = useState("");
//   const [year, setYear] = useState("all");
//   const [courses, setCourses] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const user = JSON.parse(localStorage.getItem("csmsUser") || "null");
//     if (!user) return;

//     // Resolve department id from different possible shapes on the user object
//     let deptId = null;
//     if (
//       typeof user.department === "number" ||
//       typeof user.department === "string"
//     ) {
//       deptId = user.department;
//     } else if (user.department && user.department.id) {
//       deptId = user.department.id;
//     } else if (user.department_id) {
//       deptId = user.department_id;
//     } else if (user.departmentId) {
//       deptId = user.departmentId;
//     }

//     setLoading(true);
//     fetchLecturerCourses({
//       lecturerId: user.id,
//       departmentId: deptId,
//     })
//       .then((data) => setCourses(data || []))
//       .finally(() => setLoading(false));
//   }, []);

//   // Years are now derived directly from the courses data coming from the backend
//   const years = useMemo(
//     () =>
//       Array.from(
//         new Set((courses || []).map((c) => c.year ?? c.course_year ?? c.year_of_study))
//       )
//         .filter((y) => y !== null && y !== undefined && y !== "")
//         .sort((a, b) => Number(a) - Number(b)),
//     [courses]
//   );

//   const filtered = useMemo(
//     () =>
//       courses.filter((c) => {
//         const matchesSearch =
//           c.name.toLowerCase().includes(search.toLowerCase()) ||
//           String(c.code).toLowerCase().includes(search.toLowerCase());
//         const yearValue = c.year ?? c.course_year ?? c.year_of_study;
//         const matchesYear =
//           year === "all" || String(yearValue) === String(year);
//         return matchesSearch && matchesYear;
//       }),
//     [courses, search, year]
//   );

//   const statusBadge = (course) => {
//     if (course.latest_syllabus) {
//       return (
//         <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold">
//           <CheckCircleIcon className="h-4 w-4" />
//           {course.latest_syllabus.status || "Has syllabus"}
//         </span>
//       );
//     }
//     return (
//       <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold">
//         <ExclamationTriangleIcon className="h-4 w-4" />
//         No syllabus yet
//       </span>
//     );
//   };

//   return (
//     <div className="space-y-6">
//       <div className="flex flex-col gap-2">
//         <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-700">
//           <AcademicCapIcon className="h-4 w-4" />
//           Courses
//         </div>
//         <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
//           Current semester courses
//         </h1>
//         <p className="text-sm text-slate-600 max-w-3xl">
//           Track syllabus status per course. Click a course to open all versions from
//           current and previous semesters.
//         </p>
//       </div>

//       <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 md:p-5 space-y-4">
//         <div className="grid grid-cols-1 md:grid-cols-[1.2fr,0.5fr] gap-3">
//           <div className="relative">
//             <MagnifyingGlassIcon className="h-5 w-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
//             <input
//               type="text"
//               placeholder="Search course name or code"
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//               className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-3 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 outline-none"
//             />
//           </div>
//           <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50/60">
//             <FunnelIcon className="h-5 w-5 text-slate-400" />
//             <select
//               value={year}
//               onChange={(e) => setYear(e.target.value)}
//               className="bg-transparent text-sm text-slate-800 flex-1 outline-none"
//             >
//               <option value="all">Year</option>
//               {years.map((y) => (
//                 <option key={y} value={y}>
//                   {y}
//                 </option>
//               ))}
//             </select>
//           </div>
//         </div>

//         <div className="grid gap-3">
//           {filtered.map((course) => (
//             <button
//               key={course.id}
//               type="button"
//               onClick={() => navigate(`/lecturer/courses/${course.id}`)}
//               className="w-full text-left rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm hover:border-indigo-200 hover:shadow-md transition flex flex-col md:flex-row md:items-center md:justify-between gap-3"
//             >
//               <div className="space-y-1">
//                 <div className="text-sm font-semibold text-slate-900">
//                   {course.name} • {course.code}
//                 </div>
//                 <div className="text-xs text-slate-500">
//                   {course.latest_syllabus?.updated_at
//                     ? `Last updated: ${course.latest_syllabus.updated_at.slice(0, 10)}`
//                     : "No syllabus submitted yet"}
//                 </div>
//               </div>
//               <div className="flex items-center gap-3">
//                 {statusBadge(course)}
//                 <SignalIcon className="h-4 w-4 text-slate-400" />
//               </div>
//             </button>
//           ))}

//           {loading && (
//             <div className="text-sm text-slate-500 border border-dashed border-slate-200 rounded-xl p-6 text-center">
//               Loading...
//             </div>
//           )}

//           {!loading && filtered.length === 0 && (
//             <div className="text-sm text-slate-500 border border-dashed border-slate-200 rounded-xl p-6 text-center">
//               No courses found for this semester.
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }


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
} from "@heroicons/react/24/solid";
import { fetchLecturerCourses, fetchDeptCourses, fetchYears } from "../../api/api";

export default function LecturerCourses() {
  const [search, setSearch] = useState("");
  const [year, setYear] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");
  const [courses, setCourses] = useState([]);
  const [yearOptions, setYearOptions] = useState([]); // ✅ NEW
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const getCourseId = (c) => c?.id ?? c?.course_id ?? c?.courseId ?? null;
  const getCourseName = (c) => c?.name ?? c?.course_name ?? "";
  const getCourseCode = (c) => c?.code ?? c?.course_code ?? "";
  const getCourseYear = (c) => c?.year ?? c?.course_year ?? null;

  // ✅ small helper (same logic you already used)
  const getDeptIdFromUser = (user) => {
    if (!user) return null;
    if (typeof user.department === "number" || typeof user.department === "string") return user.department;
    if (user.department?.id) return user.department.id;
    if (user.department_id) return user.department_id;
    if (user.departmentId) return user.departmentId;
    return null;
  };

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
    fetchDeptCourses({ departmentId: deptId }), // ✅ fallback source
    fetchYears(deptId),
  ])
    .then(([lecturerList, deptList, yearsData]) => {
      const listToUse =
        Array.isArray(lecturerList) && lecturerList.length > 0
          ? lecturerList
          : Array.isArray(deptList)
          ? deptList
          : [];

      console.log("LecturerCourses list used:", listToUse);
      setCourses(listToUse);
      setYearOptions(Array.isArray(yearsData) ? yearsData : []);
    })
    .finally(() => setLoading(false));
}, []);


  // ✅ Year dropdown = department years (fallback: derive from courses if dept years empty)
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

  useEffect(() => {
    if (year !== "all" && !years.some((y) => String(y) === String(year))) setYear("all");
  }, [years, year]);

  useEffect(() => {
    if (courseFilter !== "all" && !courseOptions.some((c) => String(c.value) === String(courseFilter))) {
      setCourseFilter("all");
    }
  }, [courseOptions, courseFilter]);

  const filtered = useMemo(
    () =>
      (courses || []).filter((c) => {
        const name = getCourseName(c);
        const code = getCourseCode(c);
        const matchesSearch =
          name.toLowerCase().includes(search.toLowerCase()) ||
          String(code).toLowerCase().includes(search.toLowerCase());

        const yearValue = getCourseYear(c);
        const matchesYear = year === "all" || String(yearValue) === String(year);
        const matchesCourse = courseFilter === "all" || String(getCourseId(c)) === String(courseFilter);

        return matchesSearch && matchesYear && matchesCourse;
      }),
    [courses, search, year, courseFilter]
  );

  const statusBadge = (course) => {
    if (course.latest_syllabus) {
      return (
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold">
          <CheckCircleIcon className="h-4 w-4" />
          {course.latest_syllabus.status || "Has syllabus"}
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
        {/* ✅ add Course filter */}
        <div className="grid grid-cols-1 md:grid-cols-[1.2fr,0.5fr,0.7fr] gap-3">
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

          <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50/60">
            <FunnelIcon className="h-5 w-5 text-slate-400" />
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
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
              {courseOptions.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-3">
          {filtered.map((course) => (
            <button
              key={getCourseId(course) ?? course.id}
              type="button"
              onClick={() => navigate(`/lecturer/courses/${getCourseId(course)}`)}
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
