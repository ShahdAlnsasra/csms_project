
// frontend/src/api/api.js
import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000/api/",
});

export default API;
export async function signup(form) {
  const payload = {
    first_name: form.firstName,
    last_name: form.lastName,
    email: form.email,
    role: form.role,
    department: form.department || null,
    study_year:
      form.role === "STUDENT" && form.studyYear
        ? Number(form.studyYear)
        : null,
    // phone / semester can be added later if you change the model
  };

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

