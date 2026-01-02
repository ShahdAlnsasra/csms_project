
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
  if (!deptId) {
    console.warn("[API] fetchYears: No deptId provided");
    return [];
  }
  try {
    console.log("[API] fetchYears: Calling API with deptId:", deptId);
    const res = await API.get(`departments/${deptId}/years/`);
    console.log("[API] fetchYears: Response:", res.data);
    // { years: [1,2,3] }
    const years = res.data?.years || [];
    console.log("[API] fetchYears: Extracted years:", years);
    return years;
  } catch (error) {
    console.error("[API] fetchYears: Error:", error);
    console.error("[API] fetchYears: Error details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      url: `departments/${deptId}/years/`,
    });
    return [];
  }
}

// ---- SEMESTERS (גלובלי מה־choices) ----
export async function fetchSemesters() {
  try {
    console.log("[API] fetchSemesters: Calling API");
    const res = await API.get("semesters/");
    console.log("[API] fetchSemesters: Response:", res.data);
    // { semesters: ["A","B","SUMMER"] }
    const semesters = res.data?.semesters || [];
    console.log("[API] fetchSemesters: Extracted semesters:", semesters);
    return semesters;
  } catch (error) {
    console.error("[API] fetchSemesters: Error:", error);
    console.error("[API] fetchSemesters: Error details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    return [];
  }
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

// ===== Lecturer – dynamic data =====
export async function fetchLecturerCourses({ lecturerId, departmentId, year } = {}) {
  if (!lecturerId) return [];
  const params = { lecturer_id: lecturerId };
  if (departmentId) params.department_id = departmentId;
  if (year) params.year = year;
  const res = await API.get("lecturer/courses/", { params });
  return res.data || [];
}

export async function fetchLecturerCourseById({ lecturerId, courseId }) {
  if (!lecturerId || !courseId) {
    console.warn("[API] fetchLecturerCourseById: Missing params", { lecturerId, courseId });
    return null;
  }
  try {
    console.log("[API] fetchLecturerCourseById: Calling API", { lecturerId, courseId, courseIdType: typeof courseId });
    const res = await API.get("lecturer/courses/", {
      params: { lecturer_id: lecturerId },
    });
    let list = res.data || [];
    console.log("[API] fetchLecturerCourseById: Courses list received:", {
      count: list.length,
      courseIds: list.map(c => ({ id: c.id, name: c.name })),
      searchingFor: courseId,
    });
    
    // If lecturer has no assigned courses, try fallback: fetch from department
    if (list.length === 0) {
      console.warn("[API] fetchLecturerCourseById: Lecturer has no assigned courses, trying department fallback");
      try {
        // Get user's department
        const user = JSON.parse(localStorage.getItem("csmsUser") || "null");
        const deptId = user?.department?.id || user?.department_id || user?.department;
        if (deptId) {
          console.log("[API] fetchLecturerCourseById: Fetching department courses as fallback, deptId:", deptId);
          const deptRes = await API.get("department-admin/courses/", {
            params: { department_id: deptId },
          });
          const deptCourses = deptRes.data || [];
          console.log("[API] fetchLecturerCourseById: Department courses found:", deptCourses.length);
          // Transform department course format to match lecturer course format
          list = deptCourses.map(c => ({
            id: c.id,
            name: c.name,
            code: c.code,
            year: c.year,
            semester: c.semester,
            credits: c.credits,
            department_name: c.department_name || c.department?.name,
            department_code: c.department_code || c.department?.code,
            department_id: c.department_id || c.department?.id || c.department,
          }));
          console.log("[API] fetchLecturerCourseById: Using department courses as fallback:", {
            count: list.length,
            courseIds: list.map(c => ({ id: c.id, name: c.name })),
          });
        }
      } catch (fallbackError) {
        console.warn("[API] fetchLecturerCourseById: Fallback failed:", fallbackError);
      }
    }
    
    // Try multiple matching strategies
    let course = list.find((c) => String(c.id) === String(courseId));
    if (!course) {
      course = list.find((c) => Number(c.id) === Number(courseId));
    }
    if (!course) {
      course = list.find((c) => c.id == courseId); // loose equality
    }
    
    console.log("[API] fetchLecturerCourseById: Found course:", course);
    
    if (!course) {
      console.error("[API] fetchLecturerCourseById: Course not found", {
        courseId,
        availableCourseIds: list.map(c => c.id),
        lecturerId,
        message: "Course not found in assigned courses or department courses."
      });
    }
    
    return course || null;
  } catch (error) {
    console.error("[API] fetchLecturerCourseById: Error:", error);
    console.error("[API] fetchLecturerCourseById: Error details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    return null;
  }
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
