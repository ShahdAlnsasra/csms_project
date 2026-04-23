
// frontend/src/api/api.js
import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000/api/",
});
// ✅ Add auth token automatically (JWT/Token)
API.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem("csmsUser") || "null");

  // תומך בהרבה שמות אפשריים של טוקן
  const token =
    user?.access ||
    user?.token ||
    user?.key ||
    user?.auth_token ||
    localStorage.getItem("access") ||
    localStorage.getItem("token");

  if (token) {
    const t = String(token);
    const isJwt = t.split(".").length === 3; // JWT usually has 3 parts
    config.headers.Authorization = isJwt ? `Bearer ${t}` : `Token ${t}`;
  }

  return config;
});

export default API;


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
    degree_track:
      form.role === "STUDENT" && form.degreeTrack
        ? String(form.degreeTrack).toUpperCase()
        : null,
  };

  Object.keys(payload).forEach((k) => {
    if (payload[k] === undefined) delete payload[k];
  });

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

export async function resendSignupVerificationCode(email) {
  const res = await API.post("signup/resend-verification-code/", { email });
  return res.data;
}

export async function activateAccount(token, password, username) {
  const res = await API.post(`activate/${token}/`, { password, username });
  return res.data;
}

export async function requestPasswordReset(email) {
  const res = await API.post("forgot-password/", { email });
  return res.data;
}

