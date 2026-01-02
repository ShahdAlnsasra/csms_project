// ReviewerSyllabusDetail.jsx - For new syllabuses
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  ArrowLeftIcon,
  SparklesIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentMagnifyingGlassIcon,
} from "@heroicons/react/24/solid";
import {
  fetchReviewerSyllabusById,
  checkSyllabusByAI,
  approveSyllabus,
  rejectSyllabus,
  fetchDepartments,
} from "../../api/api";

const safeJson = (s) => {
  try {
    return typeof s === "string" ? JSON.parse(s) : s;
  } catch {
    return null;
  }
};

const pick = (...vals) => {
  for (const v of vals) {
    if (v !== null && v !== undefined && String(v).trim() !== "") return v;
  }
  return "";
};

function Field({ label, value, type = "text", multiline = false }) {
  const Comp = multiline ? "textarea" : "input";
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[12px] font-semibold tracking-wide text-slate-700">
        {label}
      </span>
      <Comp
        value={value ?? ""}
        type={multiline ? undefined : type}
        rows={multiline ? 3 : undefined}
        readOnly
        disabled
        className={[
          "w-full rounded-2xl border border-slate-200/80",
          "bg-white/70 backdrop-blur px-4 py-3",
          "text-[14px] text-slate-900 font-medium",
          "shadow-sm cursor-not-allowed",
        ].join(" ")}
      />
    </label>
  );
}

function SectionTitle({ children }) {
  return (
    <div className="text-left">
      <div className="inline-flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-indigo-600" />
        <div className="text-[12px] font-extrabold uppercase tracking-[0.18em] text-indigo-700">
          {children}
        </div>
      </div>
      <div className="mt-2 h-px w-full bg-gradient-to-r from-indigo-200 via-sky-200 to-transparent" />
    </div>
  );
}

