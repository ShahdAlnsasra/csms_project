// src/pages/Lecturer/LecturerSyllabusNew.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  ArrowLeftIcon,
  SparklesIcon,
  CheckCircleIcon,
  TrashIcon,
} from "@heroicons/react/24/solid";
import { askSyllabusAssistant } from "../../api/api";
import FancySelect from "../../components/FancySelect";
import {
  fetchLecturerCourseById,
  createLecturerSyllabus,
  updateLecturerSyllabus,
  fetchDepartments,
  fetchYears,
  fetchSemesters,
  fetchLecturerSyllabuses,
  fetchLecturerSyllabusById,
  cloneLecturerSyllabus,
} from "../../api/api";

// -------------------- helpers --------------------
const safeJson = (s) => {
  try {
    return typeof s === "string" ? JSON.parse(s) : s;
  } catch {
    return null;
  }
};

const emptyAssessment = { title: "", percent: "" };
const emptyWeek = { week: "", topic: "", sources: "" };
// ✅ remove empty rows when saving as DRAFT (avoid backend validation errors)
const isEmptyWeekRow = (w) =>
  !String(w?.week || "").trim() &&
  !String(w?.topic || "").trim() &&
  !String(w?.sources || "").trim();

const isEmptyAssessmentRow = (a) =>
  !String(a?.title || "").trim() &&
  !String(a?.percent || "").trim();

const cleanWeeksForDraft = (arr) => (Array.isArray(arr) ? arr : []).filter((w) => !isEmptyWeekRow(w));
const cleanAssessForDraft = (arr) =>
  (Array.isArray(arr) ? arr : []).filter((a) => !isEmptyAssessmentRow(a));


const initialForm = {
  courseName: "",
  departmentId: "",
  credits: "",

  academicYear: "",

  // hidden/kept
  ects: "",
  weeks: "13",
  level: "",

  courseType: "",
  delivery: "",

  studyYear: "",
  semester: "",

  instructorEmail: "",
  language: "Hebrew",

  purpose: "",
  learningOutputs: "",
  courseDescription: "",
  literature: "",
  teachingMethodsPlanned: "",
  guidelines: "",
};

function semesterLabel(s) {
  if (s === "A") return "Semester A";
  if (s === "B") return "Semester B";
  if (s === "SUMMER") return "Summer";
  return String(s);
}

function toNiceNumberString(x) {
  if (x === null || x === undefined || x === "") return "";
  const n = Number(x);
  if (Number.isNaN(n)) return String(x);
  return n % 1 === 0 ? String(n.toFixed(0)) : String(n);
}

function getAcademicStartYear() {
  const now = new Date();
  const y = now.getFullYear();
  return now.getMonth() >= 8 ? y : y - 1;
}

function normalizeDeptYears(ys) {
  if (ys && typeof ys === "object" && "data" in ys) return normalizeDeptYears(ys.data);

  // ✅ array
  if (Array.isArray(ys)) {
    const nums = ys
      .flatMap((x) => {
        if (typeof x === "number") return [x];

        if (typeof x === "string") {
          const matches = x.match(/\d+/g) || [];
          return matches.map(Number);
        }

        if (x && typeof x === "object") {
          const raw =
            x.value ?? x.year ?? x.study_year ?? x.studyYear ?? x.id ?? x.name ?? x.label;
          const matches = String(raw ?? "").match(/\d+/g) || [];
          return matches.map(Number);
        }

        return [];
      })
      .filter((n) => Number.isFinite(n) && n > 0);

    return nums.length ? Array.from(new Set(nums)).sort((a, b) => a - b) : [];
  }

  // ✅ number
  if (typeof ys === "number") {
    if (Number.isFinite(ys) && ys > 0) return Array.from({ length: ys }, (_, i) => i + 1);
    return [];
  }

  // ✅ string: supports "1,2,3,4" OR "4 years"
  if (typeof ys === "string") {
    const matches = ys.match(/\d+/g) || [];
    const nums = matches.map(Number).filter((n) => Number.isFinite(n) && n > 0);

    if (nums.length >= 2) {
      return Array.from(new Set(nums)).sort((a, b) => a - b);
    }

    if (nums.length === 1) {
      const n = nums[0];
      // אם זה נראה כמו "4 years" -> count
      return Array.from({ length: n }, (_, i) => i + 1);
    }

    return [];
  }

  // ✅ object
  if (ys && typeof ys === "object") {
    const raw =
      ys.years_of_study ??
      ys.yearsOfStudy ??
      ys.years_count ??
      ys.count ??
      ys.max_year ??
      ys.max ??
      ys.totalYears ??
      ys.years;

    return normalizeDeptYears(raw) || [];
  }

  return [];
}


function makeLocalAIDraft(courseName) {
  const name = courseName || "This course";
  return {
    purpose: `The purpose of ${name} is to provide students with a clear understanding of the core concepts, practical techniques, and problem-solving skills needed for academic and real-world applications.`,
    learningOutputs:
      "- Explain key concepts and terminology\n" +
      "- Solve representative problems using appropriate methods\n" +
      "- Analyze and evaluate solutions (correctness, complexity, tradeoffs)\n" +
      "- Communicate results clearly in written form",
    courseDescription:
      `This course covers foundational topics, guided practice, and structured assignments. Students will develop both theoretical understanding and practical proficiency through examples and exercises.`,
    literature:
      "• Course slides and lecture notes\n• Recommended textbook (as provided by the department)\n• Additional references/articles as announced during the semester",
    teachingMethodsPlanned:
      "Lectures + guided exercises + homework assignments + (optional) quizzes. Additional office hours and discussion sessions as needed.",
    guidelines:
      "Attendance is recommended. Submit assignments on time. Academic integrity is strictly enforced. Students are encouraged to ask questions and participate.",
    weeksPlan: Array.from({ length: 13 }).map((_, i) => ({
      week: String(i + 1),
      topic:
        i === 0
          ? "Introduction + course overview"
          : i === 12
          ? "Review + exam preparation"
          : `Topic ${i + 1}`,
      sources: "Lecture notes / textbook chapters",
    })),
    assessments: [
      { title: "Assignments", percent: "40" },
      { title: "Midterm", percent: "20" },
      { title: "Final exam", percent: "40" },
    ],
  };
}

async function callOpenAISyllabusDraft(payload) {
  const res = await fetch("/api/ai/syllabus-draft", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || "AI request failed");
  }
  return await res.json();
}

