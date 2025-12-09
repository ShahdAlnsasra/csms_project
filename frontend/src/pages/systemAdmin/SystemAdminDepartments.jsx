// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { BuildingOfficeIcon } from "@heroicons/react/24/outline";
// import { fetchDepartments, createDepartment } from "../../api/api";

// // אפשרויות סוג התואר
// const DEGREE_OPTIONS = [
//   { value: "FIRST", label: "First degree (BSc)" },
//   { value: "SECOND", label: "Second degree (MSc)" },
//   { value: "BOTH", label: "First & Second degree (BSc + MSc)" },
// ];

// export default function SystemAdminDepartments() {
//   const navigate = useNavigate();

//   const [departments, setDepartments] = useState([]);

//   const [form, setForm] = useState({
//     code: "",
//     name: "",
//     degreeType: "FIRST", // שינוי ל-FIRST כברירת מחדל
//     years_of_study: 4,
//     semesters_per_year: 2,
//     description: "",
//   });

//   const [loading, setLoading] = useState(false);
//   const [loadError, setLoadError] = useState("");
//   const [error, setError] = useState(""); // שגיאה כללית
//   const [success, setSuccess] = useState(""); // הודעת הצלחה
//   const [fieldErrors, setFieldErrors] = useState({}); // שגיאות לפי שדה

//   // --- load existing departments ---
//   async function loadDepartments() {
//     try {
//       const data = await fetchDepartments();
//       setDepartments(data || []);
//       setLoadError("");
//     } catch (e) {
//       console.error(e);
//       setLoadError("Failed to load departments data.");
//     }
//   }

//   useEffect(() => {
//     loadDepartments();
//   }, []);

//   // --- form change ---
//   function handleChange(e) {
//     const { name, value } = e.target;
//     setForm((prev) => ({ ...prev, [name]: value }));
//   }

//   // --- submit form ---
//   async function handleSubmit(e) {
//     e.preventDefault();
//     setError("");
//     setSuccess("");

//     const newErrors = {};

//     const codeTrimmed = form.code.trim();
//     const nameTrimmed = form.name.trim();
//     const years = Number(form.years_of_study);
//     const sems = Number(form.semesters_per_year);

//     // --- Department Code: חובה + אנגלית + ייחודי ---
//     if (!codeTrimmed) {
//       newErrors.code = "Department code is required.";
//     } else if (!/^[A-Za-z0-9]+$/.test(codeTrimmed)) {
//       newErrors.code =
//         "Department code must contain English letters and digits only (no spaces).";
//     } else if (
//       departments.some(
//         (d) => d.code && d.code.toLowerCase() === codeTrimmed.toLowerCase()
//       )
//     ) {
//       newErrors.code = "Department code already exists in the system.";
//     }

//     // --- Department Name: חובה + אנגלית + ייחודי ---
//     if (!nameTrimmed) {
//       newErrors.name = "Department name is required.";
//     } else if (!/^[A-Za-z0-9\s\-&]+$/.test(nameTrimmed)) {
//       newErrors.name =
//         "Department name must be in English letters (you can use spaces, - and &).";
//     } else if (
//       departments.some(
//         (d) => d.name && d.name.toLowerCase() === nameTrimmed.toLowerCase()
//       )
//     ) {
//       newErrors.name = "Department name already exists in the system.";
//     }

//     // --- Years of Study (>0) ---
//     if (!years || years <= 0) {
//       newErrors.years_of_study = "Years of Study must be a positive number.";
//     }

//     // --- Semesters per Year (>0) ---
//     if (!sems || sems <= 0) {
//       newErrors.semesters_per_year =
//         "Semesters per Year must be a positive number.";
//     }

//     // אם יש שגיאות – לא שולחים לשרת
//     if (Object.keys(newErrors).length > 0) {
//       setFieldErrors(newErrors);
//       return;
//     }

//     setFieldErrors({});

//     const payload = {
//       code: codeTrimmed,
//       name: nameTrimmed,
//       degree: form.degreeType, // שולחים FIRST / SECOND / BOTH
//       years_of_study: years,
//       semesters_per_year: sems,
//       description: form.description.trim(),
//     };

//     try {
//       setLoading(true);
//       await createDepartment(payload);

