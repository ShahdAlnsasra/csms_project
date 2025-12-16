import React, { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeftIcon,
  SparklesIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/solid";

const defaultSections = [
  { key: "description", title: "Course Description", content: "High-level overview." },
  { key: "outcomes", title: "Learning Outcomes", content: "Students will be able to..." },
  { key: "assessments", title: "Assessments", content: "Assignments, project, exam." },
  { key: "schedule", title: "Weekly Schedule", content: "Topics per week." },
];
const emptyAssessment = { title: "", percent: "" };

export default function LecturerSyllabusEdit() {
  const { courseId, versionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const baseVersion = location.state?.version || {
    id: versionId,
    title: "Syllabus version",
    sections: defaultSections,
  };

  const [instructions, setInstructions] = useState("");
  const [sections, setSections] = useState(baseVersion.sections || defaultSections);
  const [aiNotes, setAiNotes] = useState("");
  const [assessments, setAssessments] = useState(baseVersion.assessments || [emptyAssessment]);
  const [errors, setErrors] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);

  const handleGenerate = () => {
    setErrors([]);
    if (!instructions.trim()) {
      alert("Write an instruction for the AI first.");
      return;
    }
    const key = process.env.REACT_APP_OPENAI_API_KEY;
    if (!key) {
      setErrors(["Missing OpenAI API key (REACT_APP_OPENAI_API_KEY)."]);
      return;
    }
    setAiLoading(true);
    fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: instructions }],
        temperature: 0.4,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        const note = data?.choices?.[0]?.message?.content || "";
        setAiNotes(note || "AI suggestions generated.");
      })
      .catch((e) => setErrors([`AI generation failed: ${e.message}`]))
      .finally(() => setAiLoading(false));
  };

  const handleSectionChange = (key, value) => {
    setSections((prev) =>
      prev.map((s) => (s.key === key ? { ...s, content: value } : s))
    );
  };

  const handleAssessmentChange = (idx, field, value) => {
    setAssessments((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const addAssessment = () => setAssessments((p) => [...p, emptyAssessment]);

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

  const handleSubmit = () => {
    if (!validateAssessments()) return;
    alert("Submitted for approval. Reviewers will approve after checks.");
    navigate(`/lecturer/courses/${courseId}`);
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
          <SparklesIcon className="h-4 w-4" />
          Edit with AI
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
          {courseId} • Editing {baseVersion.title}
        </h1>
        <p className="text-sm text-slate-600 max-w-3xl">
          Add instructions for the AI, review the generated updates, edit sections, save
          drafts, or submit the new version.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 space-y-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-800">
            AI instruction bar
          </label>
          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder='Write what to change (e.g. "update learning outcomes")'
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 outline-none"
            />
            <button
              type="button"
              onClick={handleGenerate}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 text-white text-sm font-semibold shadow-lg hover:shadow-xl transition disabled:opacity-60"
              disabled={aiLoading}
            >
              <PaperAirplaneIcon className="h-5 w-5 rotate-6" />
              {aiLoading ? "Generating..." : "Send to AI / Generate"}
            </button>
          </div>
          {aiNotes && (
            <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
              {aiNotes}
            </div>
          )}
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
                <div className="text-xs font-semibold text-slate-700">Item</div>
                <div className="text-xs font-semibold text-slate-700">%</div>
                <input
                  value={a.title}
                  onChange={(e) => handleAssessmentChange(i, "title", e.target.value)}
                  className="md:col-start-1 md:col-span-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="e.g. Final exam"
                />
                <input
                  value={a.percent}
                  onChange={(e) => handleAssessmentChange(i, "percent", e.target.value)}
                  className="md:col-start-2 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="80"
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

        <div className="grid gap-4">
          {sections.map((section) => (
            <div
              key={section.key}
              className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-900">{section.title}</div>
                <button
                  type="button"
                  className="text-xs font-semibold text-indigo-700"
                  onClick={() => alert(`${section.title} saved.`)}
                >
                  Save
                </button>
              </div>
              <textarea
                value={section.content}
                onChange={(e) => handleSectionChange(section.key, e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 outline-none"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => alert("Draft saved locally.")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-800 hover:bg-slate-50 shadow-sm"
        >
          Save draft
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-lg"
        >
          <CheckCircleIcon className="h-5 w-5" />
          Submit for approval
        </button>
      </div>
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