async function callOpenAISyllabusRevise(payload) {
  const user = JSON.parse(localStorage.getItem("csmsUser") || "null");
  const token =
    user?.access ||
    user?.token ||
    user?.key ||
    user?.auth_token ||
    localStorage.getItem("access") ||
    localStorage.getItem("token");

  const headers = { "Content-Type": "application/json" };

  if (token) {
    const t = String(token);
    const isJwt = t.split(".").length === 3;
    headers["Authorization"] = isJwt ? `Bearer ${t}` : `Token ${t}`;
  }

  const res = await fetch("/api/ai/syllabus/revise/", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail || `Request failed: ${res.status}`);
  }

  return res.json();
}
async function callOpenAISyllabusChat(payload) {
  const user = JSON.parse(localStorage.getItem("csmsUser") || "null");
  const token =
    user?.access ||
    user?.token ||
    user?.key ||
    user?.auth_token ||
    localStorage.getItem("access") ||
    localStorage.getItem("token");

  const headers = { "Content-Type": "application/json" };

  if (token) {
    const t = String(token);
    const isJwt = t.split(".").length === 3;
    headers["Authorization"] = isJwt ? `Bearer ${t}` : `Token ${t}`;
  }

  const res = await fetch("/api/ai/syllabus-chat/", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail || `Request failed: ${res.status}`);
  }

  return res.json();
}



function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  multiline = false,
  required = false,
  readOnly = false,
  disabled = false,
}) {
  const Comp = multiline ? "textarea" : "input";
  return (
    <label className="flex flex-col gap-1 text-[13px] font-medium text-slate-800 font-sans">
      <span className="flex items-center gap-1">
        {label}
        {required && <span className="text-rose-600">*</span>}
      </span>

      <Comp
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        type={multiline ? undefined : type}
        rows={multiline ? 3 : undefined}
        readOnly={readOnly}
        disabled={disabled}
        className={[
          "rounded-xl border px-3 py-2.5 text-sm outline-none",
          readOnly || disabled
            ? "border-slate-200 bg-slate-100 text-slate-700 cursor-not-allowed"
            : "border-slate-200 bg-slate-50/60 text-slate-900 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300",
        ].join(" ")}
      />
    </label>
  );
}

