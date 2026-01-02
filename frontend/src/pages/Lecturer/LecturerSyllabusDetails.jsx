// src/pages/Lecturer/LecturerSyllabusDetails.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeftIcon,
  EyeIcon,
  PencilSquareIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/solid";

import {
  fetchLecturerSyllabusById,
  createLecturerSyllabus,
  fetchLecturerCourseById,
  fetchDepartments,
  cloneLecturerSyllabus,
} from "../../api/api";

// ---------- helpers ----------
const safeJson = (s) => {
  try {
    return typeof s === "string" ? JSON.parse(s) : s;
  } catch {
    return null;
  }
};

const normalizeStatus = (s) => String(s || "").toUpperCase();

const pick = (...vals) => {
  for (const v of vals) {
    if (v !== null && v !== undefined && String(v).trim() !== "") return v;
  }
  return "";
};

function semesterLabel(s) {
  const x = String(s || "").toUpperCase();
  if (x === "A") return "Semester A";
  if (x === "B") return "Semester B";
  if (x === "SUMMER") return "Summer";
  return String(s || "");
}

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

export default function LecturerSyllabusDetails() {
  const { courseId, versionId } = useParams(); // versionId == syllabusId
  const location = useLocation();
  const navigate = useNavigate();

  const passedVersion = location.state?.version;

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("csmsUser") || "null");
    } catch {
      return null;
    }
  }, []);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [syllabus, setSyllabus] = useState(passedVersion || null);

  const [courseMeta, setCourseMeta] = useState(null);
  const [departmentLabel, setDepartmentLabel] = useState("");

  // fetch syllabus fresh
  useEffect(() => {
    if (!user?.id || !versionId) return;

    let cancelled = false;
    setLoading(true);
    setErr("");

    fetchLecturerSyllabusById({ lecturerId: user.id, syllabusId: versionId })
      .then((data) => {
        if (cancelled) return;
        setSyllabus(data || passedVersion || null);
      })
      .catch((e) => {
        if (cancelled) return;
        setErr(
          e?.response?.data?.detail || e?.message || "Failed to load syllabus details"
        );
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id, versionId]); // ✅ בלי passedVersion כדי לא “לרוץ” שוב ושוב

  // fetch course meta + departments (for proper name/department label)
  useEffect(() => {
    if (!user?.id || !courseId) return;

    let cancelled = false;

    (async () => {
      try {
        const [deps, course] = await Promise.all([
          fetchDepartments().catch(() => []),
          fetchLecturerCourseById({ lecturerId: user.id, courseId }).catch(() => null),
        ]);

        if (cancelled) return;

        const depsArr = Array.isArray(deps) ? deps : [];
        setCourseMeta(course);

        const deptId =
          typeof course?.department === "number" || typeof course?.department === "string"
            ? course.department
            : course?.department?.id;

        const deptName =
          (typeof course?.department === "object" && course?.department?.name) ||
          depsArr.find((d) => String(d.id) === String(deptId))?.name ||
          "";

        const deptCode =
          (typeof course?.department === "object" && course?.department?.code) ||
          depsArr.find((d) => String(d.id) === String(deptId))?.code ||
          "";

        const label =
          course?.department_name
            ? `${course.department_name}${course.department_code ? ` (${course.department_code})` : ""}`
            : deptName
            ? `${deptName}${deptCode ? ` (${deptCode})` : ""}`
            : "";

        setDepartmentLabel(label);
      } catch {
        // לא חוסמים דף אם זה נכשל
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, courseId]);

  const status = normalizeStatus(syllabus?.status);

  const isDraft = status === "DRAFT";
  const isPending = status === "PENDING_REVIEW" || status === "PENDING";
  const isApproved = status === "APPROVED";
  const isRejected = status === "REJECTED";

  const content = useMemo(() => safeJson(syllabus?.content) || {}, [syllabus]);

  // --- pull fields robustly from many shapes ---
  const academicYear = pick(
    syllabus?.academic_year,
    syllabus?.academicYear,
    content?.academicYear,
    content?.academicYearComputed
  );

  const courseName = pick(
    syllabus?.course_name,
    syllabus?.course?.name,
    courseMeta?.name,
    content?.courseName
  );

  const courseCode = pick(
    syllabus?.course_code,
    syllabus?.course?.code,
    courseMeta?.code,
    content?.courseCode
  );

  const courseYear = pick(
    syllabus?.course_year,
    syllabus?.course?.year,
    courseMeta?.year,
    content?.studyYear
  );

  const courseSemester = pick(
    syllabus?.course_semester,
    syllabus?.course?.semester,
    courseMeta?.semester,
    content?.semester
  );

  const credits = pick(
    syllabus?.credits,
    syllabus?.credit_points,
    courseMeta?.credits,
    courseMeta?.credit_points,
    content?.credits
  );

  const deptLabel = pick(
    syllabus?.department_name
      ? `${syllabus.department_name}${syllabus.department_code ? ` (${syllabus.department_code})` : ""}`
      : "",
    departmentLabel,
    content?.departmentLabel
  );

  const courseType = pick(syllabus?.course_type, content?.courseType);
  const delivery = pick(syllabus?.delivery, content?.delivery);
  const instructorEmail = pick(syllabus?.instructor_email, content?.instructorEmail);
  const language = pick(syllabus?.language, content?.language, "Hebrew");

  const purpose = pick(syllabus?.purpose, content?.purpose);
  const learningOutputs = pick(syllabus?.learning_outputs, content?.learningOutputs);
  const courseDescription = pick(syllabus?.course_description, content?.courseDescription);
  const literature = pick(syllabus?.literature, content?.literature);
  const teachingMethodsPlanned = pick(
    syllabus?.teaching_methods_planned,
    content?.teachingMethodsPlanned
  );
  const guidelines = pick(syllabus?.guidelines, content?.guidelines);

  const weeksPlan = useMemo(() => {
    const fromSyllabus = Array.isArray(syllabus?.weeks)
      ? syllabus.weeks.map((w) => ({
          week: String(w.week_number ?? w.week ?? ""),
          topic: w.topic || "",
          sources: w.sources || "",
        }))
      : [];

    const fromContentWeeksPlan = Array.isArray(content?.weeksPlan)
      ? content.weeksPlan.map((w) => ({
          week: String(w.week ?? w.week_number ?? ""),
          topic: w.topic || "",
          sources: w.sources || "",
        }))
      : [];

    const fromContentWeeks = Array.isArray(content?.weeks)
      ? content.weeks.map((w) => ({
          week: String(w.week ?? w.week_number ?? ""),
          topic: w.topic || "",
          sources: w.sources || "",
        }))
      : [];

    const merged = (fromSyllabus.length ? fromSyllabus : fromContentWeeksPlan.length ? fromContentWeeksPlan : fromContentWeeks) || [];
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

  const reviewerComment =
    syllabus?.reviewer_comment || syllabus?.rejection_reason || "";
  
  console.log("[LECTURER DETAILS] Reviewer comment:", {
    reviewer_comment: syllabus?.reviewer_comment,
    rejection_reason: syllabus?.rejection_reason,
    finalComment: reviewerComment,
    hasComment: !!reviewerComment && reviewerComment.trim().length > 0,
  });

  const statusBanner = useMemo(() => {
    if (isPending) {
      return {
        title: "Waiting for reviewer decision",
        desc: "This syllabus was submitted for approval and cannot be edited until the reviewer responds.",
      };
    }
    if (isApproved) {
      return {
        title: "Approved syllabus",
        desc: "You can create a new editable draft (clone) and resubmit for approval.",
      };
    }
    if (isRejected) {
      return {
        title: "Rejected — needs fixes",
        desc: "Read the reviewer comments, create a draft copy, fix it, and resubmit.",
      };
    }
    if (isDraft) {
      return {
        title: "Draft syllabus",
        desc: "You can continue editing and submit for approval when ready.",
      };
    }
    return null;
  }, [isPending, isApproved, isRejected, isDraft]);

  const goEditExistingDraft = () => {
    navigate(`/lecturer/courses/${courseId}/new?syllabusId=${syllabus?.id || versionId}`);
  };

const cloneAndEdit = async () => {
  setErr("");
  if (!user?.id) return setErr("User not found. Please login again.");
  if (!courseId) return setErr("Missing courseId in route.");
  if (!syllabus) return setErr("Syllabus not loaded.");

  try {
    setLoading(true);

    // ✅ Clone אמיתי בצד שרת (שומר קשר לגרסה קודמת)
    const cloned = await cloneLecturerSyllabus({ syllabusId: syllabus.id || versionId });
    const newId = cloned?.draft?.id || cloned?.id;

    if (!newId) throw new Error("Clone failed: no draft id returned");

    // ✅ לשמור מאיזה גרסה נוצר הדראפט (לוגיקה עתידית / UI)
    const st = String(syllabus?.status || "").toUpperCase();
    if (st === "APPROVED") {
      localStorage.setItem(`reviseFrom_${newId}`, String(syllabus.id || versionId));
      navigate(`/lecturer/courses/${courseId}/new?syllabusId=${newId}&mode=revise`, { replace: true });
    } else {
      // REJECTED
      localStorage.setItem(`fixFrom_${newId}`, String(syllabus.id || versionId));
      navigate(`/lecturer/courses/${courseId}/new?syllabusId=${newId}&mode=fix`, { replace: true });
    }
  } catch (e) {
    setErr(e?.response?.data?.detail || e?.message || "Failed to create editable copy");
  } finally {
    setLoading(false);
  }
};


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

  // --- header title (NO "Course 1") ---
  const headerTitle = courseName || `Syllabus #${syllabus?.id || versionId}`;
  const headerSubtitle = [
    courseCode ? `(${courseCode})` : "",
    academicYear ? `• ${academicYear}` : "",
  ].filter(Boolean).join(" ");

  return (
    <div className="w-full">
      {/* background */}
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/70 to-sky-50 py-6">
        <div className="mx-auto w-full max-w-6xl px-4 space-y-6">
          {/* top bar */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 bg-white/70 backdrop-blur text-slate-800 text-sm font-semibold hover:bg-white shadow-sm"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back
            </button>

            <div className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.2em] text-indigo-700">
              <EyeIcon className="h-4 w-4" />
              View syllabus
            </div>

            {status && (
              <span
                className={[
                  "ml-auto text-xs font-extrabold rounded-full px-3 py-1",
                  "border bg-white/70 backdrop-blur shadow-sm",
                  isPending
                    ? "border-amber-200 text-amber-800"
                    : isApproved
                    ? "border-emerald-200 text-emerald-800"
                    : isRejected
                    ? "border-rose-200 text-rose-800"
                    : "border-slate-200 text-slate-700",
                ].join(" ")}
              >
                {status}
              </span>
            )}
          </div>

          {/* title card */}
          <div className="rounded-3xl border border-slate-200/80 bg-white/70 backdrop-blur shadow-sm p-6">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                {headerTitle}
              </h1>

              <div className="flex flex-wrap items-center gap-2">
                {headerSubtitle && (
                  <span className="text-sm font-semibold text-slate-600">
                    {headerSubtitle}
                  </span>
                )}

                {deptLabel && (
                  <span className="text-xs font-bold rounded-full px-3 py-1 bg-indigo-50 text-indigo-800 border border-indigo-200">
                    {deptLabel}
                  </span>
                )}

                {courseYear && (
                  <span className="text-xs font-bold rounded-full px-3 py-1 bg-sky-50 text-sky-800 border border-sky-200">
                    Year {courseYear}
                  </span>
                )}

                {courseSemester && (
                  <span className="text-xs font-bold rounded-full px-3 py-1 bg-violet-50 text-violet-800 border border-violet-200">
                    {semesterLabel(courseSemester)}
                  </span>
                )}

                {credits && (
                  <span className="text-xs font-bold rounded-full px-3 py-1 bg-slate-50 text-slate-700 border border-slate-200">
                    Credits: {credits}
                  </span>
                )}
              </div>

              <p className="text-sm text-slate-600 mt-1">
                Read-only view. Editing is available only via{" "}
                <span className="font-semibold text-slate-800">Continue editing</span> (Draft) or{" "}
                <span className="font-semibold text-slate-800">Edit/Fix & resubmit</span> (clone).
              </p>
            </div>
          </div>

          {/* banner */}
          {statusBanner && (
            <div className="rounded-3xl border border-amber-200 bg-amber-50/80 backdrop-blur p-5 text-amber-900 shadow-sm">
              <div className="flex items-center gap-2 font-extrabold">
                <ExclamationTriangleIcon className="h-5 w-5" />
                {statusBanner.title}
              </div>
              <div className="text-sm mt-1">{statusBanner.desc}</div>

              {(isRejected || isApproved) && reviewerComment && (
                <div className={`mt-3 rounded-2xl border bg-white/70 p-4 ${
                  isRejected ? "border-amber-200" : "border-emerald-200"
                }`}>
                  <div className={`text-xs font-extrabold uppercase tracking-[0.14em] ${
                    isRejected ? "text-amber-700" : "text-emerald-700"
                  }`}>
                    Reviewer comment
                  </div>
                  <div className="mt-2 text-sm text-slate-800 whitespace-pre-wrap">
                    {reviewerComment}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* content card */}
          <div className="rounded-3xl border border-slate-200/80 bg-white/70 backdrop-blur shadow-sm p-6 space-y-8">
            <SectionTitle>Course details</SectionTitle>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Course name" value={courseName} />
              <Field label="Course code" value={courseCode} />
              <Field label="Department" value={deptLabel} />
              <Field label="Academic year" value={academicYear} />
              <Field label="Study year" value={courseYear} />
              <Field label="Semester" value={semesterLabel(courseSemester)} />
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

            <Field
              label="Teaching methods planned"
              value={teachingMethodsPlanned}
              multiline
            />

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

          {/* actions */}
          <div className="flex flex-wrap gap-3">
            {isDraft && (
              <button
                type="button"
                onClick={goEditExistingDraft}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-extrabold shadow-lg"
              >
                <PencilSquareIcon className="h-5 w-5" />
                Continue editing (Draft)
              </button>
            )}

            {(isApproved || isRejected) && (
              <button
                type="button"
                onClick={cloneAndEdit}
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-extrabold shadow-lg disabled:opacity-60"
              >
                <PencilSquareIcon className="h-5 w-5" />
                {isApproved
                  ? "Edit & resubmit (creates new draft)"
                  : "Fix & resubmit (creates new draft)"}
              </button>
            )}

            {isPending && (
              <div className="text-sm font-semibold text-slate-700 rounded-2xl border border-slate-200 bg-white/70 backdrop-blur px-4 py-3">
                Editing is disabled while the syllabus is under review.
              </div>
            )}
          </div>

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





