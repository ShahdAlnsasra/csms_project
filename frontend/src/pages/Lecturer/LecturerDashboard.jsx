import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ClockIcon,
  BookOpenIcon,
  SparklesIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/solid";

const highlightCards = [
  {
    title: "History",
    description:
      "Review every syllabus version you created, filter by status, year, or course, and keep a clean audit trail.",
    icon: ClockIcon,
    action: "Open history",
    href: "/lecturer/history",
    accent: "from-indigo-500 via-purple-500 to-fuchsia-500",
  },
  {
    title: "Courses",
    description:
      "See your current semester courses with live syllabus status. Jump in to add, edit, or reuse any version.",
    icon: BookOpenIcon,
    action: "View courses",
    href: "/lecturer/courses",
    accent: "from-sky-500 via-cyan-500 to-emerald-500",
  },
];

export default function LecturerDashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-indigo-50 via-white to-sky-50 border border-slate-200 rounded-3xl p-6 md:p-8 shadow-lg shadow-indigo-100/60 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-60 blur-[120px]"
          style={{
            background:
              "radial-gradient(circle at 20% 30%, rgba(79,70,229,0.12), transparent 35%), radial-gradient(circle at 80% 10%, rgba(56,189,248,0.12), transparent 35%), radial-gradient(circle at 60% 80%, rgba(16,185,129,0.12), transparent 40%)",
          }}
        />
        <div className="relative flex flex-col gap-4">
          <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-700 bg-white/70 backdrop-blur px-3 py-1 rounded-full border border-indigo-100 shadow-sm">
            <SparklesIcon className="h-4 w-4" />
            Lecturer dashboard
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight">
            Manage your syllabuses with clarity and creative AI support
          </h1>
          <p className="text-slate-700 max-w-3xl">
            Quick access to your history, active courses, and AI-assisted editing.
            Stay aligned with department expectations while keeping your style.
          </p>
          <div className="flex flex-wrap gap-3 text-sm text-slate-700">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Secure logout & session cleanup
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
              AI prompts for faster updates
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Versioned history with filters
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {highlightCards.map((card) => (
          <button
            key={card.title}
            type="button"
            onClick={() => navigate(card.href)}
            className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-200/70 text-left p-6 transition hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-200"
          >
            <div
              className={`absolute inset-0 opacity-70 blur-2xl bg-gradient-to-br ${card.accent}`}
            />
            <div className="relative flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-11 w-11 rounded-2xl bg-gradient-to-br ${card.accent} flex items-center justify-center text-white shadow-lg shadow-indigo-200`}
                  >
                    <card.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {card.title}
                    </h3>
                    <p className="text-xs uppercase tracking-[0.2em] text-indigo-700">
                      Always available
                    </p>
                  </div>
                </div>
                <ArrowRightIcon className="h-5 w-5 text-slate-500 group-hover:translate-x-1 transition" />
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">
                {card.description}
              </p>
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 group-hover:text-indigo-600">
                {card.action}
                <ArrowRightIcon className="h-4 w-4" />
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