function SectionTitle({ children }) {
  return (
    <div className="text-left text-indigo-700 font-semibold text-[13px] tracking-wide font-sans">
      {children}
    </div>
  );
}
function SideDrawer({
  open,
  onClose,
  drawerTab,
  setDrawerTab,
  fixRejected,
  aiLoading,
  isLocked,
  prevVersions,
  safeJson,
  courseId,
  navigate,

  chatMessages,
  chatInput,
  setChatInput,
  chatLoading,
  sendChatMessage,
}) {
  if (!open) return null;

  return (
    <>
      {/* overlay */}
      <div className="fixed inset-0 bg-black/30 z-40" onMouseDown={onClose} />

      {/* drawer */}
      <div
        className="fixed left-0 top-0 h-full w-[340px] bg-white z-50 shadow-2xl border-r border-slate-200 flex flex-col"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="text-sm font-extrabold text-slate-900">Panel</div>
          <button
            type="button"
            onClick={onClose}
            className="text-sm px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        {/* tabs */}
        <div className="p-2 border-b border-slate-200 flex gap-2">
          <button
            type="button"
            onClick={() => setDrawerTab("ai")}
            className={[
              "flex-1 px-3 py-2 rounded-xl text-sm font-semibold border",
              drawerTab === "ai"
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
            ].join(" ")}
          >
            AI Assistant
          </button>

          <button
            type="button"
            onClick={() => setDrawerTab("versions")}
            className={[
              "flex-1 px-3 py-2 rounded-xl text-sm font-semibold border",
              drawerTab === "versions"
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
            ].join(" ")}
          >
            Previous Versions
          </button>
        </div>

        {/* content */}
        <div className="p-4 overflow-auto flex-1">
          {drawerTab === "ai" ? (
            <div className="space-y-3">
              <div className="text-xs text-slate-600">
                {fixRejected
                  ? "Fix mode: chat + suggestions based on reviewer comments."
                  : "Chat with the AI assistant about your syllabus."}
              </div>

              {/* messages */}
              <div className="h-[340px] overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                {chatMessages.map((m, idx) => (
                  <div
                    key={idx}
                    className={[
                      "max-w-[90%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap",
                      m.role === "user"
                        ? "ml-auto bg-indigo-600 text-white"
                        : "mr-auto bg-white border border-slate-200 text-slate-900",
                    ].join(" ")}
                  >
                    {m.content}
                  </div>
                ))}

                {chatLoading && (
                  <div className="mr-auto bg-white border border-slate-200 text-slate-500 rounded-2xl px-3 py-2 text-sm">
                    AI is typing...
                  </div>
                )}
              </div>

              {/* input row */}
              <div className="flex gap-2">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendChatMessage();
                    }
                  }}
                  placeholder="כתבי כאן הודעה ל-AI... (Enter לשליחה)"
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                  disabled={chatLoading}
                />

                <button
                  type="button"
                  onClick={sendChatMessage}
                  disabled={chatLoading || !chatInput.trim()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold disabled:opacity-60"
                >
                  Send
                </button>
              </div>

              {/* ✅ הכפתורים השחורים הוסרו בכוונה */}
            </div>
          ) : (
            <div className="space-y-2">
              {prevVersions.length === 0 && (
                <div className="text-sm text-slate-500">No previous versions.</div>
              )}

              {prevVersions.map((v) => {
                const content = safeJson(v.content);
                const yearLabel =
                  v.academic_year || content?.academicYear || content?.academicYearComputed || "";

                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate(`/lecturer/courses/${courseId}/versions/${v.id}`, {
                        state: { version: v },
                      });
                    }}
                    className="w-full text-left rounded-xl border border-slate-200 px-3 py-2 hover:border-indigo-200 hover:bg-slate-50 transition"
                  >
                    <div className="text-sm font-semibold text-slate-900">
                      {yearLabel || `Version #${v.id}`}
                    </div>
                    <div className="text-xs text-slate-500">
                      {v.status || ""} • {v.updated_at ? (v.updated_at.includes('T') ? v.updated_at.slice(0, 16).replace('T', ' ') : v.updated_at.slice(0, 16)) : ""}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// -------------------- component --------------------
export default function LecturerSyllabusNew() {
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const didAutoCloneRef = useRef(false);
  const [aiNote, setAiNote] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState("ai"); // "ai" | "versions"


  const qs = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const mode = (qs.get("mode") || "").toLowerCase();
  const isFixMode = mode === "fix";
  const isReviseMode = mode === "revise";

  const syllabusId = qs.get("syllabusId") || params.versionId || params.syllabusId;
  const isFixDraft = useMemo(() => {
  if (!syllabusId) return false;
  return Boolean(localStorage.getItem(`fixFrom_${syllabusId}`));}, [syllabusId]);
  const isReviseDraft = useMemo(() => {
  if (!syllabusId) return false;
  return Boolean(localStorage.getItem(`reviseFrom_${syllabusId}`));}, [syllabusId]);

  
  const isEdit = Boolean(syllabusId);

  // ✅ support route with/without courseId in params
  const courseId = params.courseId || qs.get("courseId") || "";

  const [form, setForm] = useState(initialForm);
  const [deptYears, setDeptYears] = useState([]);
  const [semesters, setSemesters] = useState([]);

  const [assessments, setAssessments] = useState([emptyAssessment]);
  const [weeksPlan, setWeeksPlan] = useState([emptyWeek]);

  const [errors, setErrors] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);

  const [prevVersions, setPrevVersions] = useState([]);

  const [courseMeta, setCourseMeta] = useState(null);
  const [departmentLabel, setDepartmentLabel] = useState("");
  const [fixDraftId, setFixDraftId] = useState(null);
  const [reviseDraftId, setReviseDraftId] = useState(null);



  const [pageLoading, setPageLoading] = useState(false);
  const [pageError, setPageError] = useState("");
  const [syllabusStatus, setSyllabusStatus] = useState("DRAFT");
  const normalizedStatus = String(syllabusStatus || "DRAFT").toUpperCase();
  const isLocked = normalizedStatus === "PENDING_REVIEW" || normalizedStatus === "APPROVED";
  const isRejected = normalizedStatus === "REJECTED";
  const fixRejected = isFixMode || isRejected || isFixDraft;
  const [reviewerComment, setReviewerComment] = useState("");
  const [chatMessages, setChatMessages] = useState([{ role: "assistant", content: "היי 😊 כתבי לי מה את רוצה לשפר/לתקן בסילבוס ואני אעזור." },]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const lockStudyYear = Boolean(courseMeta?.studyYear);   // אם הגיע מה-DB ננעל

  const sendChatMessage = async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    if (!syllabusId) {
      setChatMessages((prev) => [
         ...prev,
         { role: "assistant", content: "כדי להשתמש בצ׳אט צריך קודם לשמור Draft (שיהיה syllabusId). לחצי 'Save draft' ואז נסי שוב 🙏" },
        ]);
        return;
      }
      setChatMessages((prev) => [...prev, { role: "user", content: text }]);
      setChatInput("");
      setChatLoading(true);
       try {
        const data = await askSyllabusAssistant({
          syllabusId,
          message: text,              // ✅ כאן משתמשים ב-text (ולא userMessage שלא קיים)
          language: form.language,
          ...(fixRejected
            ? {
              currentDraft: {
              academicYear: form.academicYear,
              courseType: form.courseType,
              delivery: form.delivery,
              instructorEmail: form.instructorEmail,
              language: form.language,

              purpose: form.purpose,
              learningOutputs: form.learningOutputs,
              courseDescription: form.courseDescription,
              literature: form.literature,
              teachingMethodsPlanned: form.teachingMethodsPlanned,
              guidelines: form.guidelines,

              // ✅ אלו באים מה-state (לא מה-form)
              weeksPlan,
              assessments,
            },
          }
        : {}),
    });

    const reply = data?.reply || "לא התקבלה תשובה.";
    setChatMessages((prev) => [...prev, { role: "assistant", content: reply }]);
  } catch (e) {
    setChatMessages((prev) => [
      ...prev,
      { role: "assistant", content: `שגיאה: ${e?.message || "Chat failed"}` },
    ]);
  } finally {
    setChatLoading(false);
  }
};



  
  

  
  useEffect(() => {
    if (!isEdit) setSyllabusStatus("DRAFT");
  }, [isEdit]);


  const [yearPickerOpen, setYearPickerOpen] = useState(false);
  const academicStartYear = useMemo(() => getAcademicStartYear(), []);
  const defaultAcademicYear = `${academicStartYear}-${academicStartYear + 1}`;

  // ✅ default academic year
  useEffect(() => {
    setForm((p) => ({ ...p, academicYear: p.academicYear || defaultAcademicYear }));
  }, [defaultAcademicYear]);

  const setField = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const typeOptions = [
    { value: "", label: "Select course type" },
    { value: "MANDATORY", label: "Mandatory" },
    { value: "ELECTIVE", label: "Elective" },
    { value: "GENERAL", label: "General" },
  ];

  const deliveryOptions = [
    { value: "", label: "Select teaching mode" },
    { value: "IN_PERSON", label: "In-person" },
    { value: "ZOOM", label: "Zoom" },
    { value: "HYBRID", label: "In-person + Zoom (Hybrid)" },
  ];

  const yearsOptions = useMemo(() => {
    return [
      { value: "", label: "Select study year" },
      ...deptYears.map((y) => ({ value: String(y), label: `Year ${y}` })),
    ];
  }, [deptYears]);

  const semesterOptions = useMemo(() => {
    const arr = Array.isArray(semesters) ? semesters : [];
    const normalized =
      arr.length && typeof arr[0] === "object"
        ? arr.map((s) => ({
            value: String(s.value ?? s.code ?? s.id ?? ""),
            label: String(s.label ?? s.name ?? s.value ?? ""),
          }))
        : arr.map((s) => ({ value: String(s), label: semesterLabel(s) }));

    return [{ value: "", label: "Select semester" }, ...normalized];
  }, [semesters]);

  // ✅ load departments + course meta + semesters + prev versions
useEffect(() => {
  const user = JSON.parse(localStorage.getItem("csmsUser") || "null");
  if (!user || !courseId) return;

  (async () => {
    try {
      const [deps, sems] = await Promise.all([fetchDepartments(), fetchSemesters()]);

      const depsArr =
        Array.isArray(deps) ? deps :
        Array.isArray(deps?.results) ? deps.results :
        Array.isArray(deps?.data) ? deps.data :
        [];

      const semsArr =
        Array.isArray(sems) ? sems :
        Array.isArray(sems?.results) ? sems.results :
        Array.isArray(sems?.data) ? sems.data :
        [];
      setSemesters(semsArr);

      // ✅ prev versions (כדי שגם usedYears יעבוד וגם Previous Versions בטאב)
      const list = await fetchLecturerSyllabuses({ lecturerId: user.id, courseId });
      const arr = Array.isArray(list) ? list : Array.isArray(list?.results) ? list.results : [];
      setPrevVersions(
        arr.sort((a, b) => String(b.updated_at || "").localeCompare(String(a.updated_at || "")))
      );

      // ✅ course meta
      const course = await fetchLecturerCourseById({ lecturerId: user.id, courseId });
      console.log("course full object:", course);
      if (!course) return;
      const deptCodeFromCourse = course.department_code;
      const deptNameFromCourse = course.department_name;
      const deptObj =
      depsArr.find((d) => String(d.code) === String(deptCodeFromCourse)) ||
      depsArr.find((d) => String(d.name) === String(deptNameFromCourse)) ||
      depsArr.find((d) => String(d.id) === String(course.department_id));
      const deptId = deptObj?.id || course.department_id || "";


      // ✅ years: dept -> course.department -> fetchYears fallback (כמה פורמטים)
      let yearsList = normalizeDeptYears(
        deptObj?.years_of_study ??
        deptObj?.yearsOfStudy ??
        course?.department?.years_of_study ??
        course?.department?.yearsOfStudy ??
        deptObj?.years
      );
      console.log("deptObj:", deptObj);
      console.log("deptId:", deptId);
      console.log("yearsList:", yearsList);


      if (!yearsList.length && deptId) {
        // נסיון בכמה צורות כי לא ברור איך הפונקציה כתובה אצלך ב-api.js
        const attempts = [
           () => fetchYears(deptId),
        ];

        for (const fn of attempts) {
          try {
            const ys = await fn();
            const norm = normalizeDeptYears(ys);
            if (norm.length) {
              yearsList = norm;
              break;
            }
          } catch {
            // continue
          }
        }
      }

      yearsList = Array.from(new Set(yearsList)).sort((a, b) => a - b);
      setDeptYears(yearsList);

      // ✅ department label
      const deptName =
        (typeof course.department === "object" && course.department?.name) ||
        deptObj?.name ||
        "";

      const deptCode =
        (typeof course.department === "object" && course.department?.code) ||
        deptObj?.code ||
        "";

      const deptLabel = deptName ? `${deptName}${deptCode ? ` (${deptCode})` : ""}` : "";
      setDepartmentLabel(deptLabel);

      // ✅ credits + year
      const rawCredits =
        course.credits ?? course.credit_points ?? course.creditPoints ?? course.credit ?? course.creditPoint;

      const courseYear =
        course.year ??
        course.study_year ??
        course.studyYear ??
        course.year_of_study ??
        course.yearOfStudy;

      setCourseMeta({
        courseName: course.name || "",
        departmentId: deptId ? String(deptId) : "",
        credits: toNiceNumberString(rawCredits),
        studyYear: courseYear ? String(courseYear) : "",
        semester: course.semester ? String(course.semester) : "",
      });

      setForm((prev) => ({
        ...prev,
        academicYear: prev.academicYear || defaultAcademicYear,
        courseName: course.name || prev.courseName,
        departmentId: deptId ? String(deptId) : prev.departmentId,
        credits: toNiceNumberString(rawCredits) || prev.credits,
        studyYear: courseYear ? String(courseYear) : prev.studyYear,
        semester: course.semester ? String(course.semester) : prev.semester,
      }));
    } catch (e) {
      setErrors([e?.message || "Failed to load initial data"]);
    }
  })();
}, [courseId, defaultAcademicYear]);

  // ✅ EDIT MODE: load syllabus and fill all fields
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("csmsUser") || "null");
    if (!user) return;
    if (!isEdit || !syllabusId) return;

    setPageLoading(true);
    setPageError("");

    fetchLecturerSyllabusById({ lecturerId: user.id, syllabusId })
      
      .then((syll) => {
       const st = String(syll?.status || "DRAFT").toUpperCase();
       setSyllabusStatus(st);
       setReviewerComment(syll?.reviewer_comment || syll?.rejection_reason || "");
       // ✅ אם זה לא DRAFT — נציג הודעה (העריכה אמורה להגיע רק אחרי Clone)
       const canEditNow = st === "DRAFT" || st === "REJECTED";
       const canAutoClone = (isFixMode && st === "REJECTED") || (isReviseMode && st === "APPROVED");
       if (!canEditNow && !canAutoClone) {
        setPageError("This syllabus is not editable.");
        return;
      }
                

        setForm((p) => ({
          ...p,
          academicYear: syll.academic_year || p.academicYear,
          courseType: syll.course_type || "",
          delivery: syll.delivery || "",
          instructorEmail: syll.instructor_email || "",
          language: syll.language || "Hebrew",
          purpose: syll.purpose || "",
          learningOutputs: syll.learning_outputs || "",
          courseDescription: syll.course_description || "",
          literature: syll.literature || "",
          teachingMethodsPlanned: syll.teaching_methods_planned || "",
          guidelines: syll.guidelines || "",
        }));

        setWeeksPlan(
          Array.isArray(syll.weeks)
            ? syll.weeks.map((w) => ({
                week: String(w.week_number ?? ""),
                topic: w.topic || "",
                sources: w.sources || "",
              }))
            : [emptyWeek]
        );

        const loadedAssessments = Array.isArray(syll.assessments)
            ? syll.assessments.map((a) => ({
                title: a.title || "",
                percent: String(a.percent ?? ""),
              }))
            : [emptyAssessment];
        setAssessments(loadedAssessments);
        
        // Initialize form snapshot for dirty checking after form is loaded
        setTimeout(() => {
          setFormSnapshot({
            purpose: syll.purpose || "",
            learningOutputs: syll.learning_outputs || "",
            courseDescription: syll.course_description || "",
            literature: syll.literature || "",
            teachingMethodsPlanned: syll.teaching_methods_planned || "",
            guidelines: syll.guidelines || "",
            weeksPlan: Array.isArray(syll.weeks)
              ? syll.weeks.map((w) => ({
                  week: String(w.week_number ?? ""),
                  topic: w.topic || "",
                  sources: w.sources || "",
                }))
              : [emptyWeek],
            assessments: loadedAssessments,
          });
        }, 100);
      })
      .catch((err) => {
        setPageError(err?.response?.data?.detail || "Failed to load syllabus for editing");
      })
      .finally(() => setPageLoading(false));
  }, [isEdit, syllabusId, isFixMode, isReviseMode]);
  useEffect(() => {
  const user = JSON.parse(localStorage.getItem("csmsUser") || "null");
  if (!user) return;

  // רק אם אנחנו במצב FIX
  if (!isFixMode) return;

  // רק אם זה עריכה של סילבוס קיים
  if (!isEdit || !syllabusId) return;

  // אם כבר עשינו clone פעם אחת - לא לעשות שוב
  if (didAutoCloneRef.current) return;

  // אם זה כבר דראפט של Fix (נפתח אחרי clone) - לא לעשות clone
  if (isFixDraft || fixDraftId) return;

  // אם המקור REJECTED - חובה Clone לפני כל שמירה
  if (String(syllabusStatus).toUpperCase() !== "REJECTED") return;

  didAutoCloneRef.current = true;

  (async () => {
    try {
      const cloned = await cloneLecturerSyllabus({ syllabusId });
      const newId = cloned?.draft?.id || cloned?.id;
      if (!newId) throw new Error("Clone failed: no draft id returned");

      setFixDraftId(String(newId));
      localStorage.setItem(`fixFrom_${newId}`, String(syllabusId));

      // עוברים לדראפט החדש
      navigate(
        `/lecturer/courses/${courseId}/new?syllabusId=${newId}&mode=fix`,
        { replace: true }
      );

      setSyllabusStatus("DRAFT");
    } catch (e) {
      didAutoCloneRef.current = false;
      setErrors([e?.response?.data?.detail || e?.message || "Clone failed"]);
    }
  })();
}, [isFixMode, isEdit, syllabusId, syllabusStatus, isFixDraft, fixDraftId, courseId, navigate]);
useEffect(() => {
  const user = JSON.parse(localStorage.getItem("csmsUser") || "null");
  if (!user) return;

  // רק אם אנחנו במצב REVISE
  if (!isReviseMode) return;

  // חייב להיות סילבוס קיים
  if (!isEdit || !syllabusId) return;

  // לא לעשות clone יותר מפעם אחת
  if (didAutoCloneRef.current) return;

  // אם כבר זה דראפט שנוצר מרוויז׳ן - לא לעשות שוב
  if (isReviseDraft || reviseDraftId) return;

  // המקור חייב להיות APPROVED
  if (String(syllabusStatus).toUpperCase() !== "APPROVED") return;

  didAutoCloneRef.current = true;

  (async () => {
    try {
      const cloned = await cloneLecturerSyllabus({ syllabusId });
      const newId = cloned?.draft?.id || cloned?.id;
      if (!newId) throw new Error("Clone failed: no draft id returned");

      setReviseDraftId(String(newId));
      localStorage.setItem(`reviseFrom_${newId}`, String(syllabusId));

      navigate(
        `/lecturer/courses/${courseId}/new?syllabusId=${newId}&mode=revise`,
        { replace: true }
      );

      setSyllabusStatus("DRAFT");
    } catch (e) {
      didAutoCloneRef.current = false;
      setErrors([e?.response?.data?.detail || e?.message || "Clone failed"]);
    }
  })();
}, [isReviseMode, isEdit, syllabusId, syllabusStatus, isReviseDraft, reviseDraftId, courseId, navigate]);



  const usedYears = useMemo(() => {
    return (prevVersions || [])
      .map((v) => v.academic_year || safeJson(v.content)?.academicYear || safeJson(v.content)?.academicYearComputed)
      .filter(Boolean);
  }, [prevVersions]);

