// // frontend/src/pages/DepartmentAdmin/DepartmentAdminCourseDetail.jsx
// import React, { useEffect, useMemo, useState } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import {
//   fetchDeptCourses,
//   fetchDepartmentDetail,
// } from "../../api/api";
// import {
//   ArrowLeft,
//   Network,
//   GraduationCap,
//   Link2,
//   ArrowRightLeft,
// } from "lucide-react";

// export default function DepartmentAdminCourseDetail() {
//   const navigate = useNavigate();
//   const { courseId } = useParams();

//   const [departmentId, setDepartmentId] = useState(null);
//   const [department, setDepartment] = useState(null);
//   const [courses, setCourses] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   // read csmsUser to get departmentId
//   useEffect(() => {
//     try {
//       const raw = localStorage.getItem("csmsUser");
//       if (!raw) return;
//       const parsed = JSON.parse(raw);

//       let deptId = null;
//       if (
//         typeof parsed.department === "number" ||
//         typeof parsed.department === "string"
//       ) {
//         deptId = parsed.department;
//       } else if (parsed.department && parsed.department.id) {
//         deptId = parsed.department.id;
//       } else if (parsed.department_id) {
//         deptId = parsed.department_id;
//       } else if (parsed.departmentId) {
//         deptId = parsed.departmentId;
//       }

//       if (deptId) setDepartmentId(deptId);
//     } catch (e) {
//       console.error("Failed to parse csmsUser:", e);
//     }
//   }, []);

//   // load department + all dept courses
//   useEffect(() => {
//     if (!departmentId) return;

//     async function load() {
//       try {
//         setLoading(true);
//         setError("");
//         const [dept, allCourses] = await Promise.all([
//           fetchDepartmentDetail(departmentId),
//           fetchDeptCourses({ departmentId }),
//         ]);
//         setDepartment(dept || null);
//         setCourses(allCourses || []);
//       } catch (err) {
//         console.error("Failed to load course relationships:", err);
//         setError("Failed to load course relationships. Please try again.");
//       } finally {
//         setLoading(false);
//       }
//     }

//     load();
//   }, [departmentId]);

//   const course = useMemo(
//     () =>
//       courses.find((c) => c.id === Number(courseId)) || null,
//     [courses, courseId]
//   );

//   const courseById = useMemo(() => {
//     const map = new Map();
//     courses.forEach((c) => {
//       if (c && c.id != null) map.set(c.id, c);
//     });
//     return map;
//   }, [courses]);

//   // prerequisites: courses that must be completed BEFORE this course
//   const prerequisites = useMemo(() => {
//     if (!course) return [];

//     if (
//       Array.isArray(course.prerequisites_display) &&
//       course.prerequisites_display.length > 0
//     ) {
//       // backend already gave us full objects
//       return course.prerequisites_display;
//     }

//     let ids = [];
//     if (Array.isArray(course.prerequisite_ids)) {
//       ids = course.prerequisite_ids;
//     }

//     return ids
//       .map((id) => courseById.get(id))
//       .filter(Boolean);
//   }, [course, courseById]);

//   // dependents: courses that LIST THIS COURSE as a prerequisite
//   const dependents = useMemo(() => {
//     if (!course) return [];

//     const currentId = course.id;
//     const results = [];

//     courses.forEach((c) => {
//       if (!c || !c.id || c.id === currentId) return;

//       let ids = [];
//       if (
//         Array.isArray(c.prerequisites_display) &&
//         c.prerequisites_display.length > 0
//       ) {
//         ids = c.prerequisites_display.map((p) => p.id);
//       } else if (Array.isArray(c.prerequisite_ids)) {
//         ids = c.prerequisite_ids;
//       }

//       if (ids.includes(currentId)) {
//         results.push(c);
//       }
//     });

//     return results;
//   }, [course, courses]);

//   if (loading) {
//     return (
//       <div className="p-6 text-sm text-slate-600">Loading course relationships…</div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="p-6 text-sm text-red-700 bg-red-50 border border-red-200 rounded-2xl">
//         {error}
//       </div>
//     );
//   }

