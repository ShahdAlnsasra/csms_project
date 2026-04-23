import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  GraduationCap,
  Link2,
  Network,
  ArrowRightLeft,
  Sparkles,
  Download,
} from "lucide-react";
import {
  downloadStudentSyllabusPdf,
  fetchStudentCourseAIInsights,
  fetchStudentCourseDetail,
  fetchStudentDepartmentCourses,
} from "../../api/api";

export default function StudentCourseDetail() {
  const { courseId } = useParams();
  const [searchParams] = useSearchParams();
  const from = searchParams.get("from") || "courses";
  const navigate = useNavigate();

  const [detail, setDetail] = useState(null);
  const [allCourses, setAllCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiData, setAiData] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");
        const [d, list] = await Promise.all([
          fetchStudentCourseDetail(courseId),
          fetchStudentDepartmentCourses(),
        ]);
        setDetail(d);
        setAllCourses(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error(e);
        setError("Could not load this course.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [courseId]);

  const course = detail?.course;

  const courseById = useMemo(() => {
    const map = new Map();
    allCourses.forEach((c) => {
      if (c && c.id != null) map.set(c.id, c);
    });
    return map;
  }, [allCourses]);

  const prerequisites = useMemo(() => {
    if (!course) return [];
    if (
      Array.isArray(course.prerequisites_display) &&
      course.prerequisites_display.length > 0
    ) {
      return course.prerequisites_display;
    }
    const ids = Array.isArray(course.prerequisite_ids) ? course.prerequisite_ids : [];
    return ids.map((id) => courseById.get(id)).filter(Boolean);
  }, [course, courseById]);

  const dependents = useMemo(() => {
    if (!course) return [];
    const currentId = course.id;
    const results = [];
    allCourses.forEach((c) => {
      if (!c || !c.id || c.id === currentId) return;
      let ids = [];
      if (
        Array.isArray(c.prerequisites_display) &&
        c.prerequisites_display.length > 0
      ) {
        ids = c.prerequisites_display.map((p) => p.id);
      } else if (Array.isArray(c.prerequisite_ids)) {
        ids = c.prerequisite_ids;
      }
      if (ids.includes(currentId)) results.push(c);
    });
    return results;
  }, [course, allCourses]);

  const handleBack = () => {
    if (from === "diagram") navigate("/student/course-diagram");
    else navigate("/student/courses");
  };

  const handleAi = async () => {
    if (!course) return;
    try {
      setAiLoading(true);
      setAiError("");
      const data = await fetchStudentCourseAIInsights(course.id);
      setAiData(data);
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        "Could not load curriculum insights.";
      setAiError(typeof msg === "string" ? msg : "Request failed.");
    } finally {
      setAiLoading(false);
    }
  };

  const handlePdf = async () => {
    try {
      setPdfLoading(true);
      await downloadStudentSyllabusPdf(courseId, course?.name);
    } catch (e) {
      const msg =
        e?.response?.data?.detail ||
        "Could not download PDF (is an approved syllabus available?).";
      alert(typeof msg === "string" ? msg : "Download failed.");
    } finally {
      setPdfLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-sm text-slate-500 py-12 text-center">
        Loading course…
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error || "Course not found."}
      </div>
    );
  }

  const syllabus = detail?.latest_syllabus;
  const lecturerContacts =
    (Array.isArray(detail?.lecturer_contacts) && detail.lecturer_contacts.length > 0
      ? detail.lecturer_contacts
      : Array.isArray(course.lecturers_display)
      ? course.lecturers_display
      : []) || [];

  const prereqSummary =
    prerequisites.length > 0
      ? prerequisites
          .map((p) => `${p.code || ""} ${p.name || ""}`.trim())
          .join(", ")
      : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white w-9 h-9 shadow-sm hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4 text-slate-500" />
          </button>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">
              Course overview
            </h1>
            <p className="mt-1 text-sm text-slate-600 max-w-xl">
              Syllabus, lecturer contacts, and curriculum intelligence for this
              course.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handlePdf}
            disabled={pdfLoading || !syllabus}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 shadow-lg shadow-indigo-200"
          >
            <Download className="h-4 w-4" />
            {pdfLoading ? "Preparing…" : "Download syllabus (PDF)"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr,1.6fr] gap-6">
        <div className="rounded-3xl bg-gradient-to-br from-white to-indigo-50/40 border border-slate-200 shadow-lg px-6 py-6 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-indigo-600">{course.code}</p>
              <h2 className="text-2xl font-extrabold text-slate-900 mt-1">
                {course.name}
              </h2>
              <p className="mt-3 text-sm text-slate-700 leading-relaxed">
                {course.description ||
                  "No description has been added for this course yet."}
              </p>
            </div>
            <div className="inline-flex flex-col items-end gap-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-medium text-slate-700 shadow-sm">
                Year {course.year} · Sem {course.semester}
              </span>
              <span className="text-xs text-slate-500">
                Credits:{" "}
                <span className="font-semibold text-slate-800">{course.credits}</span>
              </span>
            </div>
          </div>

          <div className="border-t border-indigo-100 pt-4 space-y-3 text-sm">
            <div className="flex items-start gap-2 text-slate-800">
              <GraduationCap className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
              <div className="w-full">
                <span className="font-semibold">Lecturers:</span>
                {lecturerContacts.length === 0 ? (
                  <span className="ml-1">—</span>
                ) : (
                  <div className="mt-1 space-y-1">
                    {lecturerContacts.map((lec, idx) => (
                      <div key={`${lec.id || lec.email || idx}`} className="text-sm text-slate-800">
                        <span className="font-medium">{lec.full_name || "—"}</span>
                        {lec.email ? (
                          <>
                            {" · "}
                            <a
                              href={`mailto:${lec.email}`}
                              className="text-indigo-600 hover:underline break-all"
                            >
                              {lec.email}
                            </a>
                          </>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {syllabus && (
              <div className="rounded-2xl bg-white/80 border border-indigo-100 px-4 py-3 text-xs text-slate-700">
                <p className="font-semibold text-indigo-900">Latest syllabus</p>
                <p className="mt-1">
                  Version {syllabus.version}
                  {syllabus.academic_year
                    ? ` · Academic year ${syllabus.academic_year}`
                    : ""}
                </p>
              </div>
            )}
            {!syllabus && (
              <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                No approved syllabus has been published for this course yet.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl bg-white border border-slate-200 shadow-lg px-6 py-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-5 w-5 text-violet-600" />
              <h3 className="text-sm font-semibold text-slate-900">
                Intelligent curriculum insight
              </h3>
            </div>
            <p className="text-xs text-slate-600 mb-3">
              Rule-based analysis of how this course sits in your department graph
              (prerequisites and follow-on courses).
            </p>
            <button
              type="button"
              onClick={handleAi}
              disabled={aiLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2"
            >
              <Sparkles className="h-4 w-4" />
              {aiLoading ? "Generating…" : "Generate insight"}
            </button>
            {aiError && (
              <p className="mt-2 text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {aiError}
              </p>
            )}
            {aiData && (
              <div className="mt-4 space-y-3 text-sm text-slate-700">
                <p>{aiData.summary}</p>
                <p className="text-xs text-slate-600">{aiData.prerequisites_summary}</p>
                <p className="text-xs text-slate-600">{aiData.dependents_summary}</p>
                {Array.isArray(aiData.risk_notes) && aiData.risk_notes.length > 0 && (
                  <ul className="list-disc list-inside text-xs text-amber-900 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                    {aiData.risk_notes.map((x, i) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                )}
                {Array.isArray(aiData.recommendations) &&
                  aiData.recommendations.length > 0 && (
                    <ul className="list-disc list-inside text-xs text-indigo-900 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2">
                      {aiData.recommendations.map((x, i) => (
                        <li key={i}>{x}</li>
                      ))}
                    </ul>
                  )}
              </div>
            )}
          </div>

          <div className="rounded-3xl bg-white border border-slate-200 shadow-lg px-6 py-5">
            <div className="flex items-center gap-2 mb-2">
              <Network className="h-4 w-4 text-emerald-600" />
              <h3 className="text-sm font-semibold text-slate-900">
                Prerequisites
              </h3>
            </div>
            {prerequisites.length === 0 ? (
              <p className="text-sm text-slate-600">No prerequisites listed.</p>
            ) : (
              <ul className="space-y-1 text-sm text-slate-700">
                {prerequisites.map((p) => (
                  <li key={p.id}>
                    <span className="font-semibold">{p.code}</span> {p.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-3xl bg-white border border-slate-200 shadow-lg px-6 py-5">
            <div className="flex items-center gap-2 mb-2">
              <ArrowRightLeft className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-semibold text-slate-900">
                Unlocks / dependent courses
              </h3>
            </div>
            {dependents.length === 0 ? (
              <p className="text-sm text-slate-600">
                No dependent courses reference this one as a prerequisite.
              </p>
            ) : (
              <ul className="space-y-1 text-sm text-slate-700">
                {dependents.map((d) => (
                  <li key={d.id}>
                    <span className="font-semibold">{d.code}</span> {d.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {prereqSummary && (
            <div className="flex items-start gap-2 text-xs text-slate-500 px-1">
              <Link2 className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                <span className="font-semibold text-slate-600">Summary: </span>
                {prereqSummary}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