//       setSuccess("Department created successfully.");
//       setForm((prev) => ({
//         ...prev,
//         code: "",
//         name: "",
//         description: "",
//       }));

//       await loadDepartments();

//       // ⏱️ אחרי כמה שניות – מעבר חזרה לדאשבורד
//       setTimeout(() => {
//         navigate("/system-admin");
//       }, 2500);
//     } catch (err) {
//       console.error(err);
//       setError(
//         err.response?.data?.detail ||
//           "Failed to create department. Please check the form."
//       );
//     } finally {
//       setLoading(false);
//     }
//   }

//   // --- when clicking existing department row ---
//   function handleOpenDepartment(dept) {
//     navigate(`/system-admin/departments/${dept.id}`, {
//       state: { department: dept },
//     });
//   }

//   return (
//     <div className="space-y-6">
//       {/* 🌟 כותרת הדף המעוצבת */}
//       <div className="flex items-center gap-3">
//         <BuildingOfficeIcon className="h-8 w-8 text-indigo-600" />
//         <div>
//           <h1 className="text-xl md:text-2xl font-bold text-slate-900">
//             Departments Management
//           </h1>
//           <p className="mt-1 text-sm text-slate-600 max-w-2xl">
//             Create new departments and view all existing departments in the
//             system.
//           </p>
//         </div>
//       </div>

//       {/* ALERTS */}
//       {success && (
//         <div className="rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 text-sm shadow-sm flex items-center gap-2">
//           {success}
//         </div>
//       )}

//       {error && (
//         <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm shadow-sm flex items-center gap-2">
//           {error}
//         </div>
//       )}

//       {loadError && (
//         <div className="rounded-xl bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 text-sm shadow-sm flex items-center gap-2">
//           {loadError}
//         </div>
//       )}

//       {/* NEW DEPARTMENT CARD */}
//       <div className="bg-white rounded-2xl shadow-xl border border-slate-200 px-6 sm:px-8 py-6">
//         <h2 className="text-sm font-semibold tracking-[0.2em] text-indigo-600 uppercase mb-4 border-b pb-2">
//           Create New Department
//         </h2>

//         <form onSubmit={handleSubmit} className="space-y-6">
//           {/* Row 1: code + name */}
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             <div>
//               <label className="block text-xs font-medium text-slate-600 mb-1">
//                 Department Code
//               </label>
//               <input
//                 name="code"
//                 type="text"
//                 className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
//                   fieldErrors.code
//                     ? "border-red-400 focus:ring-red-300 bg-red-50"
//                     : "border-slate-300 bg-white focus:ring-indigo-300"
//                 }`}
//                 value={form.code}
//                 onChange={handleChange}
//               />
//               <p className="mt-1 text-[11px] text-slate-400">
//                 Short internal code, in English only. For example: CS, SW.
//               </p>
//               {fieldErrors.code && (
//                 <p className="mt-1 text-[11px] text-red-500 font-medium">
//                   {fieldErrors.code}
//                 </p>
//               )}
//             </div>

//             <div>
//               <label className="block text-xs font-medium text-slate-600 mb-1">
//                 Department Name
//               </label>
//               <input
//                 name="name"
//                 type="text"
//                 className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
//                   fieldErrors.name
//                     ? "border-red-400 focus:ring-red-300 bg-red-50"
//                     : "border-slate-300 bg-white focus:ring-indigo-300"
//                 }`}
//                 value={form.name}
//                 onChange={handleChange}
//               />
//               <p className="mt-1 text-[11px] text-slate-400">
//                 For example: Computer Science, Software Engineering.
//               </p>
//               {fieldErrors.name && (
//                 <p className="mt-1 text-[11px] text-red-500 font-medium">
//                   {fieldErrors.name}
//                 </p>
//               )}
//             </div>
//           </div>

//           {/* Row 2: degree + years + semesters */}
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//             <div>
//               <label className="block text-xs font-medium text-slate-600 mb-1">
//                 Degree Type
//               </label>
//               <select
//                 name="degreeType"
//                 value={form.degreeType}
//                 onChange={handleChange}
//                 className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
//               >
//                 {DEGREE_OPTIONS.map((opt) => (
//                   <option key={opt.value} value={opt.value}>
//                     {opt.label}
//                   </option>
//                 ))}
//               </select>
//               <p className="mt-1 text-[11px] text-slate-400">
//                 Choose whether this department is first degree, second degree, or
//                 both.
//               </p>
//             </div>

