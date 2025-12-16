import React from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeftIcon,
  EyeIcon,
  BookmarkIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/solid";

export default function LecturerSyllabusDetails() {
  const { courseId, versionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const version =
    location.state?.version || {
      id: versionId,
      title: "Syllabus version",
      summary: "Preview of the syllabus details.",
      sections: [
        { title: "Course Description", content: "High-level overview of the course." },
        { title: "Learning Outcomes", content: "Students will be able to..." },
        { title: "Assessments", content: "Assignments, project, and exam weighting." },
      ],
    };

  const handleSave = () => {
    alert("Saved without changes (draft).");
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
          <EyeIcon className="h-4 w-4" />
          View syllabus
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
          {courseId} • {version.title}
        </h1>
        <p className="text-sm text-slate-600 max-w-3xl">
          Read-only view of the syllabus. You can save as-is or start an AI-assisted edit.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 space-y-4">
        <div className="text-sm text-slate-700">{version.summary}</div>
        <div className="grid gap-3">
          {version.sections?.map((section) => (
            <div
              key={section.title}
              className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-1"
            >
              <div className="text-sm font-semibold text-slate-900">{section.title}</div>
              <div className="text-sm text-slate-700 leading-relaxed">
                {section.content}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-800 hover:bg-slate-50 shadow-sm"
        >
          <BookmarkIcon className="h-5 w-5 text-indigo-500" />
          Save (no changes)
        </button>
        <button
          type="button"
          onClick={() =>
            navigate(`/lecturer/courses/${courseId}/versions/${version.id}/edit`, {
              state: { version },
            })
          }
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg"
        >
          <PencilSquareIcon className="h-5 w-5" />
          Edit with AI
        </button>
      </div>
    </div>
  );
}

