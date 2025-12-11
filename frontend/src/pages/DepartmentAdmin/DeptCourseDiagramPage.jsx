// // // frontend/src/pages/DepartmentAdmin/DeptCourseDiagramPage.jsx
// // import React, { useEffect, useState } from "react";
// // import { useNavigate } from "react-router-dom";
// // import {
// //   fetchDepartmentDetail,
// //   fetchDeptCourses,
// // } from "../../api/api";
// // import CourseDiagram from "../../components/CourseDiagram";

// // // 🔹 match the colors used in CourseDiagram.jsx
// // const getYearColor = (year) => {
// //   if (year === 1) return "#fef3c7"; // Year 1 – yellow
// //   if (year === 2) return "#dbeafe"; // Year 2 – blue
// //   if (year === 3) return "#dcfce7"; // Year 3 – green
// //   return "#fee2e2"; // Year 4+ – red-ish
// // };

// // export default function DeptCourseDiagramPage() {
// //   const navigate = useNavigate();

// //   const [departmentId, setDepartmentId] = useState(null);
// //   const [department, setDepartment] = useState(null);
// //   const [courses, setCourses] = useState([]);
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState("");

// //   // read user + dept from localStorage
// //   useEffect(() => {
// //     try {
// //       const raw = localStorage.getItem("csmsUser");
// //       if (!raw) return;
// //       const parsed = JSON.parse(raw);

// //       let deptId = null;
// //       if (
// //         typeof parsed.department === "number" ||
// //         typeof parsed.department === "string"
// //       ) {
// //         deptId = parsed.department;
// //       } else if (parsed.department && parsed.department.id) {
// //         deptId = parsed.department.id;
// //       } else if (parsed.department_id) {
// //         deptId = parsed.department_id;
// //       }

// //       if (deptId) setDepartmentId(deptId);
// //     } catch (e) {
// //       console.error("Failed to parse csmsUser:", e);
// //     }
// //   }, []);

// //   // load department + all courses
// //   useEffect(() => {
// //     if (!departmentId) return;

// //     async function loadAll() {
// //       try {
// //         setLoading(true);
// //         setError("");

// //         const dept = await fetchDepartmentDetail(departmentId);
// //         setDepartment(dept);

// //         const list = await fetchDeptCourses({ departmentId });
// //         setCourses(list || []);
// //       } catch (err) {
// //         console.error("Failed to load courses for diagram:", err);
// //         setError("Failed to load curriculum diagram.");
// //       } finally {
// //         setLoading(false);
// //       }
// //     }

// //     loadAll();
// //   }, [departmentId]);

// //   const handleCourseClick = (course) => {
// //     // go to dedicated course-details page
// //     navigate(`/department-admin/courses/${course.id}`);
// //   };

// //   // 🔹 dynamic legend years according to department.years_of_study
// //   const totalYears = department?.years_of_study || 4;
// //   const legendYears = Array.from({ length: totalYears }, (_, i) => i + 1);

// //   return (
// //     <div className="space-y-6">
// //       {/* Top bar */}
// //       <div className="flex items-center justify-between gap-4">
// //         <div>
// //           <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
// //             Curriculum Diagram
// //           </h1>
// //           <p className="mt-1 text-sm text-slate-600 max-w-2xl">
// //             Visual overview of all courses in the department and their
// //             prerequisite relationships. Hover over a course to see quick
// //             details, click to open full course information.
// //           </p>
// //         </div>

// //         {department && (
// //           <div className="px-4 py-2 rounded-2xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-800">
// //             <div className="font-semibold">
// //               {department.code} · {department.name}
// //             </div>
// //             <div className="mt-0.5">
// //               {department.years_of_study} years ·{" "}
// //               {department.semesters_per_year} semesters/year
// //             </div>
// //           </div>
// //         )}
// //       </div>