//   if (!course) {
//     return (
//       <div className="p-6 text-sm text-slate-600">
//         Course not found.
//       </div>
//     );
//   }

//   const lecturerNames =
//     course.lecturers_display && course.lecturers_display.length > 0
//       ? course.lecturers_display.map((l) => l.full_name).join(", ")
//       : null;

//   const prereqSummary =
//     prerequisites.length > 0
//       ? prerequisites
//           .map((p) => `${p.code || ""} ${p.name || ""}`.trim())
//           .join(", ")
//       : null;

//   return (
//     <div className="space-y-6">
//       {/* Top bar */}
//       <div className="flex items-center justify-between gap-4">
//         <div className="flex items-center gap-3">
//           <button
//             type="button"
//             onClick={() => navigate("/department-admin/courses")}
//             className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white w-9 h-9 shadow-sm hover:bg-slate-50"
//           >
//             <ArrowLeft className="h-4 w-4 text-slate-500" />
//           </button>
//           <div>
//             <h1 className="text-3xl font-extrabold text-slate-900">
//               Course Relationships
//             </h1>
//             <p className="mt-1 text-sm text-slate-600 max-w-xl">
//               Detailed view of the selected course, its prerequisites and the
//               courses that depend on it.
//             </p>
//           </div>
//         </div>

//         {department && (
//           <div className="px-4 py-2 rounded-2xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-800">
//             <span className="font-semibold">
//               {department.code} · {department.name}
//             </span>
//           </div>
//         )}
//       </div>

//       {/* Layout */}
//       <div className="grid grid-cols-1 lg:grid-cols-[1.4fr,1.6fr] gap-6">
//         {/* LEFT – main course details */}
//         <div className="rounded-3xl bg-white border border-slate-200 shadow-lg px-6 py-5 flex flex-col gap-4">
//           <div className="flex items-start justify-between gap-4">
//             <div>
//               <p className="text-xs font-medium text-slate-500">
//                 {course.code}
//               </p>
//               <h2 className="text-2xl font-extrabold text-slate-900">
//                 {course.name}
//               </h2>

//               <p className="mt-3 text-sm text-slate-700">
//                 {course.description ||
//                   "No description has been added yet for this course."}
//               </p>
//             </div>

//             <div className="inline-flex flex-col items-end gap-2">
//               <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-xs font-medium text-slate-700">
//                 Year {course.year}, Sem {course.semester}
//               </span>
//               <span className="text-xs text-slate-500">
//                 Credits:{" "}
//                 <span className="font-semibold">{course.credits}</span>
//               </span>
//             </div>
//           </div>

//           <div className="border-t border-slate-100 pt-3 space-y-2 text-sm">
//             {lecturerNames && (
//               <div className="flex items-center gap-2 text-slate-700">
//                 <GraduationCap className="h-4 w-4 text-slate-500" />
//                 <span>
//                   <span className="font-semibold">Lecturer(s): </span>
//                   {lecturerNames}
//                 </span>
//               </div>
//             )}

//             {prereqSummary && (
//               <div className="flex items-start gap-2 text-slate-700">
//                 <Link2 className="h-4 w-4 text-slate-500 mt-0.5" />
//                 <span>
//                   <span className="font-semibold">Prerequisites: </span>
//                   {prereqSummary}
//                 </span>
//               </div>
//             )}

//             {!prereqSummary && (
//               <div className="flex items-center gap-2 text-slate-500 text-xs">
//                 <Link2 className="h-4 w-4 text-slate-400" />
//                 <span>This course has no prerequisites.</span>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* RIGHT – prerequisites + dependents */}
//         <div className="space-y-4">
//           {/* Prerequisites card */}
//           <div className="rounded-3xl bg-white border border-slate-200 shadow-lg px-6 py-5">
//             <div className="flex items-center gap-2 mb-2">
//               <Network className="h-4 w-4 text-emerald-600" />
//               <h3 className="text-sm font-semibold text-slate-900">
//                 Prerequisites
//               </h3>
//             </div>

