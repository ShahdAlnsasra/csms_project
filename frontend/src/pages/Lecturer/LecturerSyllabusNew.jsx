import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeftIcon,
  PlusCircleIcon,
  SparklesIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/solid";
import {
  fetchLecturerCourseById,
  createLecturerSyllabus,
} from "../../api/api";

const emptyAssessment = { title: "", percent: "" };
const emptyWeek = { week: "", topic: "", sources: "" };

const initialForm = {
  courseName: "",
  campus: "",
  department: "",
  field: "",
  studyYear: "",
  semester: "",
  credits: "",
  ects: "",
  level: "",
  courseType: "",
  delivery: "",
  prerequisites: "",
  corequisites: "",
  language: "",
  academicYear: "",
  instructor: "",
  description: "",
  outcomes: "",
  assignments: "",
  weeks: "14",
  teachingMethods: "",
};

export default function LecturerSyllabusNew() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [assessments, setAssessments] = useState([emptyAssessment]);
  const [weeksPlan, setWeeksPlan] = useState([emptyWeek]);
  const [draft, setDraft] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("csmsUser") || "null");
    if (!user) return;
    fetchLecturerCourseById({ lecturerId: user.id, courseId }).then((course) => {
      if (!course) return;
      setForm((prev) => ({
        ...prev,
        courseName: course.name,
        department: course.department,
        credits: course.credits || prev.credits,
        studyYear: course.year || prev.studyYear,
        semester: course.semester || prev.semester,
      }));
    });
  }, [courseId]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAssessmentChange = (idx, field, value) => {
    setAssessments((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const handleWeekChange = (idx, field, value) => {
    setWeeksPlan((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const addAssessment = () => setAssessments((p) => [...p, emptyAssessment]);
  const addWeek = () => setWeeksPlan((p) => [...p, emptyWeek]);

  const validateAssessments = () => {
    const errs = [];
    let total = 0;
    assessments.forEach((a, i) => {
      const pct = Number(a.percent);
      if (Number.isNaN(pct) || pct < 0 || pct > 100) {
        errs.push(`אחוז בשורה ${i + 1} חייב להיות בין 0-100`);
      }
      total += pct || 0;
    });
    if (total !== 100) errs.push("סכום האחוזים חייב להיות בדיוק 100%");
    setErrors(errs);
    return errs.length === 0;
  };

  const handleGenerate = async () => {
    setErrors([]);
    const prompt = `
Course: ${form.courseName}
Credits: ${form.credits}, ECTS: ${form.ects}
Year: ${form.studyYear}, Semester: ${form.semester}
Type: ${form.courseType}, Level: ${form.level}, Delivery: ${form.delivery}
Prerequisites: ${form.prerequisites}
Learning outcomes: ${form.outcomes}
Assignments spec: ${form.assignments}
Weekly plan rows: ${weeksPlan.length}
Assessment items: ${assessments
      .map((a) => `${a.title || "Item"} (${a.percent || "?"}%)`)
      .join(", ")}
Reviewer check: clarity, outcomes alignment, assessment totals 100%.
Generate a structured syllabus draft in JSON-like fields to map to the UI sections.`;

    try {
      setAiLoading(true);
      const key = process.env.REACT_APP_OPENAI_API_KEY;
      if (!key) {
        setErrors(["Missing OpenAI API key (REACT_APP_OPENAI_API_KEY)."]);
        setAiLoading(false);
        return;
      }
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.4,
        }),
      });
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content || "";
      setDraft({ ...form, aiDraft: text, assessments, weeksPlan });
    } catch (e) {
      setErrors([`AI generation failed: ${e.message}`]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (saveAs) => {
    if (!validateAssessments()) return;
    const user = JSON.parse(localStorage.getItem("csmsUser") || "null");
    if (!user) {
      setErrors(["User not found. Please login again."]);
      return;
    }
    try {
      await createLecturerSyllabus({
        lecturerId: user.id,
        courseId,
        payload: { form, assessments, weeksPlan },
        saveAs,
      });
      alert(saveAs === "DRAFT" ? "Draft saved to database." : "Submitted for reviewers.");
      navigate(`/lecturer/courses/${courseId}`);
    } catch (e) {
      setErrors([e?.response?.data?.detail || e.message || "Failed to save syllabus"]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 text-slate-700 text-sm hover:bg-slate-50"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back
        </button>
        <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-700">
          <PlusCircleIcon className="h-4 w-4" />
          New syllabus
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
          {form.courseName || courseId} • Create a new syllabus with AI
        </h1>
        <p className="text-sm text-slate-600 max-w-3xl">
          Fill the key course details, generate a draft with AI, edit each field, and
          submit when ready.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Course name"
            value={form.courseName}
            onChange={(v) => handleChange("courseName", v)}
            placeholder="e.g. Introduction to CS"
          />
          <Field
            label="Campus"
            value={form.campus}
            onChange={(v) => handleChange("campus", v)}
            placeholder="e.g. Beer Sheva"
          />
          <Field
            label="Department"
            value={form.department}
            onChange={(v) => handleChange("department", v)}
            placeholder="e.g. Software Engineering"
          />
          <Field
            label="Field / Domain"
            value={form.field}
            onChange={(v) => handleChange("field", v)}
            placeholder="e.g. CS / Algorithms"
          />
          <Field
            label="Academic year"
            value={form.academicYear}
            onChange={(v) => handleChange("academicYear", v)}
            placeholder="e.g. 2025/26"
          />
          <Field
            label="Credit points"
            value={form.credits}
            onChange={(v) => handleChange("credits", v)}
            placeholder="e.g. 3"
          />
          <Field
            label="ECTS"
            value={form.ects}
            onChange={(v) => handleChange("ects", v)}
            placeholder="e.g. 5.25"
          />
          <Field
            label="Number of weeks"
            value={form.weeks}
            onChange={(v) => handleChange("weeks", v)}
            placeholder="e.g. 14"
          />
          <Field
            label="Course level"
            value={form.level}
            onChange={(v) => handleChange("level", v)}
            placeholder="e.g. Undergraduate / Graduate"
          />
          <Field
            label="Course type"
            value={form.courseType}
            onChange={(v) => handleChange("courseType", v)}
            placeholder="e.g. Mandatory / Elective"
          />
          <Field
            label="Delivery mode"
            value={form.delivery}
            onChange={(v) => handleChange("delivery", v)}
            placeholder="e.g. In-person / Hybrid"
          />
          <Field
            label="Study year"
            value={form.studyYear}
            onChange={(v) => handleChange("studyYear", v)}
            placeholder="e.g. 3"
          />
          <Field
            label="Semester"
            value={form.semester}
            onChange={(v) => handleChange("semester", v)}
            placeholder="e.g. A / B"
          />
          <Field
            label="Instructor"
            value={form.instructor}
            onChange={(v) => handleChange("instructor", v)}
            placeholder="e.g. Dr. Name, email"
          />
          <Field
            label="Teaching language"
            value={form.language}
            onChange={(v) => handleChange("language", v)}
            placeholder="e.g. Hebrew / English"
          />
          <Field
            label="Prerequisites"
            value={form.prerequisites}
            onChange={(v) => handleChange("prerequisites", v)}
            placeholder="List prerequisite courses"
          />
          <Field
            label="Co-requisites"
            value={form.corequisites}
            onChange={(v) => handleChange("corequisites", v)}
            placeholder="If any"
          />
        </div>
        <Field
          label="Course description"
          value={form.description}
          onChange={(v) => handleChange("description", v)}
          placeholder="High-level overview"
          multiline
        />
        <Field
          label="Learning outcomes"
          value={form.outcomes}
          onChange={(v) => handleChange("outcomes", v)}
          placeholder="Bullet outcomes..."
          multiline
        />
        <Field
          label="Assignments & assessments"
          value={form.assignments}
          onChange={(v) => handleChange("assignments", v)}
          placeholder="Projects, quizzes, final exam..."
          multiline
        />

        <div className="space-y-2">
          <div className="text-sm font-semibold text-slate-800">Weekly plan</div>
          <div className="space-y-3">
            {weeksPlan.map((w, i) => (
              <div
                key={i}
                className="grid md:grid-cols-3 gap-2 rounded-xl border border-slate-200 p-3 bg-slate-50/50"
              >
                <Field
                  label="Week"
                  value={w.week}
                  onChange={(v) => handleWeekChange(i, "week", v)}
                  placeholder={`${i + 1}`}
                />
                <Field
                  label="Topic"
                  value={w.topic}
                  onChange={(v) => handleWeekChange(i, "topic", v)}
                  placeholder="Topic"
                />
                <Field
                  label="Sources"
                  value={w.sources}
                  onChange={(v) => handleWeekChange(i, "sources", v)}
                  placeholder="Chapters / papers"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={addWeek}
              className="text-sm font-semibold text-indigo-700"
            >
              + Add week
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-semibold text-slate-800">
            Assessment & evaluation (must total 100%)
          </div>
          <div className="space-y-3">
            {assessments.map((a, i) => (
              <div
                key={i}
                className="grid md:grid-cols-[1fr,120px] gap-2 rounded-xl border border-slate-200 p-3 bg-slate-50/50"
              >
                <Field
                  label="Item"
                  value={a.title}
                  onChange={(v) => handleAssessmentChange(i, "title", v)}
                  placeholder="e.g. Final exam"
                />
                <Field
                  label="%"
                  value={a.percent}
                  onChange={(v) => handleAssessmentChange(i, "percent", v)}
                  placeholder="e.g. 80"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={addAssessment}
              className="text-sm font-semibold text-indigo-700"
            >
              + Add assessment item
            </button>
          </div>
        </div>

        <Field
          label="Teaching methods"
          value={form.teachingMethods}
          onChange={(v) => handleChange("teachingMethods", v)}
          placeholder="Lectures, labs, tutorials..."
          multiline
        />

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleGenerate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-600 to-sky-500 text-white text-sm font-semibold shadow-lg hover:shadow-xl transition"
            disabled={aiLoading}
          >
            <SparklesIcon className="h-5 w-5" />
            {aiLoading ? "Generating..." : "Generate by AI"}
          </button>
          <div className="text-xs text-slate-500">
            AI will auto-fill missing fields; you can edit and save each one.
          </div>
        </div>
      </div>

      {draft && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-indigo-700">
            <SparklesIcon className="h-4 w-4" />
            AI-generated draft
          </div>
          <div className="grid gap-3">
            <GeneratedField title="Course name" value={draft.courseName} />
            <GeneratedField title="Credit points" value={draft.credits} />
            <GeneratedField title="ECTS" value={draft.ects} />
            <GeneratedField title="Number of weeks" value={draft.weeks} />
            <GeneratedField title="Course level" value={draft.level} />
            <GeneratedField title="Course type" value={draft.courseType} />
            <GeneratedField title="Delivery" value={draft.delivery} />
            <GeneratedField title="Learning outcomes" value={draft.outcomes} />
            <GeneratedField title="Assignments & assessments" value={draft.assignments} />
            <GeneratedField title="AI notes" value={draft.aiDraft} />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => handleSubmit("DRAFT")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-800 hover:bg-slate-50 shadow-sm"
            >
              Save draft
            </button>
            <button
              type="button"
              onClick={() => handleSubmit("SUBMIT")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-lg"
            >
              <CheckCircleIcon className="h-5 w-5" />
              Submit for approval
            </button>
          </div>
        </div>
      )}
      {errors.length > 0 && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3 space-y-1">
          {errors.map((e, idx) => (
            <div key={idx}>{e}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, multiline = false }) {
  const Component = multiline ? "textarea" : "input";
  return (
    <label className="flex flex-col gap-1.5 text-sm font-semibold text-slate-800">
      {label}
      <Component
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={multiline ? 3 : undefined}
        className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 outline-none"
      />
    </label>
  );
}

function GeneratedField({ title, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="text-xs uppercase tracking-[0.15em] text-slate-500 font-semibold">
        {title}
      </div>
      <div className="mt-1 text-sm text-slate-900">{value || "Not provided yet"}</div>
    </div>
  );
}