// //       {/* 🔹 Year color legend – ABOVE the diagram, dynamic per department */}
// //       {department && courses.length > 0 && (
// //         <div className="flex flex-wrap items-center gap-2 text-[11px]">
// //           <span className="font-semibold text-slate-700 mr-1">
// //             Year color legend:
// //           </span>
// //           {legendYears.map((year) => (
// //             <span
// //               key={year}
// //               className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-slate-200 shadow-sm"
// //               style={{ backgroundColor: getYearColor(year) }}
// //             >
// //               <span
// //                 className="w-3 h-3 rounded-full border border-slate-300"
// //                 style={{ backgroundColor: getYearColor(year) }}
// //               />
// //               <span>Year {year}</span>
// //             </span>
// //           ))}
// //         </div>
// //       )}

// //       {/* Diagram / loading / error */}
// //       {loading ? (
// //         <div className="text-sm text-slate-500">Loading diagram…</div>
// //       ) : error ? (
// //         <div className="text-sm text-red-600">{error}</div>
// //       ) : courses.length === 0 ? (
// //         <div className="text-sm text-slate-500 italic">
// //           No courses defined yet for this department.
// //         </div>
// //       ) : (
// //         <CourseDiagram courses={courses} onCourseClick={handleCourseClick} />
// //       )}
// //     </div>
// //   );
// // }



// // frontend/src/pages/DepartmentAdmin/DeptCourseDiagramPage.jsx
// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { ArrowLeft } from "lucide-react";

// import {
//   fetchDepartmentDetail,
//   fetchDeptCourses,
// } from "../../api/api";
// import CourseDiagram from "../../components/CourseDiagram";

// // same color mapping as in CourseDiagram.jsx
// function getYearColor(y) {
//   if (y === 1) return "#fef3c7"; // Year 1 – yellow
//   if (y === 2) return "#dbeafe"; // Year 2 – blue
//   if (y === 3) return "#dcfce7"; // Year 3 – green
//   return "#fee2e2";             // Year 4+ – red/pink
// }

// function YearsLegend({ totalYears }) {
//   if (!totalYears) return null;

//   const maxYear = Math.max(1, Math.min(totalYears, 4));
//   const items = [];

//   for (let y = 1; y <= maxYear; y += 1) {
//     items.push(
//       <div
//         key={y}
//         className="flex items-center gap-2 text-[11px] text-slate-600"
//       >
//         <span
//           className="h-3 w-5 rounded-sm border border-slate-200"
//           style={{ background: getYearColor(y) }}
//         />
//         <span>Year {y}</span>
//       </div>
//     );
//   }

//   if (totalYears > 4) {
//     items.push(
//       <div key="more" className="text-[10px] text-slate-500">
//         + Years 5+
//       </div>
//     );
//   }

//   return (
//     <div className="inline-flex items-center gap-4 rounded-2xl bg-white border border-slate-200 px-4 py-2 shadow-sm">
//       <span className="text-[11px] font-semibold text-slate-700 mr-1">
//         Year color legend:
//       </span>
//       {items}
//     </div>
//   );
// }

// export default function DeptCourseDiagramPage() {
//   const navigate = useNavigate();

//   const [departmentId, setDepartmentId] = useState(null);
//   const [department, setDepartment] = useState(null);
//   const [courses, setCourses] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   // read user + dept from localStorage
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
//       }

//       if (deptId) setDepartmentId(deptId);
//     } catch (e) {
//       console.error("Failed to parse csmsUser:", e);
//     }
//   }, []);

//   // load department + all courses
//   useEffect(() => {
//     if (!departmentId) return;

//     async function loadAll() {
//       try {
//         setLoading(true);
//         setError("");

//         const dept = await fetchDepartmentDetail(departmentId);
//         setDepartment(dept);

//         const list = await fetchDeptCourses({ departmentId });
//         setCourses(list || []);
//       } catch (err) {
//         console.error("Failed to load courses for diagram:", err);
//         setError("Failed to load curriculum diagram.");
//       } finally {
//         setLoading(false);
//       }
//     }

//     loadAll();
//   }, [departmentId]);

//   const handleCourseClick = (course) => {
//     // go to dedicated course-details page
//     navigate(`/department-admin/courses/${course.id}`);
//   };

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex items-center justify-between gap-4">
//         <div>
//           <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
//             Curriculum Diagram
//           </h1>
//           <p className="mt-1 text-sm text-slate-600 max-w-2xl">
//             Visual overview of all courses in the department and their
//             prerequisite relationships. Hover over a course to see quick
//             details, click to open full course information.
//           </p>
//         </div>

