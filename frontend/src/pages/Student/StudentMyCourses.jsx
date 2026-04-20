import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ArrowRight } from "lucide-react";
import { fetchStudentMyCourses } from "../../api/api";

export default function StudentMyCourses() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");
        const data = await fetchStudentMyCourses();
        setCourses(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        setError("Could not load your courses.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!q.trim()) return courses;
    const s = q.trim().toLowerCase();
    return courses.filter(
      (c) =>
        (c.name && String(c.name).toLowerCase().includes(s)) ||
        (c.code && String(c.code).toLowerCase().includes(s))
    );
  }, [courses, q]);

  const inputStyle =
    "w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition";

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-indigo-500">
          Courses
        </p>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
          My Courses
        </h1>
        <p className="mt-2 text-sm text-slate-600 max-w-2xl">
          Courses aligned with your study year and semester in this department.
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by course name or code..."
          className={`${inputStyle} pl-10`}
        />
      </div>

      {loading ? (
        <div className="text-sm text-slate-500">Loading courses…</div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white/70 px-6 py-12 text-center text-sm text-slate-600">
          No courses matched your filters. If this is unexpected, verify your study
          year and semester with your department admin.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => navigate(`/student/courses/${c.id}`)}
              className="group rounded-3xl bg-white border border-slate-200 shadow-lg shadow-slate-200/60 hover:border-indigo-200 hover:shadow-indigo-100 transition text-left px-5 py-4 flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wide">
                    {c.code}
                  </p>
                  <h3 className="text-base font-bold text-slate-900 mt-1">
                    {c.name}
                  </h3>
                </div>
                <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-indigo-500 shrink-0 mt-1" />
              </div>
              <div className="flex flex-wrap gap-2 text-[11px] text-slate-600">
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-medium">
                  Year {c.year}
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-medium">
                  Sem {c.semester}
                </span>
                <span className="rounded-full bg-emerald-50 text-emerald-800 px-2.5 py-0.5 font-medium border border-emerald-100">
                  {c.credits} credits
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
