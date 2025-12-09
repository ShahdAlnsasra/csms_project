

// // frontend/src/pages/DepartmentAdmin/DepartmentAdminDashboard.jsx
// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import {
//   ClipboardList,
//   Users2,
//   GraduationCap,
//   Network,
//   ArrowRight,
// } from "lucide-react";

// export default function DepartmentAdminDashboard() {
//   const navigate = useNavigate();
//   const [currentUser, setCurrentUser] = useState(null);

//   // Just to show the name in the intro text (no extra navbar here)
//   useEffect(() => {
//     try {
//       const raw = localStorage.getItem("csmsUser");
//       if (raw) {
//         setCurrentUser(JSON.parse(raw));
//       }
//     } catch (e) {
//       console.error("Failed to parse csmsUser from localStorage:", e);
//     }
//   }, []);

//   const displayName =
//     currentUser?.first_name ||
//     currentUser?.firstName ||
//     currentUser?.email ||
//     "";

//   const handleGoToRequests = () => {
//     navigate("/department-admin/requests");
//   };

//   const handleGoToDepartment = () => {
//     navigate("/department-admin/department");
//   };

//   return (
//     <div className="w-full">
//       {/* 🔹 Page intro (we keep only this, no Profile/Logout here) */}
//       <section className="space-y-2 mb-8">
//         <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-indigo-500">
//           Department Admin
//         </p>
//         <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
//           Department Admin Dashboard
//         </h1>
//         <p className="text-sm md:text-base text-slate-600 max-w-2xl">
//           {displayName ? `Welcome, ${displayName}. ` : "Welcome. "}
//           From here you can review signup requests for your department and
//           manage its academic structure – years, courses and future course
//           dependencies.
//         </p>

//         <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
//           <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 font-medium text-indigo-700 border border-indigo-100">
//             <Users2 className="mr-1.5 h-3.5 w-3.5" />
//             Students · Lecturers · Reviewers
//           </span>
//           <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700 border border-emerald-100">
//             <GraduationCap className="mr-1.5 h-3.5 w-3.5" />
//             Years &amp; Courses per Department
//           </span>
//         </div>
//       </section>

//       {/* 🔹 Main cards */}
//       <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
//         {/* ===== Requests Center card ===== */}
//         <button
//           type="button"
//           onClick={handleGoToRequests}
//           className="group text-left rounded-3xl bg-white shadow-xl border border-slate-200/80 hover:border-indigo-200 hover:shadow-indigo-100 transition overflow-hidden flex flex-col"
//         >
//           <div className="px-6 pt-6 pb-4 flex items-center justify-between gap-3">
//             <div className="flex items-center gap-3">
//               <div className="h-11 w-11 rounded-2xl bg-indigo-50 flex items-center justify-center shadow-sm">
//                 <ClipboardList className="h-6 w-6 text-indigo-600" />
//               </div>
//               <div>
//                 <h2 className="text-base md:text-lg font-semibold text-slate-900">
//                   Requests Center
//                 </h2>
//                 <p className="mt-1 text-xs text-slate-500 max-w-xs">
//                   Review and decide on signup requests from students, lecturers
//                   and reviewers in your department.
//                 </p>
//               </div>
//             </div>

//             <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition" />
//           </div>

//           <div className="px-6 pb-5">
//             <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
//               <div className="rounded-2xl bg-indigo-50/70 border border-indigo-100 px-3 py-2">
//                 <p className="font-semibold text-indigo-700 flex items-center gap-1">
//                   <Users2 className="h-3.5 w-3.5" />
//                   Students
//                 </p>
//                 <p className="mt-1 text-[11px] text-indigo-900/80">
//                   Approve or reject student access to your department.
//                 </p>
//               </div>

//               <div className="rounded-2xl bg-violet-50/80 border border-violet-100 px-3 py-2">
//                 <p className="font-semibold text-violet-700 flex items-center gap-1">
//                   <GraduationCap className="h-3.5 w-3.5" />
//                   Lecturers
//                 </p>
//                 <p className="mt-1 text-[11px] text-violet-900/80">
//                   Manage lecturer requests and connect them to courses.
//                 </p>
//               </div>

//               <div className="rounded-2xl bg-pink-50/80 border border-pink-100 px-3 py-2">
//                 <p className="font-semibold text-pink-700 flex items-center gap-1">
//                   <ClipboardList className="h-3.5 w-3.5" />
//                   Reviewers
//                 </p>
//                 <p className="mt-1 text-[11px] text-pink-900/80">
//                   Handle reviewers who will validate syllabi.
//                 </p>
//               </div>
//             </div>