//             {prerequisites.length === 0 ? (
//               <p className="text-sm text-slate-600">
//                 This course has no prerequisites.
//               </p>
//             ) : (
//               <ul className="mt-1 space-y-1 text-sm text-slate-700">
//                 {prerequisites.map((p) => (
//                   <li
//                     key={p.id}
//                     className="flex items-center justify-between gap-3"
//                   >
//                     <div>
//                       <span className="font-semibold">{p.code}</span>{" "}
//                       <span className="text-slate-700">{p.name}</span>
//                     </div>
//                     <span className="text-[11px] text-slate-500">
//                       Year {p.year}, Sem {p.semester}
//                     </span>
//                   </li>
//                 ))}
//               </ul>
//             )}
//           </div>

//           {/* Dependents card */}
//           <div className="rounded-3xl bg-white border border-slate-200 shadow-lg px-6 py-5">
//             <div className="flex items-center gap-2 mb-2">
//               <ArrowRightLeft className="h-4 w-4 text-indigo-600" />
//               <h3 className="text-sm font-semibold text-slate-900">
//                 Courses that depend on this course
//               </h3>
//             </div>

//             {dependents.length === 0 ? (
//               <p className="text-sm text-slate-600">
//                 No other courses currently list this course as a prerequisite.
//               </p>
//             ) : (
//               <ul className="mt-1 space-y-1 text-sm text-slate-700">
//                 {dependents.map((d) => (
//                   <li
//                     key={d.id}
//                     className="flex items-center justify-between gap-3"
//                   >
//                     <div>
//                       <span className="font-semibold">{d.code}</span>{" "}
//                       <span className="text-slate-700">{d.name}</span>
//                     </div>
//                     <span className="text-[11px] text-slate-500">
//                       Year {d.year}, Sem {d.semester}
//                     </span>
//                   </li>
//                 ))}
//               </ul>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }


// frontend/src/pages/DepartmentAdmin/DepartmentAdminCourseDetail.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  fetchDeptCourses,
  fetchDepartmentDetail,
  fetchCourseAIInsights,
} from "../../api/api";
import {
  ArrowLeft,
  Network,
  GraduationCap,
  Link2,
  ArrowRightLeft,
  Sparkles,
} from "lucide-react";