//             <div>
//               <label className="block text-xs font-medium text-slate-600 mb-1">
//                 Years of Study
//               </label>
//               <input
//                 name="years_of_study"
//                 type="number"
//                 min="1"
//                 className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
//                   fieldErrors.years_of_study
//                     ? "border-red-400 focus:ring-red-300 bg-red-50"
//                     : "border-slate-300 bg-white focus:ring-indigo-300"
//                 }`}
//                 value={form.years_of_study}
//                 onChange={handleChange}
//               />
//               {fieldErrors.years_of_study && (
//                 <p className="mt-1 text-[11px] text-red-500 font-medium">
//                   {fieldErrors.years_of_study}
//                 </p>
//               )}
//             </div>

//             <div>
//               <label className="block text-xs font-medium text-slate-600 mb-1">
//                 Semesters per Year
//               </label>
//               <input
//                 name="semesters_per_year"
//                 type="number"
//                 min="1"
//                 className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
//                   fieldErrors.semesters_per_year
//                     ? "border-red-400 focus:ring-red-300 bg-red-50"
//                     : "border-slate-300 bg-white focus:ring-indigo-300"
//                 }`}
//                 value={form.semesters_per_year}
//                 onChange={handleChange}
//               />
//               {fieldErrors.semesters_per_year && (
//                 <p className="mt-1 text-[11px] text-red-500 font-medium">
//                   {fieldErrors.semesters_per_year}
//                 </p>
//               )}
//             </div>
//           </div>

//           {/* Description */}
//           <div>
//             <label className="block text-xs font-medium text-slate-600 mb-1">
//               Description
//             </label>
//             <textarea
//               name="description"
//               rows={3}
//               className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
//               value={form.description}
//               onChange={handleChange}
//               placeholder="Optional short description about this department..."
//             />
//           </div>

//           <div className="flex justify-end pt-4 border-t border-slate-100">
//             <button
//               type="submit"
//               disabled={loading}
//               className="px-6 py-2 rounded-xl bg-indigo-600 text-base font-semibold text-white shadow-lg shadow-indigo-300/50 hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
//             >
//               {loading ? "Creating Department..." : "Create Department"}
//             </button>
//           </div>
//         </form>
//       </div>

//       {/* EXISTING DEPARTMENTS */}
//       <div className="mt-8 bg-white rounded-2xl shadow-xl border border-slate-200 px-6 sm:px-8 py-6">
//         <div className="flex items-center justify-between mb-4 border-b pb-2">
//           <h2 className="text-sm font-semibold tracking-[0.2em] text-slate-700 uppercase">
//             Existing Departments ({departments.length})
//           </h2>
//           <span className="text-[11px] text-slate-400 italic hidden sm:block">
//             Click on a department to view details and manage it.
//           </span>
//         </div>

//         {departments.length === 0 ? (
//           <p className="text-sm text-slate-500 p-4 bg-slate-50 rounded-lg border border-slate-200">
//             No departments yet. Use "Create Department" to add the first one.
//           </p>
//         ) : (
//           <ul className="divide-y divide-slate-100">
//             {departments.map((dept) => (
//               <li
//                 key={dept.id}
//                 onClick={() => handleOpenDepartment(dept)}
//                 className="flex items-center justify-between py-3 px-3 -mx-3 cursor-pointer rounded-xl hover:bg-indigo-50 transition"
//               >
//                 <div>
//                   <p className="text-base font-semibold text-slate-800">
//                     {dept.code} – {dept.name}
//                   </p>
//                   <p className="text-xs text-slate-500 mt-1">
//                     {dept.years_of_study} years · {dept.semesters_per_year}{" "}
//                     semesters / year
//                   </p>
//                 </div>
//                 <span className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
//                   View details
//                   <svg
//                     xmlns="http://www.w3.org/2000/svg"
//                     viewBox="0 0 20 20"
//                     fill="currentColor"
//                     className="w-4 h-4"
//                   >
//                     <path
//                       fillRule="evenodd"
//                       d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
//                       clipRule="evenodd"
//                     />
//                   </svg>
//                 </span>
//               </li>
//             ))}
//           </ul>
//         )}
//       </div>
//     </div>
//   );
// }

