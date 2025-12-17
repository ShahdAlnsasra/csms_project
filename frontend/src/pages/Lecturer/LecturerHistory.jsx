// import React, { useEffect, useMemo, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { FunnelIcon, MagnifyingGlassIcon, ClockIcon } from "@heroicons/react/24/solid";
// import { fetchLecturerSyllabuses } from "../../api/api";

// const statusColors = {
//   APPROVED: "bg-emerald-100 text-emerald-700 border-emerald-200",
//   REJECTED: "bg-rose-100 text-rose-700 border-rose-200",
//   PENDING_REVIEW: "bg-amber-100 text-amber-800 border-amber-200",
//   PENDING_DEPT: "bg-amber-100 text-amber-800 border-amber-200",
// };

// const statusLabel = {
//   APPROVED: "Approved",
//   REJECTED: "Rejected",
//   PENDING_REVIEW: "Pending review",
//   PENDING_DEPT: "Pending dept",
// };

// export default function LecturerHistory() {
//   const [search, setSearch] = useState("");
//   const [statusFilter, setStatusFilter] = useState("all");
//   const [yearFilter, setYearFilter] = useState("all");
//   const [courseFilter, setCourseFilter] = useState("all");
//   const [items, setItems] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const navigate = useNavigate();

//   const years = useMemo(
//     () =>
//       Array.from(
//         new Set(
//           (items || []).map(
//             (h) => h.course_year ?? h.year ?? h.course_year_of_study
//           )
//         )
//       )
//         .filter((y) => y !== null && y !== undefined && y !== "")
//         .sort((a, b) => Number(a) - Number(b)),
//     [items]
//   );

//   const courseOptions = useMemo(() => {
//     const map = new Map();
//     (items || []).forEach((h) => {
//       const id =
//         h.course_id ||
//         (h.course && (h.course.id || h.course.course_id)) ||
//         h.course ||
//         h.id;
//       const label =
//         h.course_name ||
//         (h.course && (h.course.name || h.course.code)) ||
//         h.name ||
//         h.code ||
//         (id ? `Course ${id}` : null);
//       if (!label) return;
//       const key = String(id ?? label);
//       if (!map.has(key)) {
//         map.set(key, { value: key, label });
//       }
//     });
//     return Array.from(map.values()).sort((a, b) =>
//       String(a.label).localeCompare(String(b.label))
//     );
//   }, [items]);

//   useEffect(() => {
//     const user = JSON.parse(localStorage.getItem("csmsUser") || "null");
//     if (!user) return;
//     setLoading(true);
//     fetchLecturerSyllabuses({ lecturerId: user.id })
//       .then((data) => setItems(data || []))
//       .finally(() => setLoading(false));
//   }, []);

//   const filtered = items.filter((item) => {
//     const courseId =
//       item.course_id ||
//       (item.course && (item.course.id || item.course.course_id)) ||
//       item.course;
//     const courseLabel =
//       item.course_name ||
//       (item.course && (item.course.name || item.course.code)) ||
//       item.name ||
//       item.code;
//     const courseKey = String(courseId ?? courseLabel ?? "");

//     const matchesSearch =
//       (courseLabel || "").toLowerCase().includes(search.toLowerCase()) ||
//       (item.content || "").toLowerCase().includes(search.toLowerCase());
//     const matchesStatus = statusFilter === "all" || item.status === statusFilter;
//     const yearValue =
//       item.course_year ?? item.year ?? item.course_year_of_study;
//     const matchesYear =
//       yearFilter === "all" || String(yearValue) === String(yearFilter);
//     const matchesCourse =
//       courseFilter === "all" || courseKey === String(courseFilter);
//     return matchesSearch && matchesStatus && matchesYear && matchesCourse;
//   });

//   return (
//     <div className="space-y-6">
//       <div className="flex flex-col gap-2">
//         <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-700">
//           <ClockIcon className="h-4 w-4" />
//           History
//         </div>
//         <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
//           All syllabus versions you have written
//         </h1>
//         <p className="text-sm text-slate-600 max-w-3xl">
//           Search and filter by approval status, year, or course name. Open any version
//           to view details with read-only safety.
//         </p>
//       </div>