//             <p className="mt-3 text-[11px] text-slate-500">
//               On the next screen you&apos;ll see pending requests, decision
//               history and a full view per request.
//             </p>
//           </div>
//         </button>

//         {/* ===== Department & Courses card ===== */}
//         <button
//           type="button"
//           onClick={handleGoToDepartment}
//           className="group text-left rounded-3xl bg-white shadow-xl border border-slate-200/80 hover:border-emerald-200 hover:shadow-emerald-100 transition overflow-hidden flex flex-col"
//         >
//           <div className="px-6 pt-6 pb-4 flex items-center justify-between gap-3">
//             <div className="flex items-center gap-3">
//               <div className="h-11 w-11 rounded-2xl bg-emerald-50 flex items-center justify-center shadow-sm">
//                 <Network className="h-6 w-6 text-emerald-600" />
//               </div>
//               <div>
//                 <h2 className="text-base md:text-lg font-semibold text-slate-900">
//                   Department &amp; Courses
//                 </h2>
//                 <p className="mt-1 text-xs text-slate-500 max-w-xs">
//                   Open the academic structure of your department: years, courses
//                   and (later) course dependency diagrams.
//                 </p>
//               </div>
//             </div>

//             <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition" />
//           </div>

//           <div className="px-6 pb-5 space-y-3 text-xs">
//             <div className="flex flex-wrap gap-2">
//               <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700 border border-emerald-100">
//                 <GraduationCap className="h-3.5 w-3.5 mr-1" />
//                 Year 1 · Year 2 · Year 3 · Year 4
//               </span>
//             </div>

//             <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-1.5">
//               <li>See one block per study year of your department.</li>
//               <li>Add courses with name, credits and semester.</li>
//               <li>
//                 Select which courses each one blocks / depends on (for future
//                 course diagram).
//               </li>
//             </ul>

//             <p className="text-[11px] text-slate-500">
//               Later you&apos;ll also have a visual diagram that shows how
//               courses depend on each other across years.
//             </p>
//           </div>
//         </button>
//       </section>
//     </div>
//   );
// }


// frontend/src/pages/DepartmentAdmin/DepartmentAdminDashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList,
  Users2,
  GraduationCap,
  Network,
  ArrowRight,
} from "lucide-react";
import { fetchDeptAdminRequests } from "../../api/api";

