import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Network, ArrowRight, Sparkles } from "lucide-react";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [name, setName] = useState("");

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("csmsUser") || "null");
      if (u) {
        const n = [u.first_name, u.last_name].filter(Boolean).join(" ");
        setName(n || u.email || "");
      }
    } catch {
      setName("");
    }
  }, []);

  return (
    <div className="w-full">
      <section className="space-y-2 mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-indigo-500">
          Student
        </p>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
          Student dashboard
        </h1>
        <p className="text-sm md:text-base text-slate-600 max-w-2xl">
          {name ? `Welcome, ${name}. ` : "Welcome. "}
          Access your current courses, follow syllabus updates, and explore the
          full department curriculum.
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
          <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 font-medium text-indigo-700 border border-indigo-100">
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            Syllabus &amp; AI insights
          </span>
          <span className="inline-flex items-center rounded-full bg-sky-50 px-3 py-1 font-medium text-sky-800 border border-sky-100">
            <Network className="mr-1.5 h-3.5 w-3.5" />
            Interactive curriculum map
          </span>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          type="button"
          onClick={() => navigate("/student/courses")}
          className="group text-left rounded-3xl bg-white shadow-xl border border-slate-200/80 hover:border-indigo-200 hover:shadow-indigo-100 transition overflow-hidden flex flex-col"
        >
          <div className="px-6 pt-6 pb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-indigo-50 flex items-center justify-center shadow-sm">
                <BookOpen className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-base md:text-lg font-semibold text-slate-900">
                  My Courses
                </h2>
                <p className="mt-1 text-xs text-slate-500 max-w-xs">
                  Courses for your current academic year &amp; semester — search,
                  open details, and download syllabi.
                </p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition shrink-0" />
          </div>
          <div className="px-6 pb-6 text-[11px] text-slate-500">
            Includes lecturer contacts and the latest approved syllabus per course.
          </div>
        </button>

        <button
          type="button"
          onClick={() => navigate("/student/course-diagram")}
          className="group text-left rounded-3xl bg-white shadow-xl border border-slate-200/80 hover:border-emerald-200 hover:shadow-emerald-100 transition overflow-hidden flex flex-col"
        >
          <div className="px-6 pt-6 pb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-emerald-50 flex items-center justify-center shadow-sm">
                <Network className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-base md:text-lg font-semibold text-slate-900">
                  Curriculum Diagram
                </h2>
                <p className="mt-1 text-xs text-slate-500 max-w-xs">
                  Visual map of Years 1–4 with prerequisites. Hover for details —
                  export the diagram as an image.
                </p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition shrink-0" />
          </div>
          <div className="px-6 pb-6 text-[11px] text-slate-500">
            Click any course to open the same rich course page used across CSMS.
          </div>
        </button>
      </section>
    </div>
  );
}