const validate = (saveAs) => {
  // ✅ Draft: לא חוסמים על שדות חובה
  if (saveAs === "DRAFT") {
    setErrors([]);
    return true;
  }

  const errs = [];

  if (!form.academicYear) errs.push("Academic year is required.");
  if (!form.courseType) errs.push("Course type is required.");
  if (!form.delivery) errs.push("Teaching mode is required.");
  if (!form.studyYear) errs.push("Study year is required.");
  if (!form.semester) errs.push("Semester is required.");

  if (!String(form.purpose || "").trim()) errs.push("Purpose is required.");
  if (!String(form.learningOutputs || "").trim()) errs.push("Learning outcomes is required.");
  if (!String(form.courseDescription || "").trim()) errs.push("Course description is required.");
  if (!String(form.literature || "").trim()) errs.push("References / literature is required.");
  if (!String(form.teachingMethodsPlanned || "").trim()) errs.push("Teaching methods planned is required.");
  if (!String(form.guidelines || "").trim()) errs.push("Guidelines is required.");

  const wp = Array.isArray(weeksPlan) ? weeksPlan : [];
  if (wp.length === 0) errs.push("Weekly plan must have at least one week.");
  wp.forEach((w, i) => {
    if (!String(w.topic || "").trim()) errs.push(`Weekly plan: Topic is required in row ${i + 1}.`);
  });

  const as = Array.isArray(assessments) ? assessments : [];
  if (as.length === 0) errs.push("Assessment must have at least one item.");
  let total = 0;
  as.forEach((a, i) => {
    if (!String(a.title || "").trim()) errs.push(`Assessment item title is required in row ${i + 1}.`);
    const pct = Number(a.percent);
    if (Number.isNaN(pct) || pct < 0 || pct > 100) errs.push(`Assessment % in row ${i + 1} must be between 0 and 100.`);
    total += pct || 0;
  });
  if (as.length > 0 && total !== 100) errs.push("Assessment percentages must total exactly 100%.");

  setErrors(errs);
  return errs.length === 0;
};