//       <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 md:p-5 space-y-4">
//         <div className="grid grid-cols-1 md:grid-cols-[1.4fr,repeat(3,0.6fr)] gap-3">
//           <div className="relative">
//             <MagnifyingGlassIcon className="h-5 w-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
//             <input
//               type="text"
//               placeholder="Search syllabus or course"
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//               className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-3 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 outline-none"
//             />
//           </div>
//           <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50/60">
//             <FunnelIcon className="h-5 w-5 text-slate-400" />
//             <select
//               value={statusFilter}
//               onChange={(e) => setStatusFilter(e.target.value)}
//               className="bg-transparent text-sm text-slate-800 flex-1 outline-none"
//             >
//               <option value="all">Status</option>
//               <option value="APPROVED">Approved</option>
//               <option value="REJECTED">Rejected</option>
//               <option value="PENDING_REVIEW">Pending review</option>
//               <option value="PENDING_DEPT">Pending dept</option>
//             </select>
//           </div>
//           <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50/60">
//             <FunnelIcon className="h-5 w-5 text-slate-400" />
//             <select
//               value={yearFilter}
//               onChange={(e) => setYearFilter(e.target.value)}
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
//           <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50/60">
//             <FunnelIcon className="h-5 w-5 text-slate-400" />
//             <select
//               value={courseFilter}
//               onChange={(e) => setCourseFilter(e.target.value)}
//               className="bg-transparent text-sm text-slate-800 flex-1 outline-none"
//             >
//               <option value="all">Course</option>
//               {courseOptions.map((c) => (
//                 <option key={c.value} value={c.value}>
//                   {c.label}
//                 </option>
//               ))}
//             </select>
//           </div>
//         </div>

//         <div className="grid gap-3">
//           {filtered.map((item) => (
//             <div
//               key={item.id}
//               className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm hover:border-indigo-200 hover:shadow-md transition flex flex-col md:flex-row md:items-center md:justify-between gap-3"
//             >
//               <div className="space-y-1">
//                 <div className="text-sm font-semibold text-slate-900">
//                   {item.course_name} • {item.course_semester || ""} {item.course_year}
//                 </div>
//                 <div className="text-xs text-slate-600 line-clamp-2">
//                   {(item.content || "").slice(0, 140) || "Syllabus content"}
//                 </div>
//                 <div className="text-xs text-slate-500">
//                   Updated: {item.updated_at?.slice(0, 10) || ""}
//                 </div>
//               </div>
//               <div className="flex items-center gap-3">
//                 <span
//                   className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
//                     statusColors[item.status] || "bg-slate-100 text-slate-700 border-slate-200"
//                   }`}
//                 >
//                   {statusLabel[item.status] || item.status}
//                 </span>
//                 <button
//                   type="button"
//                   className="text-sm font-semibold text-indigo-700 hover:text-indigo-600"
//                   onClick={() =>
//                     navigate(
//                       `/lecturer/courses/${item.course || item.course_id || "course"}/versions/${item.id}`,
//                       { state: { version: item } }
//                     )
//                   }
//                 >
//                   View details
//                 </button>
//               </div>
//             </div>
//           ))}

//           {loading && (
//             <div className="text-sm text-slate-500 border border-dashed border-slate-200 rounded-xl p-6 text-center">
//               Loading...
//             </div>
//           )}

//           {!loading && filtered.length === 0 && (
//             <div className="text-sm text-slate-500 border border-dashed border-slate-200 rounded-xl p-6 text-center">
//               No syllabus versions match your filters yet.
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// LecturerHistory.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FunnelIcon, MagnifyingGlassIcon, ClockIcon } from "@heroicons/react/24/solid";
import { fetchLecturerSyllabuses, fetchLecturerCourses, fetchDeptCourses, fetchYears } from "../../api/api";