//sec code try 
// src/pages/systemAdmin/SystemAdminDepartments.jsx
// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import {
//   createDepartment,
//   fetchDepartmentAdminsForSelect,
// } from "../../api/api";
// import { ArrowLeft, GraduationCap } from "lucide-react";

// export default function SystemAdminDepartments() {
//   const navigate = useNavigate();

//   const [form, setForm] = useState({
//     code: "",
//     name: "",
//     degree: "BSC",
//     yearsOfStudy: 4,
//     semestersPerYear: 2,
//     description: "",
//     departmentAdminId: "",
//   });

//   const [admins, setAdmins] = useState([]);
//   const [submitting, setSubmitting] = useState(false);
//   const [errorMsg, setErrorMsg] = useState("");
//   const [successMsg, setSuccessMsg] = useState("");

//   // load available department admins for the select
//   useEffect(() => {
//     async function loadAdmins() {
//       try {
//         const data = await fetchDepartmentAdminsForSelect();
//         setAdmins(data || []);
//       } catch (err) {
//         console.error("Failed to load department admins:", err);
//       }
//     }
//     loadAdmins();
//   }, []);

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setForm((prev) => ({
//       ...prev,
//       [name]: value,
//     }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setErrorMsg("");
//     setSuccessMsg("");

//     // simple front validation
//     if (!form.code.trim() || !form.name.trim()) {
//       setErrorMsg("Code and Name are required.");
//       return;
//     }

//     const payload = {
//       code: form.code.trim(),
//       name: form.name.trim(),
//       degree: form.degree || "BSC",
//       years_of_study: Number(form.yearsOfStudy || 4),
//       semesters_per_year: Number(form.semestersPerYear || 2),
//       description: form.description.trim() || "",
//       admin_user_id: form.departmentAdminId || null,
//     };

//     try {
//       setSubmitting(true);
//       console.log("Create department payload >>>", payload);
//       const created = await createDepartment(payload);
//       console.log("Created department:", created);

//       setSuccessMsg("Department created successfully.");
//       // optional: reset form
//       setForm((prev) => ({
//         ...prev,
//         code: "",
//         name: "",
//         description: "",
//         departmentAdminId: "",
//       }));
//     } catch (err) {
//       console.error("Create department failed:", err.response?.data || err);

//       // show backend errors if available
//       if (err.response?.data) {
//         const data = err.response.data;
//         // join serializer errors into one string
//         const flat =
//           typeof data === "string"
//             ? data
//             : Object.entries(data)
//                 .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
//                 .join(" | ");
//         setErrorMsg(flat || "Failed to create department. Please check the form.");
//       } else {
//         setErrorMsg("Failed to create department. Please check the form.");
//       }
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const handleBack = () => {
//     navigate("/system-admin/departments/manage");
//   };

//   return (
//     <div className="max-w-3xl mx-auto space-y-6">
//       {/* Header */}
//       <div className="flex items-start justify-between gap-4">
//         <button
//           type="button"
//           onClick={handleBack}
//           className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900"
//         >
//           <ArrowLeft className="mr-1 h-4 w-4" />
//           Back to departments list
//         </button>

//         <div className="flex items-start gap-3 ml-auto">
//           <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 shadow-sm">
//             <GraduationCap className="h-6 w-6 text-indigo-600" />
//           </div>
//           <div>
//             <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-500">
//               New Department
//             </p>
//             <h1 className="mt-1 text-xl md:text-2xl font-bold text-slate-900">
//               Create a New Academic Department
//             </h1>
//             <p className="mt-2 text-sm text-slate-600">
//               Define the high-level properties of the department. You can manage
//               years, courses, and dependencies later.
//             </p>
//           </div>
//         </div>
//       </div>

//       {/* Form card */}
//       <div className="rounded-3xl border border-slate-200 bg-white shadow-xl p-6 space-y-4">
//         {errorMsg && (
//           <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
//             {errorMsg}
//           </div>
//         )}
//         {successMsg && (
//           <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
//             {successMsg}
//           </div>
//         )}

//         <form onSubmit={handleSubmit} className="space-y-5">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div>
//               <label className="block text-xs font-semibold text-slate-600 mb-1">
//                 Department Code *
//               </label>
//               <input
//                 type="text"
//                 name="code"
//                 value={form.code}
//                 onChange={handleChange}
//                 className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
//                 placeholder="CS, EE, MATH..."
//               />
//             </div>

//             <div>
//               <label className="block text-xs font-semibold text-slate-600 mb-1">
//                 Department Name *
//               </label>
//               <input
//                 type="text"
//                 name="name"
//                 value={form.name}
//                 onChange={handleChange}
//                 className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
//                 placeholder="Computer Science"
//               />
//             </div>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             <div>
//               <label className="block text-xs font-semibold text-slate-600 mb-1">
//                 Degree Type
//               </label>
//               <select
//                 name="degree"
//                 value={form.degree}
//                 onChange={handleChange}
//                 className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
//               >
//                 <option value="BSC">B.Sc.</option>
//                 <option value="MSC">M.Sc.</option>
//                 <option value="BOTH">B.Sc. + M.Sc.</option>
//               </select>
//             </div>

//             <div>
//               <label className="block text-xs font-semibold text-slate-600 mb-1">
//                 Years of Study
//               </label>
//               <input
//                 type="number"
//                 min={1}
//                 max={7}
//                 name="yearsOfStudy"
//                 value={form.yearsOfStudy}
//                 onChange={handleChange}
//                 className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
//               />
//             </div>

//             <div>
//               <label className="block text-xs font-semibold text-slate-600 mb-1">
//                 Semesters per Year
//               </label>
//               <input
//                 type="number"
//                 min={1}
//                 max={4}
//                 name="semestersPerYear"
//                 value={form.semestersPerYear}
//                 onChange={handleChange}
//                 className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
//               />
//             </div>
//           </div>

//           <div>
//             <label className="block text-xs font-semibold text-slate-600 mb-1">
//               Description (optional)
//             </label>
//             <textarea
//               name="description"
//               value={form.description}
//               onChange={handleChange}
//               rows={3}
//               className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
//               placeholder="Short description about this department..."
//             />
//           </div>

//           <div>
//             <label className="block text-xs font-semibold text-slate-600 mb-1">
//               Assign Department Admin (optional)
//             </label>
//             <select
//               name="departmentAdminId"
//               value={form.departmentAdminId}
//               onChange={handleChange}
//               className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
//             >
//               <option value="">-- No admin selected yet --</option>
//               {admins.map((a) => (
//                 <option key={a.id} value={a.id}>
//                   {a.full_name} {a.department_name ? `(${a.department_name})` : ""}
//                 </option>
//               ))}
//             </select>
//           </div>

//           <div className="pt-2 flex justify-end gap-3">
//             <button
//               type="button"
//               onClick={handleBack}
//               className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               disabled={submitting}
//               className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-60"
//             >
//               {submitting ? "Creating..." : "Create Department"}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }


import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BuildingOfficeIcon } from "@heroicons/react/24/outline";
import { fetchDepartments, createDepartment } from "../../api/api";

// ✅ Degree options that match the Django model choices (BSC / MSC / BOTH)
const DEGREE_OPTIONS = [
  { value: "BSC", label: "First degree (BSc)" },
  { value: "MSC", label: "Second degree (MSc)" },
  { value: "BOTH", label: "First & Second degree (BSc + MSc)" },
];

export default function SystemAdminDepartments() {
  const navigate = useNavigate();

  const [departments, setDepartments] = useState([]);

  const [form, setForm] = useState({
    code: "",
    name: "",
    degreeType: "BSC", // ✅ default matches backend ("BSC")
    years_of_study: 4,
    semesters_per_year: 2,
    description: "",
  });

  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState(""); // general error
  const [success, setSuccess] = useState(""); // success message
  const [fieldErrors, setFieldErrors] = useState({}); // per-field errors

  // --- load existing departments ---
  async function loadDepartments() {
    try {
      const data = await fetchDepartments();
      setDepartments(data || []);
      setLoadError("");
    } catch (e) {
      console.error(e);
      setLoadError("Failed to load departments data.");
    }
  }

  useEffect(() => {
    loadDepartments();
  }, []);

  // --- form change ---
  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  // --- submit form ---
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const newErrors = {};

    const codeTrimmed = form.code.trim();
    const nameTrimmed = form.name.trim();
    const years = Number(form.years_of_study);
    const sems = Number(form.semesters_per_year);

    // --- Department Code: required + English + unique ----
    if (!codeTrimmed) {
      newErrors.code = "Department code is required.";
    } else if (!/^[A-Za-z0-9]+$/.test(codeTrimmed)) {
      newErrors.code =
        "Department code must contain English letters and digits only (no spaces).";
    } else if (
      departments.some(
        (d) => d.code && d.code.toLowerCase() === codeTrimmed.toLowerCase()
      )
    ) {
      newErrors.code = "Department code already exists in the system.";
    }

    // --- Department Name: required + English + unique ---
    if (!nameTrimmed) {
      newErrors.name = "Department name is required.";
    } else if (!/^[A-Za-z0-9\s\-&]+$/.test(nameTrimmed)) {
      newErrors.name =
        "Department name must be in English letters (you can use spaces, - and &).";
    } else if (
      departments.some(
        (d) => d.name && d.name.toLowerCase() === nameTrimmed.toLowerCase()
      )
    ) {
      newErrors.name = "Department name already exists in the system.";
    }

    // --- Years of Study (>0) ---
    if (!years || years <= 0) {
      newErrors.years_of_study = "Years of Study must be a positive number.";
    }

    // --- Semesters per Year (>0) ---
    if (!sems || sems <= 0) {
      newErrors.semesters_per_year =
        "Semesters per Year must be a positive number.";
    }

    // if there are errors – do not send to backend
    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      return;
    }

    setFieldErrors({});

    const payload = {
      code: codeTrimmed,
      name: nameTrimmed,
      // ✅ now sends "BSC" / "MSC" / "BOTH" exactly as backend expects
      degree: form.degreeType,
      years_of_study: years,
      semesters_per_year: sems,
      description: form.description.trim(),
      // we are NOT sending admin_user_id here – it's optional in your view
    };

    try {
      setLoading(true);
      console.log("Create department payload >>>", payload);
      await createDepartment(payload);

      setSuccess("Department created successfully.");
      setForm((prev) => ({
        ...prev,
        code: "",
        name: "",
        description: "",
      }));

      await loadDepartments();

      // ⏱️ after a short delay – back to dashboard (same behavior as before)
      setTimeout(() => {
        navigate("/system-admin");
      }, 2500);
    } catch (err) {
      console.error("Create department failed:", err.response?.data || err);

      // Try to show serializer errors if available
      const data = err.response?.data;
      if (data && typeof data === "object") {
        const combined = Object.entries(data)
          .map(([key, value]) =>
            Array.isArray(value)
              ? `${key}: ${value.join(", ")}`
              : `${key}: ${value}`
          )
          .join(" | ");
        setError(
          combined || "Failed to create department. Please check the form."
        );
      } else {
        setError(
          err.response?.data?.detail ||
            "Failed to create department. Please check the form."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  // --- when clicking existing department row ---
  function handleOpenDepartment(dept) {
    navigate(`/system-admin/departments/${dept.id}`, {
      state: { department: dept },
    });
  }

  return (
    <div className="space-y-6">
      {/* 🌟 Page header */}
      <div className="flex items-center gap-3">
        <BuildingOfficeIcon className="h-8 w-8 text-indigo-600" />
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">
            Departments Management
          </h1>
          <p className="mt-1 text-sm text-slate-600 max-w-2xl">
            Create new departments and view all existing departments in the
            system.
          </p>
        </div>
      </div>

      {/* ALERTS */}
      {success && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 text-sm shadow-sm flex items-center gap-2">
          {success}
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm shadow-sm flex items-center gap-2">
          {error}
        </div>
      )}

      {loadError && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 text-sm shadow-sm flex items-center gap-2">
          {loadError}
        </div>
      )}

      {/* NEW DEPARTMENT CARD */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 px-6 sm:px-8 py-6">
        <h2 className="text-sm font-semibold tracking-[0.2em] text-indigo-600 uppercase mb-4 border-b pb-2">
          Create New Department
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Row 1: code + name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Department Code
              </label>
              <input
                name="code"
                type="text"
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                  fieldErrors.code
                    ? "border-red-400 focus:ring-red-300 bg-red-50"
                    : "border-slate-300 bg-white focus:ring-indigo-300"
                }`}
                value={form.code}
                onChange={handleChange}
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Short internal code, in English only. For example: CS, SW.
              </p>
              {fieldErrors.code && (
                <p className="mt-1 text-[11px] text-red-500 font-medium">
                  {fieldErrors.code}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Department Name
              </label>
              <input
                name="name"
                type="text"
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                  fieldErrors.name
                    ? "border-red-400 focus:ring-red-300 bg-red-50"
                    : "border-slate-300 bg-white focus:ring-indigo-300"
                }`}
                value={form.name}
                onChange={handleChange}
              />
              <p className="mt-1 text-[11px] text-slate-400">
                For example: Computer Science, Software Engineering.
              </p>
              {fieldErrors.name && (
                <p className="mt-1 text-[11px] text-red-500 font-medium">
                  {fieldErrors.name}
                </p>
              )}
            </div>
          </div>

          {/* Row 2: degree + years + semesters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Degree Type
              </label>
              <select
                name="degreeType"
                value={form.degreeType}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                {DEGREE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-slate-400">
                Choose whether this department is first degree, second degree, or
                both.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Years of Study
              </label>
              <input
                name="years_of_study"
                type="number"
                min="1"
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                  fieldErrors.years_of_study
                    ? "border-red-400 focus:ring-red-300 bg-red-50"
                    : "border-slate-300 bg-white focus:ring-indigo-300"
                }`}
                value={form.years_of_study}
                onChange={handleChange}
              />
              {fieldErrors.years_of_study && (
                <p className="mt-1 text-[11px] text-red-500 font-medium">
                  {fieldErrors.years_of_study}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Semesters per Year
              </label>
              <input
                name="semesters_per_year"
                type="number"
                min="1"
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                  fieldErrors.semesters_per_year
                    ? "border-red-400 focus:ring-red-300 bg-red-50"
                    : "border-slate-300 bg-white focus:ring-indigo-300"
                }`}
                value={form.semesters_per_year}
                onChange={handleChange}
              />
              {fieldErrors.semesters_per_year && (
                <p className="mt-1 text-[11px] text-red-500 font-medium">
                  {fieldErrors.semesters_per_year}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Description
            </label>
            <textarea
              name="description"
              rows={3}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              value={form.description}
              onChange={handleChange}
              placeholder="Optional short description about this department..."
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 rounded-xl bg-indigo-600 text-base font-semibold text-white shadow-lg shadow-indigo-300/50 hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating Department..." : "Create Department"}
            </button>
          </div>
        </form>
      </div>

      {/* EXISTING DEPARTMENTS */}
      <div className="mt-8 bg-white rounded-2xl shadow-xl border border-slate-200 px-6 sm:px-8 py-6">
        <div className="flex items-center justify-between mb-4 border-b pb-2">
          <h2 className="text-sm font-semibold tracking-[0.2em] text-slate-700 uppercase">
            Existing Departments ({departments.length})
          </h2>
          <span className="text-[11px] text-slate-400 italic hidden sm:block">
            Click on a department to view details and manage it.
          </span>
        </div>

        {departments.length === 0 ? (
          <p className="text-sm text-slate-500 p-4 bg-slate-50 rounded-lg border border-slate-200">
            No departments yet. Use "Create Department" to add the first one.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {departments.map((dept) => (
              <li
                key={dept.id}
                onClick={() => handleOpenDepartment(dept)}
                className="flex items-center justify-between py-3 px-3 -mx-3 cursor-pointer rounded-xl hover:bg-indigo-50 transition"
              >
                <div>
                  <p className="text-base font-semibold text-slate-800">
                    {dept.code} – {dept.name}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {dept.years_of_study} years · {dept.semesters_per_year}{" "}
                    semesters / year
                  </p>
                </div>
                <span className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                  View details
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