// Check if form has been manually edited (dirty)
const isFormDirty = () => {
  if (!formSnapshot) return false;
  return (
    formSnapshot.purpose !== form.purpose ||
    formSnapshot.learningOutputs !== form.learningOutputs ||
    formSnapshot.courseDescription !== form.courseDescription ||
    formSnapshot.literature !== form.literature ||
    formSnapshot.teachingMethodsPlanned !== form.teachingMethodsPlanned ||
    formSnapshot.guidelines !== form.guidelines ||
    JSON.stringify(formSnapshot.weeksPlan) !== JSON.stringify(weeksPlan) ||
    JSON.stringify(formSnapshot.assessments) !== JSON.stringify(assessments)
  );
};

const handleUpdateByAI = async () => {
  setErrors([]);
  
  // Check for dirty changes
  if (isFormDirty()) {
    const confirmed = window.confirm(
      "You have unsaved changes. Applying AI updates will overwrite your manual edits. Continue?"
    );
    if (!confirmed) return;
  }
  
  if (!reviewerComment) {
    setErrors(["Reviewer comment is required for Update by AI"]);
    return;
  }
  
  setAiLoading(true);
  setShowChangesPanel(false);
  setChangesSummary([]);
  setOpenQuestions([]);

  try {
    const payload = {
      courseName: form.courseName,
      language: form.language,
      reviewerComment: reviewerComment,
      currentDraft: {
        purpose: form.purpose,
        learningOutputs: form.learningOutputs,
        courseDescription: form.courseDescription,
        literature: form.literature,
        teachingMethodsPlanned: form.teachingMethodsPlanned,
        guidelines: form.guidelines,
        weeksPlan,
        assessments,
      },
      userInstruction: aiNote,
    };

    const result = await callOpenAISyllabusRevise(payload);
    
    // Show changes summary and open questions
    setChangesSummary(Array.isArray(result.changesSummary) ? result.changesSummary : []);
    setOpenQuestions(Array.isArray(result.openQuestions) ? result.openQuestions : []);
    setShowChangesPanel(true);
    
    // Apply updates (only changed fields)
    setForm((p) => ({
      ...p,
      purpose: result.purpose ?? p.purpose,
      learningOutputs: result.learningOutputs ?? p.learningOutputs,
      courseDescription: result.courseDescription ?? p.courseDescription,
      literature: result.literature ?? p.literature,
      teachingMethodsPlanned: result.teachingMethodsPlanned ?? p.teachingMethodsPlanned,
      guidelines: result.guidelines ?? p.guidelines,
    }));

    if (Array.isArray(result.weeksPlan)) setWeeksPlan(result.weeksPlan);
    if (Array.isArray(result.assessments)) setAssessments(result.assessments);
    
    // Update snapshot after applying changes
    setFormSnapshot({
      purpose: form.purpose,
      learningOutputs: form.learningOutputs,
      courseDescription: form.courseDescription,
      literature: form.literature,
      teachingMethodsPlanned: form.teachingMethodsPlanned,
      guidelines: form.guidelines,
      weeksPlan: [...weeksPlan],
      assessments: [...assessments],
    });
  } catch (error) {
    setErrors([error.message || "AI update failed"]);
  } finally {
    setAiLoading(false);
  }
};