//         <div className="flex items-center gap-3">
//           <button
//             type="button"
//             onClick={() => navigate("/department-admin/courses")}
//             className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
//           >
//             <ArrowLeft className="h-3.5 w-3.5" />
//             Back to courses
//           </button>

//           {department && (
//             <div className="px-4 py-2 rounded-2xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-800">
//               <div className="font-semibold">
//                 {department.code} · {department.name}
//               </div>
//               <div className="mt-0.5">
//                 {department.years_of_study} years ·{" "}
//                 {department.semesters_per_year} semesters/year
//               </div>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Legend – above the diagram */}
//       {department && (
//         <div className="flex justify-end">
//           <YearsLegend totalYears={department.years_of_study} />
//         </div>
//       )}

//       {/* Diagram / states */}
//       {loading ? (
//         <div className="text-sm text-slate-500">Loading diagram…</div>
//       ) : error ? (
//         <div className="text-sm text-red-600">{error}</div>
//       ) : courses.length === 0 ? (
//         <div className="text-sm text-slate-500 italic">
//           No courses defined yet for this department.
//         </div>
//       ) : (
//         <CourseDiagram courses={courses} onCourseClick={handleCourseClick} />
//       )}
//     </div>
//   );
// }


import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import {
  fetchDepartmentDetail,
  fetchDeptCourses,
} from "../../api/api";
import CourseDiagram from "../../components/CourseDiagramSvg";

// same color mapping as in CourseDiagram.jsx
function getYearColor(y) {
  if (y === 1) return "#fef3c7"; // Year 1 – yellow
  if (y === 2) return "#dbeafe"; // Year 2 – blue
  if (y === 3) return "#dcfce7"; // Year 3 – green
  return "#fee2e2"; 			 // Year 4+ – red/pink
}

function YearsLegend({ totalYears }) {
  if (!totalYears) return null;

  // Max 4 years in the explicit legend, then add a '+' for the rest
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

export default function DeptCourseDiagramPage() {
  const navigate = useNavigate();

  const [departmentId, setDepartmentId] = useState(null);
  const [department, setDepartment] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // read user + dept from localStorage (omitted for brevity)
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
      }

      if (deptId) setDepartmentId(deptId);
    } catch (e) {
      console.error("Failed to parse csmsUser:", e);
    }
  }, []);

  // load department + all courses (omitted for brevity)
  useEffect(() => {
    if (!departmentId) return;

    async function loadAll() {
      try {
        setLoading(true);
        setError("");

        const dept = await fetchDepartmentDetail(departmentId);
        setDepartment(dept);

        const list = await fetchDeptCourses({ departmentId });
        setCourses(list || []);
      } catch (err) {
        console.error("Failed to load courses for diagram:", err);
        setError("Failed to load curriculum diagram.");
      } finally {
        setLoading(false);
      }
    }

    loadAll();
  }, [departmentId]);

  const handleCourseClick = (course) => {
    // go to dedicated course-details page
    navigate(`/department-admin/courses/${course.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
            Curriculum Diagram
          </h1>
          <p className="mt-1 text-sm text-slate-600 max-w-2xl">
            Visual overview of all courses in the department and their
            prerequisite relationships. Hover over a course to see quick
            details, click to open full course information.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/department-admin/courses")}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to courses
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

      {/* Legend – above the diagram */}
      {department && courses.length > 0 && (
        <div className="flex justify-end">
          <YearsLegend totalYears={department.years_of_study} />
        </div>
      )}

      {/* Diagram / states */}
      {loading ? (
        <div className="text-sm text-slate-500">Loading diagram…</div>
      ) : error ? (
        <div className="text-sm text-red-600">{error}</div>
      ) : courses.length === 0 ? (
        <div className="text-sm text-slate-500 italic">
          No courses defined yet for this department.
        </div>
      ) : (
        <CourseDiagram courses={courses} onCourseClick={handleCourseClick} />
      )}
    </div>
  );
}