export default function DepartmentAdminDashboard() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [departmentId, setDepartmentId] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
//   const [pendingInfo, setPendingInfo] = useState({
//   total: 0,
//   students: 0,
//   lecturers: 0,
//   reviewers: 0,
//   loading: true,
//   error: "",
// }); // null = loading / unknown

  // 🔹 Read user from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("csmsUser");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      setCurrentUser(parsed);

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
      setDepartmentId(deptId || null);
    } catch (e) {
      console.error("Failed to parse csmsUser from localStorage:", e);
    }
  }, []);

  // 🔹 Fetch number of pending requests for this department
  useEffect(() => {
    if (!departmentId) {
      setPendingCount(0);
      return;
    }

    async function loadPending() {
      try {
        const data = await fetchDeptAdminRequests({
          departmentId,
          status: "PENDING",
        });
        setPendingCount(Array.isArray(data) ? data.length : 0);
      } catch (err) {
        console.error("Failed to load pending requests count:", err);
        setPendingCount(0);
      }
    }

    loadPending();
  }, [departmentId]);

  const displayName =
    currentUser?.first_name ||
    currentUser?.firstName ||
    currentUser?.email ||
    "";

  const handleGoToRequests = () => {
    navigate("/department-admin/requests");
  };

  const handleGoToDepartment = () => {
    navigate("/department-admin/courses");
  };

  return (
    <div className="w-full">
      {/* Intro */}
      <section className="space-y-2 mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-indigo-500">
          Department Admin
        </p>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
          Department Admin Dashboard
        </h1>
        <p className="text-sm md:text-base text-slate-600 max-w-2xl">
          {displayName ? `Welcome, ${displayName}. ` : "Welcome. "}
          From here you can review signup requests for your department and
          manage its academic structure – years, courses and future course
          dependencies.
        </p>

        <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
          <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 font-medium text-indigo-700 border border-indigo-100">
            <Users2 className="mr-1.5 h-3.5 w-3.5" />
            Students · Lecturers · Reviewers
          </span>
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700 border border-emerald-100">
            <GraduationCap className="mr-1.5 h-3.5 w-3.5" />
            Years &amp; Courses per Department
          </span>
        </div>
      </section>

      {/* Main cards */}
<section className="grid grid-cols-1 md:grid-cols-2 gap-6">
  {/* Requests Center card */}
  <button
    type="button"
    onClick={handleGoToRequests}
    className="group text-left rounded-3xl bg-white shadow-xl border border-slate-200/80 hover:border-indigo-200 hover:shadow-indigo-100 transition overflow-hidden flex flex-col"
  >
    {/* Header row */}
    <div className="px-6 pt-6 pb-4 flex items-center justify-between gap-3">
      {/* LEFT – icon + title + description */}
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-2xl bg-indigo-50 flex items-center justify-center shadow-sm">
          <ClipboardList className="h-6 w-6 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-base md:text-lg font-semibold text-slate-900">
            Requests Center
          </h2>
          <p className="mt-1 text-xs text-slate-500 max-w-xs">
            Review and decide on signup requests from students,
            lecturers and reviewers in your department.
          </p>
        </div>
      </div>

      {/* RIGHT – ONE arrow + pending badge */}
      <div className="flex items-center gap-2">
        {pendingCount > 0 && (
          <span className="inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-[11px] font-semibold text-red-700 border border-red-200">
            {pendingCount} pending
          </span>
        )}
        <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition" />
      </div>
    </div>

    {/* Body – 3 mini cards + helper text */}
    <div className="px-6 pb-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="rounded-2xl bg-indigo-50/70 border border-indigo-100 px-3 py-2">
          <p className="font-semibold text-indigo-700 flex items-center gap-1">
            <Users2 className="h-3.5 w-3.5" />
            Students
          </p>
          <p className="mt-1 text-[11px] text-indigo-900/80">
            Approve or reject student access to your department.
          </p>
        </div>

        <div className="rounded-2xl bg-violet-50/80 border border-violet-100 px-3 py-2">
          <p className="font-semibold text-violet-700 flex items-center gap-1">
            <GraduationCap className="h-3.5 w-3.5" />
            Lecturers
          </p>
          <p className="mt-1 text-[11px] text-violet-900/80">
            Manage lecturer requests and connect them to courses.
          </p>
        </div>

        <div className="rounded-2xl bg-pink-50/80 border border-pink-100 px-3 py-2">
          <p className="font-semibold text-pink-700 flex items-center gap-1">
            <ClipboardList className="h-3.5 w-3.5" />
            Reviewers
          </p>
          <p className="mt-1 text-[11px] text-pink-900/80">
            Handle reviewers who will validate syllabi.
          </p>
        </div>
      </div>

      <p className="mt-3 text-[11px] text-slate-500">
        On the next screen you&apos;ll see pending requests, decision
        history and a full view per request.
      </p>
    </div>
  </button>


        {/* Department & Courses card */}
        <button
          type="button"
          onClick={handleGoToDepartment}
          className="group text-left rounded-3xl bg-white shadow-xl border border-slate-200/80 hover:border-emerald-200 hover:shadow-emerald-100 transition overflow-hidden flex flex-col"
        >
          <div className="px-6 pt-6 pb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-emerald-50 flex items-center justify-center shadow-sm">
                <Network className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-base md:text-lg font-semibold text-slate-900">
                  Department &amp; Courses
                </h2>
                <p className="mt-1 text-xs text-slate-500 max-w-xs">
                  Open the academic structure of your department: years, courses
                  and (later) course dependency diagrams.
                </p>
              </div>
            </div>

            <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition" />
          </div>

          <div className="px-6 pb-5 space-y-3 text-xs">
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700 border border-emerald-100">
                <GraduationCap className="h-3.5 w-3.5 mr-1" />
                Year 1 · Year 2 · Year 3 · Year 4
              </span>
            </div>

            <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-1.5">
              <li>See one block per study year of your department.</li>
              <li>Add courses with name, credits and semester.</li>
              <li>
                Select which courses each one blocks / depends on (for future
                course diagram).
              </li>
            </ul>

            <p className="text-[11px] text-slate-500">
              Later you&apos;ll also have a visual diagram that shows how
              courses depend on each other across years.
            </p>
          </div>
        </button>
      </section>
    </div>
  );
}