const handleFillWithAI = async () => {
  setErrors([]);
  setAiLoading(true);

  try {
    const payload = {
      courseName: form.courseName,
      language: form.language,
      mode: fixRejected ? "fix" : "fill",
      reviewerComment: fixRejected ? reviewerComment : "",
      currentDraft: {
        purpose: form.purpose,
        learningOutputs: form.learningOutputs,
        courseDescription: form.courseDescription,
        literature: form.literature,
        teachingMethodsPlanned: form.teachingMethodsPlanned,
        guidelines: form.guidelines,
        weeksPlan,
        assessments,
      },
      userInstruction: aiNote,
    };

    let draft = null;
    try {
      draft = await callOpenAISyllabusDraft(payload);
    } catch {
      draft = makeLocalAIDraft(form.courseName);
    }

    setForm((p) => ({
      ...p,
      purpose: draft.purpose ?? p.purpose,
      learningOutputs: draft.learningOutputs ?? p.learningOutputs,
      courseDescription: draft.courseDescription ?? p.courseDescription,
      literature: draft.literature ?? p.literature,
      teachingMethodsPlanned: draft.teachingMethodsPlanned ?? p.teachingMethodsPlanned,
      guidelines: draft.guidelines ?? p.guidelines,
    }));

    if (Array.isArray(draft.weeksPlan)) setWeeksPlan(draft.weeksPlan);
    if (Array.isArray(draft.assessments)) setAssessments(draft.assessments);
  } finally {
    setAiLoading(false);
  }
};