const statusColors = {
  APPROVED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  REJECTED: "bg-rose-100 text-rose-700 border-rose-200",
  PENDING_REVIEW: "bg-amber-100 text-amber-800 border-amber-200",
  PENDING_DEPT: "bg-amber-100 text-amber-800 border-amber-200",
  DRAFT: "bg-slate-100 text-slate-700 border-slate-200",
};

const statusLabel = {
  APPROVED: "Approved",
  REJECTED: "Rejected",
  PENDING_REVIEW: "Pending review",
  PENDING_DEPT: "Pending dept",
  DRAFT: "Draft",
};


export default function LecturerHistory() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");
  const [items, setItems] = useState([]);
  const [lecturerCourses, setLecturerCourses] = useState([]); // ✅ NEW (for dropdown)
  const [deptYears, setDeptYears] = useState([]); // ✅ NEW (1..years_of_study)
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
    fetchLecturerSyllabuses({ lecturerId: user.id }),
    fetchLecturerCourses({ lecturerId: user.id, departmentId: deptId }),
    fetchDeptCourses({ departmentId: deptId }),
    fetchYears(deptId),
  ])
    .then(([history, lecturerList, deptList, yearsData]) => {
      console.log("LecturerHistory API returned:", history);

      setItems(Array.isArray(history) ? history : []);

      const listToUse =
        Array.isArray(lecturerList) && lecturerList.length > 0
          ? lecturerList
          : Array.isArray(deptList)
          ? deptList
          : [];

      setLecturerCourses(listToUse); // dropdown source
      setDeptYears(Array.isArray(yearsData) ? yearsData : []);
    })
    .finally(() => setLoading(false));
}, []);


  // ✅ Year dropdown: department years (fallback: from history items)
  const years = useMemo(() => {
    if (deptYears.length) return deptYears;
    return Array.from(new Set((items || []).map((h) => h.course_year)))
      .filter((y) => y !== null && y !== undefined && y !== "")
      .sort((a, b) => Number(a) - Number(b));
  }, [deptYears, items]);

  // ✅ Course dropdown: lecturer courses (fallback: from history items)
  const courseOptions = useMemo(() => {
    if (lecturerCourses.length) {
      return lecturerCourses
        .map((c) => ({
          value: String(c.id),
          label: `${c.name || "Course"} • ${c.code || ""}`.trim(),
        }))
        .sort((a, b) => a.label.localeCompare(b.label));
    }

    const map = new Map();
    (items || []).forEach((h) => {
      const courseId = h.course ?? h.course_id;
      if (!courseId) return;
      const label = `${h.course_name || "Course"} • ${h.course_code || ""}`.trim();
      map.set(String(courseId), { value: String(courseId), label });
    });
    return Array.from(map.values()).sort((a, b) => String(a.label).localeCompare(String(b.label)));
  }, [lecturerCourses, items]);

  // ✅ Filtering stays the same, only one tiny safety change: use course ?? course_id
  const filtered = useMemo(() => {
    return (items || []).filter((item) => {
      const courseLabel = `${item.course_name || ""} ${item.course_code || ""}`.trim();

      const matchesSearch =
        courseLabel.toLowerCase().includes(search.toLowerCase()) ||
        (item.content || "").toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === "all" || item.status === statusFilter;

      const matchesYear = yearFilter === "all" || String(item.course_year) === String(yearFilter);

      const itemCourseId = item.course ?? item.course_id;
      const matchesCourse = courseFilter === "all" || String(itemCourseId) === String(courseFilter);

      return matchesSearch && matchesStatus && matchesYear && matchesCourse;
    });
  }, [items, search, statusFilter, yearFilter, courseFilter]);

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
          Search and filter by approval status, year, or course. Open any version
          to view details.
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
              <option value="DRAFT">Draft</option>
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
              {courseOptions.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
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
                    statusColors[item.status] ||
                    "bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  {statusLabel[item.status] || item.status}
                </span>

                <button
                  type="button"
                  className="text-sm font-semibold text-indigo-700 hover:text-indigo-600"
                  onClick={() =>
                    navigate(`/lecturer/courses/${item.course}/versions/${item.id}`, {
                      state: { version: item },
                    })
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
