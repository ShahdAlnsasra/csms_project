
// frontend/src/api/api.js
import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000/api/",
});

export default API;
// export async function signup(form) {
//   const payload = {
//     first_name: form.firstName?.trim(),
//     last_name: form.lastName?.trim(),
//     email: form.email?.trim(),
//     phone: form.phone?.trim(),
//     role: form.role,
//     department: form.department || null,
//     study_year:
//       form.role === "STUDENT" && form.studyYear
//         ? Number(form.studyYear)
//         : null,
//     semester:
//       form.role === "STUDENT" && form.semester
//         ? String(form.semester)
//         : null,
//   };

//   console.log("signup payload >>>", payload);
//   const res = await API.post("signup/", payload);
//   return res.data;
// }


// api.js


export async function signup(form) {
  const payload = {
    first_name: (form.firstName || "").trim(),
    last_name: (form.lastName || "").trim(),
    email: (form.email || "").trim(),
    phone: (form.phone || "").trim(),
    id_number: (form.idNumber || "").trim(),
    role: form.role,
    department: form.department || null,
    study_year:
      form.role === "STUDENT" && form.studyYear
        ? Number(form.studyYear)
        : null,
    semester:
      form.role === "STUDENT" && form.semester
        ? String(form.semester)
        : null,
  };

  console.log("signup payload >>>", JSON.stringify(payload, null, 2));

  const res = await API.post("signup/", payload);
  return res.data;
}




// ---- ROLES ----
export async function fetchRoles() {
  const res = await API.get("roles/");
  // backend already returns [{value, label}, ...]
  return res.data || [];
}

// ---- DEPARTMENTS ----
export async function fetchDepartments() {
  const res = await API.get("departments/");
  // [{id, code, name, degree, years_of_study, semesters_per_year}, ...]
  return res.data || [];
}

// ---- CREATE DEPARTMENT ----
export async function createDepartment(dept) {
  const res = await API.post("admin/departments/", dept);
  return res.data;
}



// ---- YEARS PER DEPARTMENT ----
export async function fetchYears(deptId) {
  if (!deptId) return [];
  const res = await API.get(`departments/${deptId}/years/`);
  // { years: [1,2,3] }
  return res.data?.years || [];
}

// ---- SEMESTERS (גלובלי מה־choices) ----
export async function fetchSemesters() {
  const res = await API.get("semesters/");
  // { semesters: ["A","B","SUMMER"] }
  return res.data?.semesters || [];
}

// תשאירי פה גם את פונקציית login שלך שכבר עובדת ✔
export async function login(identifier, password) {
  const res = await API.post("login/", { identifier, password });
  return res.data;
}


export async function verifySignupEmail(email, code) {
  const res = await API.post("signup/verify-email/", { email, code });
  return res.data;
}

export async function activateAccount(token, password, username) {
  const res = await API.post(`activate/${token}/`, { password, username });
  return res.data;
}

// ===== SYSTEM ADMIN – Departments =====
export async function fetchAdminDepartments() {
  // מחזיר את כל המחלקות למסך ה-System Admin
  const res = await API.get("admin/departments/");
  return res.data;
}

// ===== System Admin – Signup Requests =====

// מחזיר את כל בקשות ה-signup של Department Admins, עם סטטוס אופציונלי
export async function fetchAdminSignupRequests(status) {
  const res = await API.get("admin/signup-requests/", {
    params: status ? { status } : {},
  });
  return res.data || [];
}


// קבלת החלטה על בקשה (אישור / דחייה + סיבה)
export async function decideOnSignupRequest(requestId, decision, reason) {
  const payload = {
    action: decision,         // "APPROVE" / "REJECT"
    reason: reason || "",
  };

  const res = await API.post(
    `admin/signup-requests/${requestId}/decision/`,
    payload
  );
  return res.data;
}

export async function fetchDepartmentAdminsForSelect() {
  const res = await API.get("admin/department-admins/");
  return res.data || [];
}



// ===== System Admin – departments (update / delete) =====
export const deleteAdminDepartment = async (departmentId) => {
  const res = await API.delete(`admin/departments/${departmentId}/`);
  return res.data;
};

export const updateAdminDepartment = async (departmentId, payload) => {
  const res = await API.put(`admin/departments/${departmentId}/`, payload);
  // השרת מחזיר את המחלקה המעודכנת כ-JSON
  return res.data;
};


// ===== Department Admin – Signup Requests =====
export async function fetchDeptAdminRequests({ departmentId, status, role, search }) {
  if (!departmentId) return [];

  const params = { department_id: departmentId };

  if (status) params.status = status;
  if (role) params.role = role;
  if (search) params.search = search;

  const res = await API.get("department-admin/requests/", { params });
  return res.data || [];
}


// ===== Department Admin – simple fetch by status (used in DeptAdminRequests page) =====
export async function fetchDepartmentSignupRequests(status) {
  const res = await API.get("department-admin/requests/", {
    params: status ? { status } : {},
  });
  return res.data || [];
}

// ===== Department Admin – Decide on signup request (STUDENT/LECTURER/REVIEWER) =====
export async function decideOnDeptSignupRequest(requestId, decision, reason) {
  const payload = {
    action: decision,       // "APPROVE" / "REJECT"
    reason: reason || "",
  };

  const res = await API.post(
    `department-admin/requests/${requestId}/decision/`,
    payload
  );
  return res.data;
}


// ===== Department Admin – Courses =====
export async function fetchDeptCourses({ departmentId, year }) {
  if (!departmentId) return [];

  const params = { department_id: departmentId };
  if (year) params.year = year;

  const res = await API.get("department-admin/courses/", { params });
  return res.data || [];
}

export async function createDeptCourse(coursePayload) {
  const res = await API.post("department-admin/courses/", coursePayload);
  return res.data;
}

// ===== Department Admin – Courses (update / delete) =====
export async function updateDeptCourse(courseId, payload) {
  const res = await API.put(`department-admin/courses/${courseId}/`, payload);
  return res.data;
}

export async function deleteDeptCourse(courseId) {
  const res = await API.delete(`department-admin/courses/${courseId}/`);
  return res.data;
}


// Lecturers for a department (for dropdown)
export async function fetchDeptLecturers(departmentId) {
  if (!departmentId) return [];
  const res = await API.get("department-admin/lecturers/", {
    params: { department_id: departmentId },
  });
  return res.data || [];
}

// Single department detail (we'll reuse the admin endpoint)
export async function fetchDepartmentDetail(deptId) {
  if (!deptId) return null;
  const res = await API.get(`admin/departments/${deptId}/`);
  return res.data;
}

// ===== Department Admin – Course Graph (for diagram) =====
export async function fetchCourseGraph({ departmentId, year }) {
  if (!departmentId) return { nodes: [], edges: [] };

  const params = { department_id: departmentId };
  if (year) params.year = year;

  const res = await API.get("department-admin/course-graph/", { params });
  return res.data || { nodes: [], edges: [] };
}


// ===== Department Admin – Course AI Insights =====
export async function fetchCourseAIInsights(courseId) {
  if (!courseId) throw new Error("courseId is required");

  const res = await API.get(`department-admin/courses/${courseId}/ai-insights/`);
  return res.data;
}