const handleSubmit = async (saveAs) => {
  setPageError("");

  // ✅ validate רק על SUBMIT
  if (!validate(saveAs)) return;

  const user = JSON.parse(localStorage.getItem("csmsUser") || "null");
  if (!user) {
    setErrors(["User not found. Please login again."]);
    return;
  }

  // ✅ block duplicate year רק כאשר SUBMIT (Draft מותר גם אם זה שנה קיימת)
  if (!isEdit && form.academicYear && usedYears.includes(form.academicYear)) {
    setErrors(["It is not possible to create another syllabus for the same academic year."]);
    return;
  }

    // ✅ for DRAFT: don't send empty week/assessment rows (prevents 400)
    const weeksToSend = saveAs === "DRAFT" ? cleanWeeksForDraft(weeksPlan) : weeksPlan;
    const assessmentsToSend = saveAs === "DRAFT" ? cleanAssessForDraft(assessments) : assessments;

    const contentObj = {
      ...form,
      courseName: courseMeta?.courseName || form.courseName,
      departmentId: courseMeta?.departmentId || form.departmentId,
      credits: courseMeta?.credits || form.credits,
      academicYearComputed: form.academicYear,
      weeksPlan: weeksToSend,
      assessments: assessmentsToSend,
    };

    try {
          let targetId = syllabusId;

    if (isEdit && fixRejected && normalizedStatus !== "DRAFT") {
      if (fixDraftId) {
        targetId = fixDraftId;
      } else {
        const cloned = await cloneLecturerSyllabus({ syllabusId });
        const newId = cloned?.draft?.id || cloned?.id;

        if (!newId) throw new Error("Clone failed: no draft id returned");

        setFixDraftId(newId);
        targetId = newId;
        localStorage.setItem(`fixFrom_${newId}`, String(syllabusId));


        // אופציונלי אבל מומלץ: לעבור ל-URL של הדראפט החדש
        navigate(`/lecturer/courses/${courseId}/new?syllabusId=${newId}&mode=fix`, { replace: true });
        setSyllabusStatus("DRAFT"); // שיהיה ברור שזה דראפט עכשיו
      }
    }

      if (isEdit) {
        await updateLecturerSyllabus({
          lecturerId: user.id,
          syllabusId: targetId,
          content: contentObj,
          saveAs,
        });
      } else {
        await createLecturerSyllabus({
          lecturerId: user.id,
          courseId,
          content: contentObj,
          saveAs,
        });
      }

      alert(saveAs === "DRAFT" ? "Draft saved." : "Submitted for approval.");
      navigate(`/lecturer/courses/${courseId}`);
    } catch (e) {
      setErrors([e?.response?.data?.detail || e.message || "Failed to save syllabus"]);
    }
  };

  const YearPicker = () => {
    if (!yearPickerOpen) return null;
    const years = Array.from({ length: 100 }).map((_, i) => academicStartYear + i);

    return (
      <div className="absolute z-50 mt-2 w-full rounded-2xl border border-slate-200 bg-white shadow-xl p-3">
        <div className="text-xs font-semibold text-slate-700 mb-2">
          Select academic year (current and above)
        </div>

        <div className="max-h-72 overflow-auto pr-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {years.map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => {
                  setField("academicYear", `${y}-${y + 1}`);
                  setYearPickerOpen(false);
                }}
                className="rounded-xl border border-slate-200 py-2 text-sm hover:border-indigo-200 hover:bg-slate-50 transition"
              >
                {y}-{y + 1}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setYearPickerOpen(false)}
          className="mt-3 w-full rounded-xl border border-slate-200 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          Close
        </button>
      </div>
    );
  };


  

  if (pageLoading) {
    return <div className="p-6 text-slate-600">Loading syllabus...</div>;
  }
  if (pageError) {
    return <div className="p-6 text-rose-600">{pageError}</div>;
  }

  return (
    <div className="w-full">
      <SideDrawer
  open={drawerOpen}
  onClose={() => setDrawerOpen(false)}
  drawerTab={drawerTab}
  setDrawerTab={setDrawerTab}
  aiNote={aiNote}
  setAiNote={setAiNote}
  fixRejected={fixRejected}
  aiLoading={aiLoading}
  isLocked={isLocked}
  handleFillWithAI={handleFillWithAI}
  prevVersions={prevVersions}
  safeJson={safeJson}
  courseId={courseId}
  navigate={navigate}
    // ✅ חדש:
  chatMessages={chatMessages}
  chatInput={chatInput}
  setChatInput={setChatInput}
  chatLoading={chatLoading}
  sendChatMessage={sendChatMessage}
/>
      
      {/* Changes Summary and Open Questions Panel */}
      {showChangesPanel && (changesSummary.length > 0 || openQuestions.length > 0) && (
        <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl border-l border-slate-200 z-50 overflow-y-auto">
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-extrabold text-slate-900">AI Update Results</h2>
              <button
                type="button"
                onClick={() => setShowChangesPanel(false)}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
              >
                ✕
              </button>
            </div>
            
            {changesSummary.length > 0 && (
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wide text-indigo-700 mb-3">
                  Changes Summary
                </h3>
                <ul className="space-y-2">
                  {changesSummary.map((item, idx) => (
                    <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                      <span className="text-indigo-600 mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {openQuestions.length > 0 && (
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wide text-amber-700 mb-3">
                  Open Questions
                </h3>
                <ul className="space-y-2">
                  {openQuestions.map((item, idx) => (
                    <li key={idx} className="text-sm text-amber-800 flex items-start gap-2">
                      <span className="text-amber-600 mt-1">?</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-amber-600 mt-2">
                  Please provide this information manually.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 gap-6 items-start">
        <div className="space-y-4">  
          {/* ✅ show reviewer comment in REJECTED - always show when syllabus is rejected */}
          {((fixRejected || syllabusStatus === "REJECTED") && reviewerComment) && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
              <div className="font-bold">Reviewer comment</div>
              <div className="text-sm mt-1 whitespace-pre-wrap">{reviewerComment}</div>
            </div>
          )}
<div className="flex items-center justify-between">
  <div className="flex items-center gap-2">
    {/* Hamburger */}
    <button
      type="button"
      onClick={() => setDrawerOpen(true)}
      className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50"
      title="Open panel"
    >
      {/* 3 lines icon */}
      <span className="text-xl leading-none">≡</span>
    </button>

    <button
      type="button"
      onClick={() => navigate(-1)}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 text-sm hover:bg-slate-50"
    >
      <ArrowLeftIcon className="h-4 w-4" />
      Back
    </button>
  </div>

  {/* Update by AI button - show only for REJECTED/revise mode, otherwise Fill by AI */}
  
{!isLocked && (fixRejected || isReviseMode) ? (
  <button
    type="button"
    onClick={handleUpdateByAI}
    disabled={aiLoading}
    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 text-white text-sm font-semibold shadow-lg hover:shadow-xl transition disabled:opacity-60"
  >
    <SparklesIcon className="h-5 w-5" />
    {aiLoading ? "Updating..." : "Update by AI"}
  </button>
) : !isLocked ? (
  <button
    type="button"
    onClick={handleFillWithAI}
    disabled={aiLoading}
    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 text-white text-sm font-semibold shadow-lg hover:shadow-xl transition disabled:opacity-60"
  >
    <SparklesIcon className="h-5 w-5" />
    {aiLoading ? "Working..." : "Fill form with AI"}
  </button>
) : null}

</div>


          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 space-y-6">
            <div className="text-left">
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
                {form.courseName || `Course #${courseId}`} — Syllabus form {isEdit ? "(Edit)" : ""}
              </h1>
              <p className="text-sm text-slate-600">
                {isEdit ? "Edit your existing syllabus." : "Fill manually or click AI to auto-fill the content."}
              </p>
            </div>

            <SectionTitle>Course details</SectionTitle>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Course name" value={form.courseName} onChange={() => {}} readOnly disabled />
              <Field label="Department" value={departmentLabel || "—"} onChange={() => {}} readOnly disabled />

              <div className="relative">
                <label className="flex flex-col gap-1 text-[13px] font-medium text-slate-800 font-sans">
                  <span className="flex items-center gap-1">
                    Academic year <span className="text-rose-600">*</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => !isEdit && setYearPickerOpen((s) => !s)}
                    disabled={isEdit}
                    className={["w-full text-left rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-sm text-slate-900 hover:bg-slate-50"
                   ].join(" ")}
                  >
                    {form.academicYear || "Select academic year"}
                  </button>
                </label>
                <YearPicker />
              </div>

              <Field label="Credit points" type="number" value={form.credits} onChange={() => {}} readOnly disabled />

              <label className="flex flex-col gap-1 text-[13px] font-medium text-slate-800 font-sans">
                <span className="flex items-center gap-1">
                  Course type <span className="text-rose-600">*</span>
                </span>
                <FancySelect value={form.courseType} onChange={(v) => setField("courseType", v)} options={typeOptions} />
              </label>

              <label className="flex flex-col gap-1 text-[13px] font-medium text-slate-800 font-sans">
                <span className="flex items-center gap-1">
                  Teaching mode <span className="text-rose-600">*</span>
                </span>
                <FancySelect value={form.delivery} onChange={(v) => setField("delivery", v)} options={deliveryOptions} />
              </label>

              {/* ✅ use yearsOptions so no-unused-vars */}
              <label className="flex flex-col gap-1 text-[13px] font-medium text-slate-800 font-sans">
                <span className="flex items-center gap-1">
                  Study year <span className="text-rose-600">*</span>
                </span>
                <FancySelect value={form.studyYear} onChange={(v) => setField("studyYear", v)} options={yearsOptions} disabled={lockStudyYear} />
              </label>

              <label className="flex flex-col gap-1 text-[13px] font-medium text-slate-800 font-sans">
                <span className="flex items-center gap-1">
                  Semester <span className="text-rose-600">*</span>
                </span>
                <FancySelect value={form.semester} onChange={() => {}} options={semesterOptions} disabled />
              </label>

              <Field label="Instructor email" value={form.instructorEmail} onChange={(v) => setField("instructorEmail", v)} />
              <Field label="Teaching language" value={form.language} onChange={(v) => setField("language", v)} />
            </div>

            <SectionTitle>Purpose</SectionTitle>
            <Field label="Purpose" value={form.purpose} onChange={(v) => setField("purpose", v)} multiline required />

            <SectionTitle>Learning outcomes</SectionTitle>
            <Field label="Learning outcomes" value={form.learningOutputs} onChange={(v) => setField("learningOutputs", v)} multiline required />

            <SectionTitle>Course content</SectionTitle>
            <Field label="Course description" value={form.courseDescription} onChange={(v) => setField("courseDescription", v)} multiline required />

            <SectionTitle>Required and recommended literature</SectionTitle>
            <Field label="References / literature" value={form.literature} onChange={(v) => setField("literature", v)} multiline required />

            <SectionTitle>Planned learning activities and teaching methods</SectionTitle>

            <div className="space-y-2">
              <div className="text-[13px] font-medium text-slate-800 font-sans">
                Weekly plan <span className="text-rose-600">*</span>
              </div>

              <div className="space-y-3">
                {weeksPlan.map((w, i) => (
                  <div
                    key={i}
                    className="relative grid md:grid-cols-3 gap-2 rounded-xl border border-slate-200 p-3 bg-slate-50/50"
                  >
                    <button
                      type="button"
                      onClick={() => setWeeksPlan((p) => p.filter((_, idx) => idx !== i))}
                      className="absolute right-2 top-2 p-2 rounded-lg hover:bg-rose-50"
                      title="Delete week"
                    >
                      <TrashIcon className="h-4 w-4 text-rose-500" />
                    </button>

                    <Field
                      label="Week"
                      value={w.week}
                      onChange={(v) =>
                        setWeeksPlan((p) => {
                          const next = [...p];
                          next[i] = { ...next[i], week: v };
                          return next;
                        })
                      }
                      placeholder={`${i + 1}`}
                    />

                    <Field
                      label="Topic"
                      value={w.topic}
                      onChange={(v) =>
                        setWeeksPlan((p) => {
                          const next = [...p];
                          next[i] = { ...next[i], topic: v };
                          return next;
                        })
                      }
                      required
                    />

                    <Field
                      label="Sources"
                      value={w.sources}
                      onChange={(v) =>
                        setWeeksPlan((p) => {
                          const next = [...p];
                          next[i] = { ...next[i], sources: v };
                          return next;
                        })
                      }
                    />
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setWeeksPlan((p) => [...p, { ...emptyWeek }])}
                  className="text-sm font-semibold text-indigo-700"
                >
                  + Add week
                </button>
              </div>
            </div>

            <Field
              label="Teaching methods planned"
              value={form.teachingMethodsPlanned}
              onChange={(v) => setField("teachingMethodsPlanned", v)}
              multiline
              required
            />

            <SectionTitle>Guidelines</SectionTitle>
            <Field label="Guidelines" value={form.guidelines} onChange={(v) => setField("guidelines", v)} multiline required />

            <div className="space-y-2">
              <div className="text-[13px] font-medium text-slate-800 font-sans">
                Assessment (must total 100%) <span className="text-rose-600">*</span>
              </div>

              <div className="space-y-3">
                {assessments.map((a, i) => (
                  <div
                    key={i}
                    className="relative grid md:grid-cols-[1fr,140px] gap-2 rounded-xl border border-slate-200 p-3 bg-slate-50/50"
                  >
                    <button
                      type="button"
                      onClick={() => setAssessments((p) => p.filter((_, idx) => idx !== i))}
                      className="absolute right-2 top-2 p-2 rounded-lg hover:bg-rose-50"
                      title="Delete item"
                    >
                      <TrashIcon className="h-4 w-4 text-rose-500" />
                    </button>

                    <Field
                      label="Item"
                      value={a.title}
                      onChange={(v) =>
                        setAssessments((p) => {
                          const next = [...p];
                          next[i] = { ...next[i], title: v };
                          return next;
                        })
                      }
                      required
                    />

                    <Field
                      label="%"
                      type="number"
                      value={a.percent}
                      onChange={(v) =>
                        setAssessments((p) => {
                          const next = [...p];
                          next[i] = { ...next[i], percent: v };
                          return next;
                        })
                      }
                      required
                    />
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setAssessments((p) => [...p, { ...emptyAssessment }])}
                  className="text-sm font-semibold text-indigo-700"
                >
                  + Add assessment item
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              {!isLocked  && (
                <button type="button"
                onClick={() => handleSubmit("DRAFT")}
                disabled={isLocked}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-800 hover:bg-slate-50 shadow-sm">
                  Save draft </button>
                )}

              <button
                type="button"
                onClick={() => handleSubmit("SUBMIT")}
                disabled={isLocked}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-lg"
              >
                <CheckCircleIcon className="h-5 w-5" />
                {(isReviseMode || isReviseDraft) ? "Update & resubmit" : fixRejected ? "Fix & resubmit" : "Submit for approval"}
              </button>
            </div>
          </div>

          {errors.length > 0 && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3 space-y-1">
              {errors.map((e, idx) => (
                <div key={idx}>{e}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
