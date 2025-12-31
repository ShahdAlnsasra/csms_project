import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ClockIcon,
  BookOpenIcon,
  SparklesIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/solid";

export default function LecturerDashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      {/* Intro section – aligned with Department Admin style */}
      <section className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-indigo-500 flex items-center gap-2">
          <SparklesIcon className="h-4 w-4" />
          Lecturer
        </p>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
          Lecturer Dashboard
        </h1>
        <p className="text-sm md:text-base text-slate-600 max-w-3xl">
          Access your syllabus history, current courses, and AI-assisted editing
          tools – all within the same calm, academic workspace as the
          department admin.
        </p>

        <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
          <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 font-medium text-indigo-700 border border-indigo-100">
            <ClockIcon className="mr-1.5 h-3.5 w-3.5" />
            Versioned syllabus history
          </span>
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700 border border-emerald-100">
            <BookOpenIcon className="mr-1.5 h-3.5 w-3.5" />
            Courses per year &amp; semester
          </span>
        </div>
      </section>

      {/* Main cards – visually in harmony with DepartmentAdminDashboard */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* History card */}
        <button
          type="button"
          onClick={() => navigate("/lecturer/history")}
          className="group text-left rounded-3xl bg-white shadow-xl border border-slate-200/80 hover:border-indigo-200 hover:shadow-indigo-100 transition overflow-hidden flex flex-col"
        >
          <div className="px-6 pt-6 pb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-indigo-50 flex items-center justify-center shadow-sm">
                <ClockIcon className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-base md:text-lg font-semibold text-slate-900">
                  Syllabus history
                </h2>
                <p className="mt-1 text-xs text-slate-500 max-w-xs">
                  Review all versions you&apos;ve created, filter by year,
                  course, or status, and keep a clean audit trail.
                </p>
              </div>
            </div>

            <ArrowRightIcon className="h-5 w-5 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition" />
          </div>

          <div className="px-6 pb-5 space-y-3 text-xs">
            <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-1.5">
              <li>Search by course name or syllabus content.</li>
              <li>Use filters to focus on approved, pending, or rejected items.</li>
              <li>Open any version in a safe, read-only view.</li>
            </ul>
          </div>
        </button>

        {/* Courses card */}
        <button
          type="button"
          onClick={() => navigate("/lecturer/courses")}
          className="group text-left rounded-3xl bg-white shadow-xl border border-slate-200/80 hover:border-emerald-200 hover:shadow-emerald-100 transition overflow-hidden flex flex-col"
        >
          <div className="px-6 pt-6 pb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-emerald-50 flex items-center justify-center shadow-sm">
                <BookOpenIcon className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-base md:text-lg font-semibold text-slate-900">
                  Courses &amp; syllabuses
                </h2>
                <p className="mt-1 text-xs text-slate-500 max-w-xs">
                  See your assigned courses, check syllabus status, and jump
                  directly into editing or creating new versions.
                </p>
              </div>
            </div>

            <ArrowRightIcon className="h-5 w-5 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition" />
          </div>

          <div className="px-6 pb-5 space-y-3 text-xs">
            <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-1.5">
              <li>Overview of current and upcoming semester courses.</li>
              <li>See which syllabuses are drafts, submitted, or approved.</li>
              <li>Reuse previous versions as a starting point for updates.</li>
            </ul>
          </div>
        </button>
      </section>
    </div>
  );
}