export async function resetPassword(token, password, passwordConfirm) {
  const res = await API.post(`reset-password/${token}/`, {
    password,
    password_confirm: passwordConfirm,
  });
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
export async function fetchDeptCourses({ departmentId, year, degreeTrack, planningType }) {
  if (!departmentId) return [];

  const params = { department_id: departmentId };
  if (year) params.year = year;
  if (degreeTrack) params.degree_track = degreeTrack;
  if (planningType) params.planning_type = planningType;

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

export async function fetchTerms() {
  const res = await API.get("terms/");
  return res.data || [];
}

export async function fetchCurrentTerm() {
  const res = await API.get("terms/current/");
  return res.data;
}

export async function fetchNextTerm() {
  const res = await API.get("terms/next/");
  return res.data;
}

export async function setCurrentTerm(termId) {
  const res = await API.put("admin/terms/current/", { term_id: termId });
  return res.data;
}

export async function fetchDeptCourseOfferings({ departmentId, termId }) {
  const params = {};
  if (departmentId) params.department_id = departmentId;
  if (termId) params.term_id = termId;
  const res = await API.get("department-admin/course-offerings/", { params });
  return res.data || [];
}

export async function upsertDeptCourseOffering(payload) {
  const res = await API.post("department-admin/course-offerings/", payload);
  return res.data;
}

export async function fetchDeptTermEditWindow(termId) {
  const res = await API.get("department-admin/term-edit-window/", {
    params: { term_id: termId },
  });
  return res.data;
}

export async function saveDeptTermEditWindow(termId, studentEditStart, studentEditEnd) {
  const res = await API.put("department-admin/term-edit-window/", {
    term_id: termId,
    student_edit_start: studentEditStart || null,
    student_edit_end: studentEditEnd || null,
  });
  return res.data;
}

export async function updateDeptCourseOffering(offeringId, payload) {
  const res = await API.put(`department-admin/course-offerings/${offeringId}/`, payload);
  return res.data;
}

export async function deleteDeptCourseOffering(offeringId) {
  await API.delete(`department-admin/course-offerings/${offeringId}/`);
}

export async function fetchLecturerOfferings(termId) {
  const res = await API.get("lecturer/course-offerings/", {
    params: termId ? { term_id: termId } : {},
  });
  return res.data || [];
}

export async function fetchReviewerDepartmentCoursesByTerm(termId) {
  const res = await API.get("reviewer/department-courses/", { params: { term_id: termId } });
  return res.data || [];
}

export async function fetchStudentNextSemesterPlan() {
  const res = await API.get("student/next-semester-plan/");
  return res.data;
}

export async function saveStudentNextSemesterPlan(planId, electiveCourseIds) {
  const res = await API.post("student/next-semester-plan/save/", {
    plan_id: planId,
    elective_course_ids: electiveCourseIds,
  });
  return res.data;
}

export async function submitStudentNextSemesterPlan(planId) {
  const res = await API.post("student/next-semester-plan/submit/", { plan_id: planId });
  return res.data;
}

export async function fetchStudentNextTermCourses() {
  const res = await API.get("student/my-courses/next-term/");
  return res.data || [];
}


// ===== Department Admin – Course AI Insights =====
export async function fetchCourseAIInsights(courseId) {
  if (!courseId) throw new Error("courseId is required");

  const res = await API.get(`department-admin/courses/${courseId}/ai-insights/`);
  return res.data;
}

function sanitizeFilenamePart(text, fallback = "course") {
  const value = String(text || fallback).trim();
  return value.replace(/[<>:"/\\|?*\x00-\x1F]/g, "").replace(/\s+/g, "_") || fallback;
}

export async function downloadDeptCourseSyllabusPdf(courseId, courseName) {
  const res = await API.get(`department-admin/courses/${courseId}/syllabus-pdf/`, {
    responseType: "blob",
  });
  const blob = new Blob([res.data], { type: "application/pdf" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${sanitizeFilenamePart(courseName, `course_${courseId}`)}_syllabus.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export async function downloadAdminCourseSyllabusPdf(courseId, courseName) {
  const res = await API.get(`admin/courses/${courseId}/syllabus-pdf/`, {
    responseType: "blob",
  });
  const blob = new Blob([res.data], { type: "application/pdf" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${sanitizeFilenamePart(courseName, `course_${courseId}`)}_syllabus.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

// ===== Lecturer – dynamic data =====
export async function fetchLecturerCourses({ lecturerId, departmentId, year, termId } = {}) {
  if (!lecturerId) return [];
  const params = { lecturer_id: lecturerId };
  if (departmentId) params.department_id = departmentId;
  if (year) params.year = year;
  if (termId) params.term_id = termId;
  const res = await API.get("lecturer/courses/", { params });
  return res.data || [];
}

export async function fetchLecturerCourseById({ lecturerId, courseId }) {
  if (!lecturerId || !courseId) return null;
  const res = await API.get("lecturer/courses/", {
    params: { lecturer_id: lecturerId },
  });
  const list = res.data || [];
  return list.find((c) => String(c.id) === String(courseId)) || null;
}

export async function fetchLecturerSyllabuses({ lecturerId, courseId, status, year }) {
  if (!lecturerId) return [];
  const params = { lecturer_id: lecturerId };
  if (courseId) params.course_id = courseId;
  if (status) params.status = status;
  if (year) params.year = year;
  const res = await API.get("lecturer/syllabuses/", { params });
  return res.data || [];
}


// ===== Lecturer – helpers for filters =====
export async function fetchLecturerSyllabusFilters({ lecturerId, courseId }) {
  if (!lecturerId || !courseId) {
    return { statuses: [], years: []};
  }

  const res = await API.get("lecturer/syllabuses/filters/", {
    params: { lecturer_id: lecturerId, course_id: courseId },
  });

  return res.data || { statuses: [], years: []};
}


// ===== Lecturer – create syllabus =====
// ✅ CREATE syllabus (match backend create_lecturer_syllabus)
// ✅ Lecturer – create syllabus
export async function createLecturerSyllabus({ lecturerId, courseId, content, saveAs }) {
  const isDraft = saveAs === "DRAFT";

  const payload = {
    lecturer_id: lecturerId,
    course_id: courseId,
    save_as: saveAs,
    level: "BSC", // אפשר להשאיר תמיד
  };

  const setIf = (key, val) => {
    const hasVal = val !== undefined && val !== null && String(val).trim() !== "";
    if (!isDraft || hasVal) payload[key] = val;
  };

  setIf("academic_year", content.academicYear);
  setIf("course_type", content.courseType);
  setIf("delivery", content.delivery);
  setIf("instructor_email", content.instructorEmail || "");
  setIf("language", content.language || "Hebrew");

  setIf("purpose", content.purpose);
  setIf("learning_outputs", content.learningOutputs);
  setIf("course_description", content.courseDescription);
  setIf("literature", content.literature);
  setIf("teaching_methods_planned", content.teachingMethodsPlanned);
  setIf("guidelines", content.guidelines);

  // ✅ Draft: לא לשלוח שורות ריקות
  const weeks = Array.isArray(content?.weeksPlan) ? content.weeksPlan : [];
  const assessments = Array.isArray(content?.assessments) ? content.assessments : [];

  const weeksFiltered = isDraft
    ? weeks.filter(w => String(w.topic || "").trim() || String(w.sources || "").trim())
    : weeks;

  const assessmentsFiltered = isDraft
    ? assessments.filter(a => String(a.title || "").trim() || String(a.percent || "").trim())
    : assessments;

  if (!isDraft || weeksFiltered.length) {
    payload.weeks = weeksFiltered.map((w, i) => ({
      week_number: Number(w.week || i + 1),
      topic: w.topic || "",
      sources: w.sources || "",
    }));
  }

  if (!isDraft || assessmentsFiltered.length) {
    payload.assessments = assessmentsFiltered.map((a) => ({
      title: a.title || "",
      percent: Number(a.percent || 0),
    }));
  }

  const res = await API.post("lecturer/syllabuses/create/", payload);
  return res.data;
}

export async function fetchLecturerSyllabusById({ lecturerId, syllabusId }) {
  const res = await API.get(`lecturer/syllabuses/${syllabusId}/`, {
    params: { lecturer_id: lecturerId },
  });
  return res.data;
}
export async function downloadLecturerSyllabusPdf(syllabusId, courseName) {
  const res = await API.get(`lecturer/syllabuses/${syllabusId}/download-pdf/`, {
    responseType: "blob",
  });
  const blob = new Blob([res.data], { type: "application/pdf" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${sanitizeFilenamePart(courseName, `syllabus_${syllabusId}`)}_syllabus.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
export async function updateLecturerSyllabus({ lecturerId, syllabusId, content, saveAs }) {
  const isDraft = saveAs === "DRAFT";

  const payload = {
    lecturer_id: lecturerId,
    save_as: saveAs, // "DRAFT" | "SUBMIT"
    level: "BSC",
  };

  const setIf = (key, val) => {
    const hasVal = val !== undefined && val !== null && String(val).trim() !== "";
    if (!isDraft || hasVal) payload[key] = val;
  };

  setIf("academic_year", content.academicYear);
  setIf("course_type", content.courseType);
  setIf("delivery", content.delivery);
  setIf("instructor_email", content.instructorEmail || "");
  setIf("language", content.language || "Hebrew");

  setIf("purpose", content.purpose);
  setIf("learning_outputs", content.learningOutputs);
  setIf("course_description", content.courseDescription);
  setIf("literature", content.literature);
  setIf("teaching_methods_planned", content.teachingMethodsPlanned);
  setIf("guidelines", content.guidelines);

  const weeks = Array.isArray(content?.weeksPlan) ? content.weeksPlan : [];
  const assessments = Array.isArray(content?.assessments) ? content.assessments : [];

  const weeksFiltered = isDraft
    ? weeks.filter(w => String(w.topic || "").trim() || String(w.sources || "").trim())
    : weeks;

  const assessmentsFiltered = isDraft
    ? assessments.filter(a => String(a.title || "").trim() || String(a.percent || "").trim())
    : assessments;

  if (!isDraft || weeksFiltered.length) {
    payload.weeks = weeksFiltered.map((w, i) => ({
      week_number: Number(w.week || i + 1),
      topic: w.topic || "",
      sources: w.sources || "",
    }));
  }

  if (!isDraft || assessmentsFiltered.length) {
    payload.assessments = assessmentsFiltered.map((a) => ({
      title: a.title || "",
      percent: Number(a.percent || 0),
    }));
  }

  const res = await API.put(
    `lecturer/syllabuses/${syllabusId}/`,
    payload,
    { params: { lecturer_id: lecturerId } }
  );
  return res.data;
}


export async function cloneLecturerSyllabus({ syllabusId }) {
  const res = await API.post(`lecturer/syllabuses/${syllabusId}/clone/`);
  return res.data; // { draft, created_new, source_id, ... }
}



// ===== AI Chat per syllabus (recommended) =====

// history
export async function fetchSyllabusChatHistory({ syllabusId }) {
  const res = await API.get(`lecturer/syllabuses/${syllabusId}/chat/`);
  return res.data || [];
}

// ask
export async function askSyllabusAssistant({ syllabusId, message, language, currentDraft }) {
  if (!syllabusId) throw new Error("syllabusId is required");
  if (!message) throw new Error("message is required");

  const payload = {
    message,
    // language optional (backend can infer from syllabus)
    ...(language ? { language } : {}),
    // currentDraft optional (useful especially when REJECTED)
    ...(currentDraft ? { currentDraft } : {}),
  };

  const res = await API.post(`lecturer/syllabuses/${syllabusId}/chat/ask/`, payload);
  return res.data; // { reply, mode }
}

// ===== Reviewer API =====
export async function fetchReviewerNewSyllabuses({ reviewerId, departmentId }) {
  if (!reviewerId) return [];
  const params = { reviewer_id: reviewerId };
  if (departmentId) params.department_id = departmentId;
  const res = await API.get("reviewer/syllabuses/new/", { params });
  return res.data || [];
}

export async function fetchReviewerEditedSyllabuses({ reviewerId, departmentId }) {
  if (!reviewerId) return [];
  const params = { reviewer_id: reviewerId };
  if (departmentId) params.department_id = departmentId;
  const res = await API.get("reviewer/syllabuses/edited/", { params });
  return res.data || [];
}

export async function fetchReviewerHistorySyllabuses({ reviewerId, departmentId }) {
  if (!reviewerId) return [];
  const params = { reviewer_id: reviewerId };
  if (departmentId) params.department_id = departmentId;
  const res = await API.get("reviewer/syllabuses/history/", { params });
  return res.data || [];
}

export async function fetchReviewerSyllabusById({ reviewerId, syllabusId }) {
  const res = await API.get(`reviewer/syllabuses/${syllabusId}/`, {
    params: { reviewer_id: reviewerId },
  });
  return res.data;
}

export async function checkSyllabusByAI({ reviewerId, syllabusId }) {
  const res = await API.post(`reviewer/syllabuses/${syllabusId}/check-ai/`, {
    reviewer_id: reviewerId,
  });
  return res.data; // { results, findings, recommendations }
}

export async function compareSyllabusVersions({ reviewerId, syllabusId }) {
  const res = await API.post(`reviewer/syllabuses/${syllabusId}/compare-ai/`, {
    reviewer_id: reviewerId,
  });
  return res.data; // { differences, summary, changes }
}

export async function approveSyllabus({ reviewerId, syllabusId, comment }) {
  const res = await API.post(`reviewer/syllabuses/${syllabusId}/approve/`, {
    reviewer_id: reviewerId,
    comment: comment || "",
  });
  return res.data;
}

export async function rejectSyllabus({ reviewerId, syllabusId, comment, explanation }) {
  const res = await API.post(`reviewer/syllabuses/${syllabusId}/reject/`, {
    reviewer_id: reviewerId,
    comment: comment || "",
    explanation: explanation || "",
  });
  return res.data;
}

// ===== Lecturer notifications =====
export async function fetchLecturerNotifications(params = {}) {
  const res = await API.get("lecturer/notifications/", { params });
  return res.data || [];
}

export async function fetchLecturerUnreadCount() {
  const res = await API.get("lecturer/notifications/unread-count/");
  return res.data;
}

export async function fetchLecturerNotificationDetail(notificationId) {
  const res = await API.get(`lecturer/notifications/${notificationId}/`);
  return res.data;
}

export async function markLecturerNotificationRead(notificationId) {
  const res = await API.post(`lecturer/notifications/${notificationId}/read/`);
  return res.data;
}

export async function markAllLecturerNotificationsRead() {
  const res = await API.post("lecturer/notifications/mark-all-read/");
  return res.data;
}

// ===== Reviewer notifications =====
export async function fetchReviewerNotifications(params = {}) {
  const res = await API.get("reviewer/notifications/", { params });
  return res.data || [];
}

export async function fetchReviewerUnreadCount() {
  const res = await API.get("reviewer/notifications/unread-count/");
  return res.data;
}

export async function fetchReviewerNotificationDetail(notificationId) {
  const res = await API.get(`reviewer/notifications/${notificationId}/`);
  return res.data;
}

export async function markReviewerNotificationRead(notificationId) {
  const res = await API.post(`reviewer/notifications/${notificationId}/read/`);
  return res.data;
}

// ===== Student =====
export async function fetchStudentMyCourses() {
  const res = await API.get("student/my-courses/");
  return res.data || [];
}

export async function fetchStudentDepartmentCourses() {
  const res = await API.get("student/department-courses/");
  return res.data || [];
}

export async function fetchStudentDepartment() {
  const res = await API.get("student/my-department/");
  return res.data;
}

export async function fetchStudentCourseDetail(courseId) {
  const res = await API.get(`student/courses/${courseId}/`);
  return res.data;
}

export async function fetchStudentCourseAIInsights(courseId) {
  const res = await API.get(`student/courses/${courseId}/ai-insights/`);
  return res.data;
}

export async function fetchStudentNotifications(params = {}) {
  const res = await API.get("student/notifications/", { params });
  return res.data || [];
}

export async function fetchStudentUnreadCount() {
  const res = await API.get("student/notifications/unread-count/");
  return res.data;
}

export async function fetchStudentNotificationDetail(notificationId) {
  const res = await API.get(`student/notifications/${notificationId}/`);
  return res.data;
}

export async function markStudentNotificationRead(notificationId) {
  const res = await API.post(`student/notifications/${notificationId}/read/`);
  return res.data;
}

export async function markAllStudentNotificationsRead() {
  const res = await API.post("student/notifications/mark-all-read/");
  return res.data;
}

export async function downloadStudentSyllabusPdf(courseId, courseName) {
  const res = await API.get(`student/courses/${courseId}/syllabus-pdf/`, {
    responseType: "blob",
  });
  const blob = new Blob([res.data], { type: "application/pdf" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${sanitizeFilenamePart(courseName, `course_${courseId}`)}_syllabus.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