export default function ReviewerSyllabusDetail() {
  const { syllabusId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("csmsUser") || "null");
    } catch {
      return null;
    }
  }, []);

  const isReadOnly = location.state?.readOnly || false;

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [syllabus, setSyllabus] = useState(null);
  const [departmentLabel, setDepartmentLabel] = useState("");
  const [aiResults, setAiResults] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showDecisionForm, setShowDecisionForm] = useState(false);
  const [decision, setDecision] = useState(""); // "approve" or "reject"
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user?.id || !syllabusId) return;

    let cancelled = false;
    setLoading(true);
    setErr("");

    Promise.all([
      fetchReviewerSyllabusById({ reviewerId: user.id, syllabusId }),
      fetchDepartments().catch(() => []),
    ])
      .then(([syllabusData, deps]) => {
        if (cancelled) return;
        setSyllabus(syllabusData);
        
        console.log("[REVIEWER] Syllabus data received:", {
          syllabusData,
          course: syllabusData?.course,
          department_id: syllabusData?.department_id,
          course_department: syllabusData?.course?.department,
        });
        console.log("[REVIEWER] Departments list:", deps);

        // Try multiple sources for department info
        const deptId =
          syllabusData?.department_id ||
          syllabusData?.course?.department_id ||
          (typeof syllabusData?.course?.department === "number" ||
          typeof syllabusData?.course?.department === "string"
            ? syllabusData.course.department
            : syllabusData?.course?.department?.id);

        console.log("[REVIEWER] Extracted deptId:", deptId);

        // Try to get department from departments list
        const depsArr = Array.isArray(deps) ? deps : (Array.isArray(deps?.results) ? deps.results : (Array.isArray(deps?.data) ? deps.data : []));
        const dept = deptId ? depsArr.find((d) => String(d.id) === String(deptId)) : null;
        
        console.log("[REVIEWER] Found department from list:", dept);
        
        // Priority: 1) department_name/department_code from serializer, 2) departments list, 3) course fallback
        if (syllabusData?.department_name || syllabusData?.department_code) {
          const deptName = syllabusData.department_name || "";
          const deptCode = syllabusData.department_code || "";
          const label = deptName ? `${deptName}${deptCode ? ` (${deptCode})` : ""}` : "";
          console.log("[REVIEWER] Setting department label from serializer:", label);
          setDepartmentLabel(label);
        } else if (dept) {
          const label = `${dept.name}${dept.code ? ` (${dept.code})` : ""}`;
          console.log("[REVIEWER] Setting department label from dept list:", label);
          setDepartmentLabel(label);
        } else if (syllabusData?.course?.department_name || syllabusData?.course?.department_code) {
          // Fallback: use department name/code from course if available
          const deptName = syllabusData.course.department_name || "";
          const deptCode = syllabusData.course.department_code || "";
          const label = deptName ? `${deptName}${deptCode ? ` (${deptCode})` : ""}` : "";
          console.log("[REVIEWER] Setting department label from course:", label);
          setDepartmentLabel(label);
        } else {
          console.warn("[REVIEWER] No department found in any source");
          setDepartmentLabel("");
        }
      })
      .catch((e) => {
        if (cancelled) return;
        const errorMsg = e?.response?.data?.detail || e?.response?.data?.message || e?.message || "Failed to load syllabus";
        console.error("Error loading syllabus:", e);
        setErr(errorMsg);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id, syllabusId]);

  const handleCheckByAI = async () => {
    if (!user?.id || !syllabusId) return;
    setAiLoading(true);
    setErr("");

    try {
      const results = await checkSyllabusByAI({ reviewerId: user.id, syllabusId });
      setAiResults(results);
      setShowDecisionForm(true);
    } catch (e) {
      const errorMsg = e?.response?.data?.detail || e?.response?.data?.message || e?.message || "Failed to check syllabus by AI";
      console.error("Error checking by AI:", e);
      setErr(errorMsg);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmitDecision = async () => {
    if (!user?.id || !syllabusId || !decision) return;
    if (decision === "reject" && !comment.trim()) {
      setErr("Please provide a comment when rejecting.");
      return;
    }

    setSubmitting(true);
    setErr("");

    try {
      if (decision === "approve") {
        await approveSyllabus({ reviewerId: user.id, syllabusId, comment });
      } else {
        await rejectSyllabus({
          reviewerId: user.id,
          syllabusId,
          comment,
          explanation: comment,
        });
      }
      navigate("/reviewer/new-syllabuses", {
        state: { message: `Syllabus ${decision === "approve" ? "approved" : "rejected"} successfully` },
      });
    } catch (e) {
      const errorMsg = e?.response?.data?.detail || e?.response?.data?.message || e?.message || "Failed to submit decision";
      console.error("Error submitting decision:", e);
      setErr(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // All hooks must be called before any early returns
  const content = useMemo(() => safeJson(syllabus?.content) || {}, [syllabus]);
  
  // Check if syllabus is read-only (approved or rejected)
  const syllabusIsReadOnly = syllabus?.status === "APPROVED" || syllabus?.status === "REJECTED";
  const finalIsReadOnly = isReadOnly || syllabusIsReadOnly;

  const academicYear = pick(
    syllabus?.academic_year,
    content?.academicYear,
    content?.academicYearComputed
  );

  const courseName = pick(syllabus?.course_name, syllabus?.course?.name, content?.courseName);
  const courseCode = pick(syllabus?.course_code, syllabus?.course?.code, content?.courseCode);
  const courseYear = pick(syllabus?.course_year, syllabus?.course?.year, content?.studyYear);
  const courseSemester = pick(syllabus?.course_semester, syllabus?.course?.semester, content?.semester);
  const credits = pick(syllabus?.credits, content?.credits);

  const courseType = pick(syllabus?.course_type, content?.courseType);
  const delivery = pick(syllabus?.delivery, content?.delivery);
  const instructorEmail = pick(syllabus?.instructor_email, content?.instructorEmail);
  const language = pick(syllabus?.language, content?.language, "Hebrew");

  const purpose = pick(syllabus?.purpose, content?.purpose);
  const learningOutputs = pick(syllabus?.learning_outputs, content?.learningOutputs);
  const courseDescription = pick(syllabus?.course_description, content?.courseDescription);
  const literature = pick(syllabus?.literature, content?.literature);
  const teachingMethodsPlanned = pick(syllabus?.teaching_methods_planned, content?.teachingMethodsPlanned);
  const guidelines = pick(syllabus?.guidelines, content?.guidelines);

  const weeksPlan = useMemo(() => {
    const fromSyllabus = Array.isArray(syllabus?.weeks)
      ? syllabus.weeks.map((w) => ({
          week: String(w.week_number ?? w.week ?? ""),
          topic: w.topic || "",
          sources: w.sources || "",
        }))
      : [];

    const fromContent = Array.isArray(content?.weeksPlan)
      ? content.weeksPlan.map((w) => ({
          week: String(w.week ?? w.week_number ?? ""),
          topic: w.topic || "",
          sources: w.sources || "",
        }))
      : [];

    const merged = fromSyllabus.length ? fromSyllabus : fromContent;
    return merged
      .filter((w) => String(w.week || w.topic || w.sources).trim() !== "")
      .slice()
      .sort((a, b) => Number(a.week || 0) - Number(b.week || 0));
  }, [syllabus, content]);

  const assessments = useMemo(() => {
    const fromSyllabus = Array.isArray(syllabus?.assessments)
      ? syllabus.assessments.map((a) => ({
          title: a.title || "",
          percent: String(a.percent ?? ""),
        }))
      : [];

    const fromContent = Array.isArray(content?.assessments)
      ? content.assessments.map((a) => ({
          title: a.title || "",
          percent: String(a.percent ?? ""),
        }))
      : [];

    const merged = fromSyllabus.length ? fromSyllabus : fromContent;
    return merged.filter((a) => String(a.title || a.percent).trim() !== "");
  }, [syllabus, content]);

  // Early returns after all hooks
  if (loading && !syllabus) {
    return (
      <div className="min-h-[70vh] grid place-items-center text-slate-700">
        <div className="rounded-2xl border border-slate-200 bg-white/70 backdrop-blur p-6 shadow-sm">
          Loading syllabus...
        </div>
      </div>
    );
  }

  if (err && !syllabus) {
    return (
      <div className="min-h-[70vh] grid place-items-center text-rose-700">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
          {err}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/70 to-sky-50 py-6">
        <div className="mx-auto w-full max-w-6xl px-4 space-y-6">
          {/* Top bar */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/reviewer/new-syllabuses")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 bg-white/70 backdrop-blur text-slate-800 text-sm font-semibold hover:bg-white shadow-sm"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back
            </button>

            <div className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.2em] text-indigo-700">
              <SparklesIcon className="h-4 w-4" />
              Review Syllabus
            </div>
          </div>

          {/* Title card */}
          <div className="rounded-3xl border border-slate-200/80 bg-white/70 backdrop-blur shadow-sm p-6">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                {courseName || `Syllabus #${syllabusId}`}
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                {courseCode && (
                  <span className="text-sm font-semibold text-slate-600">({courseCode})</span>
                )}
                {academicYear && (
                  <span className="text-sm font-semibold text-slate-600">• {academicYear}</span>
                )}
                {departmentLabel && (
                  <span className="text-xs font-bold rounded-full px-3 py-1 bg-indigo-50 text-indigo-800 border border-indigo-200">
                    {departmentLabel}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* AI Check button and Manual Review option - only show if not read-only */}
          {!finalIsReadOnly && (
            <div className="flex gap-3">
              {!showDecisionForm && (
                <button
                  type="button"
                  onClick={handleCheckByAI}
                  disabled={aiLoading}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-indigo-600 to-sky-500 text-white text-sm font-extrabold shadow-lg hover:shadow-xl transition disabled:opacity-60"
                >
                  <SparklesIcon className="h-5 w-5" />
                  {aiLoading ? "Checking..." : "Check by AI"}
                </button>
              )}
              {!showDecisionForm && (
                <button
                  type="button"
                  onClick={() => setShowDecisionForm(true)}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-slate-600 text-white text-sm font-extrabold shadow-lg hover:shadow-xl transition hover:bg-slate-700"
                >
                  <DocumentMagnifyingGlassIcon className="h-5 w-5" />
                  Review Manually
                </button>
              )}
              {showDecisionForm && (
                <button
                  type="button"
                  onClick={handleCheckByAI}
                  disabled={aiLoading}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-indigo-600 to-sky-500 text-white text-sm font-extrabold shadow-lg hover:shadow-xl transition disabled:opacity-60"
                >
                  <SparklesIcon className="h-5 w-5" />
                  {aiLoading ? "Checking..." : "Check by AI"}
                </button>
              )}
            </div>
          )}

          {/* Read-only notice */}
          {finalIsReadOnly && syllabus && (
            <div className="rounded-3xl border border-slate-200 bg-slate-50/80 backdrop-blur p-4 text-center">
              <p className="text-sm font-semibold text-slate-700">
                This syllabus has been {syllabus.status === "APPROVED" ? "approved" : "rejected"}. Read-only view.
              </p>
            </div>
          )}

          {/* AI Results */}
          {aiResults && showDecisionForm && (
            <div className="rounded-3xl border border-indigo-200 bg-indigo-50/80 backdrop-blur p-6 shadow-sm">
              <div className="flex items-center gap-2 font-extrabold text-indigo-900 mb-3">
                <SparklesIcon className="h-5 w-5" />
                AI Review Results
              </div>
              <div className="text-sm text-slate-800 whitespace-pre-wrap bg-white/70 rounded-2xl p-4 border border-indigo-200">
                {aiResults.results || aiResults.findings || aiResults.recommendations || "AI analysis completed."}
              </div>
            </div>
          )}

          {/* Decision Form - only show if not read-only */}
          {showDecisionForm && !finalIsReadOnly && (
            <div className="rounded-3xl border border-slate-200/80 bg-white/70 backdrop-blur shadow-sm p-6 space-y-4">
              <h2 className="text-xl font-extrabold text-slate-900">Make Decision</h2>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setDecision("approve")}
                  className={`flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full text-sm font-extrabold shadow-lg transition ${
                    decision === "approve"
                      ? "bg-emerald-600 text-white"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  }`}
                >
                  <CheckCircleIcon className="h-5 w-5" />
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => setDecision("reject")}
                  className={`flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full text-sm font-extrabold shadow-lg transition ${
                    decision === "reject"
                      ? "bg-rose-600 text-white"
                      : "bg-rose-50 text-rose-700 border border-rose-200"
                  }`}
                >
                  <XCircleIcon className="h-5 w-5" />
                  Reject
                </button>
              </div>
              <div>
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-slate-700">
                    {decision === "reject" ? "Explanation / Notes (Required)" : "Comments (Optional)"}
                  </span>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 outline-none"
                    placeholder={decision === "reject" ? "Please explain why this syllabus is being rejected..." : "Add any comments or notes..."}
                  />
                </label>
              </div>
              <button
                type="button"
                onClick={handleSubmitDecision}
                disabled={submitting || (decision === "reject" && !comment.trim())}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-extrabold shadow-lg disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "Submit Decision"}
              </button>
            </div>
          )}

          {/* Content card - only show if not in decision form or if decision not made */}
          {(!showDecisionForm || !decision) && (
            <div className="rounded-3xl border border-slate-200/80 bg-white/70 backdrop-blur shadow-sm p-6 space-y-8">
              <SectionTitle>Course details</SectionTitle>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Course name" value={courseName} />
                <Field label="Course code" value={courseCode} />
                <Field label="Department" value={departmentLabel} />
                <Field label="Academic year" value={academicYear} />
                <Field label="Study year" value={courseYear} />
                <Field label="Semester" value={courseSemester} />
                <Field label="Course type" value={courseType} />
                <Field label="Teaching mode" value={delivery} />
                <Field label="Instructor email" value={instructorEmail} />
                <Field label="Teaching language" value={language} />
              </div>

              <SectionTitle>Purpose</SectionTitle>
              <Field label="Purpose" value={purpose} multiline />

              <SectionTitle>Learning outcomes</SectionTitle>
              <Field label="Learning outcomes" value={learningOutputs} multiline />

              <SectionTitle>Course content</SectionTitle>
              <Field label="Course description" value={courseDescription} multiline />

              <SectionTitle>Required and recommended literature</SectionTitle>
              <Field label="References / literature" value={literature} multiline />

              <SectionTitle>Planned learning activities and teaching methods</SectionTitle>
              <div className="space-y-3">
                <div className="text-[12px] font-extrabold uppercase tracking-[0.18em] text-slate-700">
                  Weekly plan
                </div>
                {weeksPlan.length === 0 ? (
                  <div className="text-sm text-slate-600">—</div>
                ) : (
                  <div className="space-y-3">
                    {weeksPlan.map((w, i) => (
                      <div
                        key={`${w.week}-${i}`}
                        className="rounded-3xl border border-slate-200 bg-white/60 p-4 shadow-sm"
                      >
                        <div className="grid md:grid-cols-3 gap-3">
                          <Field label="Week" value={w.week} />
                          <Field label="Topic" value={w.topic} />
                          <Field label="Sources" value={w.sources} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Field label="Teaching methods planned" value={teachingMethodsPlanned} multiline />

              <SectionTitle>Guidelines</SectionTitle>
              <Field label="Guidelines" value={guidelines} multiline />

              <SectionTitle>Assessment</SectionTitle>
              {assessments.length === 0 ? (
                <div className="text-sm text-slate-600">—</div>
              ) : (
                <div className="space-y-3">
                  {assessments.map((a, i) => (
                    <div
                      key={`${a.title}-${i}`}
                      className="rounded-3xl border border-slate-200 bg-white/60 p-4 shadow-sm"
                    >
                      <div className="grid md:grid-cols-[1fr,160px] gap-3">
                        <Field label="Item" value={a.title} />
                        <Field label="%" value={a.percent} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {err && (
            <div className="text-sm text-rose-800 bg-rose-50 border border-rose-200 rounded-2xl p-4 shadow-sm">
              {err}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