export default function DepartmentAdminCourseDetail() {
  const navigate = useNavigate();
  const { courseId } = useParams();

  const [departmentId, setDepartmentId] = useState(null);
  const [department, setDepartment] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // AI insight state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiData, setAiData] = useState(null);

  // read csmsUser to get departmentId
  useEffect(() => {
    try {
      const raw = localStorage.getItem("csmsUser");
      if (!raw) return;
      const parsed = JSON.parse(raw);

      let deptId = null;
      if (
        typeof parsed.department === "number" ||
        typeof parsed.department === "string"
      ) {
        deptId = parsed.department;
      } else if (parsed.department && parsed.department.id) {
        deptId = parsed.department.id;
      } else if (parsed.department_id) {
        deptId = parsed.department_id;
      } else if (parsed.departmentId) {
        deptId = parsed.departmentId;
      }

      if (deptId) setDepartmentId(deptId);
    } catch (e) {
      console.error("Failed to parse csmsUser:", e);
    }
  }, []);

  // load department + all dept courses
  useEffect(() => {
    if (!departmentId) return;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const [dept, allCourses] = await Promise.all([
          fetchDepartmentDetail(departmentId),
          fetchDeptCourses({ departmentId }),
        ]);
        setDepartment(dept || null);
        setCourses(allCourses || []);
      } catch (err) {
        console.error("Failed to load course relationships:", err);
        setError("Failed to load course relationships. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [departmentId]);

  const course = useMemo(
    () => courses.find((c) => c.id === Number(courseId)) || null,
    [courses, courseId]
  );

  const courseById = useMemo(() => {
    const map = new Map();
    courses.forEach((c) => {
      if (c && c.id != null) map.set(c.id, c);
    });
    return map;
  }, [courses]);

  // prerequisites: courses that must be completed BEFORE this course
  const prerequisites = useMemo(() => {
    if (!course) return [];

    if (
      Array.isArray(course.prerequisites_display) &&
      course.prerequisites_display.length > 0
    ) {
      // backend already gave us full objects
      return course.prerequisites_display;
    }

    let ids = [];
    if (Array.isArray(course.prerequisite_ids)) {
      ids = course.prerequisite_ids;
    }

    return ids.map((id) => courseById.get(id)).filter(Boolean);
  }, [course, courseById]);

  // dependents: courses that LIST THIS COURSE as a prerequisite
  const dependents = useMemo(() => {
    if (!course) return [];

    const currentId = course.id;
    const results = [];

    courses.forEach((c) => {
      if (!c || !c.id || c.id === currentId) return;

      let ids = [];
      if (
        Array.isArray(c.prerequisites_display) &&
        c.prerequisites_display.length > 0
      ) {
        ids = c.prerequisites_display.map((p) => p.id);
      } else if (Array.isArray(c.prerequisite_ids)) {
        ids = c.prerequisite_ids;
      }

      if (ids.includes(currentId)) {
        results.push(c);
      }
    });

    return results;
  }, [course, courses]);

  if (loading) {
    return (
      <div className="p-6 text-sm text-slate-600">
        Loading course relationships…
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-sm text-red-700 bg-red-50 border border-red-200 rounded-2xl">
        {error}
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-6 text-sm text-slate-600">
        Course not found.
      </div>
    );
  }

  const lecturerNames =
    course.lecturers_display && course.lecturers_display.length > 0
      ? course.lecturers_display.map((l) => l.full_name).join(", ")
      : null;

  const prereqSummary =
    prerequisites.length > 0
      ? prerequisites
          .map((p) => `${p.code || ""} ${p.name || ""}`.trim())
          .join(", ")
      : null;

  // === AI: handler ===
  const handleGenerateAIInsight = async () => {
    if (!course) return;
    try {
      setAiLoading(true);
      setAiError("");
      const data = await fetchCourseAIInsights(course.id);
      setAiData(data);
    } catch (err) {
      console.error("Failed to fetch AI insights:", err);
      const msg =
        err?.response?.data?.detail ||
        "Failed to generate curriculum insight. Please try again.";
      setAiError(msg);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/department-admin/courses")}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white w-9 h-9 shadow-sm hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4 text-slate-500" />
          </button>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">
              Course Relationships
            </h1>
            <p className="mt-1 text-sm text-slate-600 max-w-xl">
              Detailed view of the selected course, its prerequisites and the
              courses that depend on it.
            </p>
          </div>
        </div>

        {department && (
          <div className="px-4 py-2 rounded-2xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-800">
            <span className="font-semibold">
              {department.code} · {department.name}
            </span>
          </div>
        )}
      </div>

      {/* Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr,1.6fr] gap-6">
        {/* LEFT – main course details */}
        <div className="rounded-3xl bg-white border border-slate-200 shadow-lg px-6 py-5 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-slate-500">
                {course.code}
              </p>
              <h2 className="text-2xl font-extrabold text-slate-900">
                {course.name}
              </h2>

              <p className="mt-3 text-sm text-slate-700">
                {course.description ||
                  "No description has been added yet for this course."}
              </p>
            </div>

            <div className="inline-flex flex-col items-end gap-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-xs font-medium text-slate-700">
                Year {course.year}, Sem {course.semester}
              </span>
              <span className="text-xs text-slate-500">
                Credits:{" "}
                <span className="font-semibold">{course.credits}</span>
              </span>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3 space-y-2 text-sm">
            {lecturerNames && (
              <div className="flex items-center gap-2 text-slate-700">
                <GraduationCap className="h-4 w-4 text-slate-500" />
                <span>
                  <span className="font-semibold">Lecturer(s): </span>
                  {lecturerNames}
                </span>
              </div>
            )}

            {prereqSummary && (
              <div className="flex items-start gap-2 text-slate-700">
                <Link2 className="h-4 w-4 text-slate-500 mt-0.5" />
                <span>
                  <span className="font-semibold">Prerequisites: </span>
                  {prereqSummary}
                </span>
              </div>
            )}

            {!prereqSummary && (
              <div className="flex items-center gap-2 text-slate-500 text-xs">
                <Link2 className="h-4 w-4 text-slate-400" />
                <span>This course has no prerequisites.</span>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT – prerequisites + dependents */}
        <div className="space-y-4">
          {/* Prerequisites card */}
          <div className="rounded-3xl bg-white border border-slate-200 shadow-lg px-6 py-5">
            <div className="flex items-center gap-2 mb-2">
              <Network className="h-4 w-4 text-emerald-600" />
              <h3 className="text-sm font-semibold text-slate-900">
                Prerequisites
              </h3>
            </div>

            {prerequisites.length === 0 ? (
              <p className="text-sm text-slate-600">
                This course has no prerequisites.
              </p>
            ) : (
              <ul className="mt-1 space-y-1 text-sm text-slate-700">
                {prerequisites.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-3"
                  >
                    <div>
                      <span className="font-semibold">{p.code}</span>{" "}
                      <span className="text-slate-700">{p.name}</span>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Year {p.year}, Sem {p.semester}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Dependents card */}
          <div className="rounded-3xl bg-white border border-slate-200 shadow-lg px-6 py-5">
            <div className="flex items-center gap-2 mb-2">
              <ArrowRightLeft className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-semibold text-slate-900">
                Courses that depend on this course
              </h3>
            </div>

            {dependents.length === 0 ? (
              <p className="text-sm text-slate-600">
                No other courses currently list this course as a prerequisite.
              </p>
            ) : (
              <ul className="mt-1 space-y-1 text-sm text-slate-700">
                {dependents.map((d) => (
                  <li
                    key={d.id}
                    className="flex items-center justify-between gap-3"
                  >
                    <div>
                      <span className="font-semibold">{d.code}</span>{" "}
                      <span className="text-slate-700">{d.name}</span>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Year {d.year}, Sem {d.semester}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* === AI Curriculum Insight card === */}
      <div className="rounded-3xl bg-emerald-50 border border-emerald-200 shadow-md px-6 py-5 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-emerald-100 p-2">
              <Sparkles className="h-4 w-4 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-emerald-900">
                Curriculum Insight
              </h3>
              <p className="text-xs text-emerald-800/80 max-w-xl">
                Automatic analysis of this course inside the curriculum:
                centrality, prerequisites, and potential risks for students.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerateAIInsight}
            disabled={aiLoading}
            className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-emerald-600 text-white text-xs font-semibold shadow hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {aiLoading ? "Analyzing…" : "Generate insight"}
          </button>
        </div>

        {aiError && (
          <p className="text-xs text-red-700 bg-red-100 border border-red-200 rounded-xl px-3 py-2 mt-1">
            {aiError}
          </p>
        )}

        {aiData && (
          <div className="mt-1 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-white rounded-2xl border border-emerald-100 px-3 py-2">
              <p className="text-[11px] font-semibold text-emerald-900 mb-1">
                Summary
              </p>
              <p className="text-[11px] text-slate-700">
                {aiData.summary}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-emerald-100 px-3 py-2">
              <p className="text-[11px] font-semibold text-emerald-900 mb-1">
                Prerequisites & Dependents
              </p>
              <p className="text-[11px] text-slate-700 mb-1">
                {aiData.prerequisites_summary}
              </p>
              <p className="text-[11px] text-slate-700">
                {aiData.dependents_summary}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-emerald-100 px-3 py-2">
              <p className="text-[11px] font-semibold text-emerald-900 mb-1">
                Risks & Recommendations
              </p>
              {aiData.risk_notes && aiData.risk_notes.length > 0 && (
                <ul className="list-disc list-inside text-[11px] text-slate-700 mb-1">
                  {aiData.risk_notes.map((r, idx) => (
                    <li key={idx}>{r}</li>
                  ))}
                </ul>
              )}
              {aiData.recommendations && aiData.recommendations.length > 0 && (
                <ul className="list-disc list-inside text-[11px] text-slate-700">
                  {aiData.recommendations.map((r, idx) => (
                    <li key={idx}>{r}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
