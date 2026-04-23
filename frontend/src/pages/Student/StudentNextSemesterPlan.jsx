import React, { useEffect, useMemo, useState } from "react";
import {
  fetchStudentNextSemesterPlan,
  saveStudentNextSemesterPlan,
  submitStudentNextSemesterPlan,
} from "../../api/api";

export default function StudentNextSemesterPlan() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [selectedElectives, setSelectedElectives] = useState([]);

  async function load() {
    try {
      setLoading(true);
      setError("");
      const res = await fetchStudentNextSemesterPlan();
      setData(res);
      const electiveRows = (res?.plan?.planned_courses || []).filter(
        (p) => p.selection_type === "ELECTIVE"
      );
      electiveRows.sort((a, b) => a.id - b.id);
      setSelectedElectives(electiveRows.map((p) => p.course));
    } catch (e) {
      setError(e?.response?.data?.detail || "Could not load next-semester plan.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const electiveById = useMemo(() => {
    const m = new Map();
    (data?.elective_options || []).forEach((c) => m.set(c.id, c));
    return m;
  }, [data]);
  const alreadyTakenElectiveIds = useMemo(
    () => new Set((data?.already_taken_elective_ids || []).map((id) => Number(id))),
    [data]
  );

  const mandatoryCredits = Number(data?.mandatory_credits_total || 0);
  const maxSem = Number(data?.max_semester_credits || 20);

  const electiveSum = useMemo(() => {
    return selectedElectives.reduce(
      (acc, id) => acc + Number(electiveById.get(id)?.credits || 0),
      0
    );
  }, [selectedElectives, electiveById]);

  const semesterTotal = mandatoryCredits + electiveSum;
  const overSemester = semesterTotal > maxSem;

  const priorElectives = Number(data?.prior_elective_courses_used || 0);
  const remainingDegreeCourses = Number(data?.remaining_degree_elective_courses ?? 0);
  const remainingDegreeCredits = Number(data?.remaining_degree_elective_credits || 0);

  const countingThisPlan = useMemo(() => {
    let remC = remainingDegreeCourses;
    let remCr = remainingDegreeCredits;
    let count = 0;
    let credits = 0;
    for (const id of selectedElectives) {
      const c = electiveById.get(id);
      if (!c) continue;
      const cr = Number(c.credits || 0);
      if (remC > 0 && remCr >= cr) {
        count += 1;
        credits += cr;
        remC -= 1;
        remCr -= cr;
      }
    }
    return { count, credits, extraCourses: selectedElectives.length - count };
  }, [selectedElectives, electiveById, remainingDegreeCourses, remainingDegreeCredits]);

  const wasSubmitted = data?.plan?.status === "SUBMITTED";
  const canEditElectives = !!data?.can_edit_electives;
  const progress = data?.progress || {};

  function toggleElective(courseId, checked, credits) {
    if (!canEditElectives) return;
    if (alreadyTakenElectiveIds.has(Number(courseId))) return;
    setSelectedElectives((prev) => {
      if (!checked) return prev.filter((id) => id !== courseId);
      const add = Number(credits || 0);
      const nextSum =
        prev.reduce((acc, id) => acc + Number(electiveById.get(id)?.credits || 0), 0) + add;
      if (mandatoryCredits + nextSum > maxSem) return prev;
      if (prev.includes(courseId)) return prev;
      return [...prev, courseId];
    });
  }

  async function handleSave() {
    if (!data?.plan?.id || !canEditElectives || overSemester) return;
    try {
      setSaving(true);
      await saveStudentNextSemesterPlan(data.plan.id, selectedElectives);
      await load();
    } catch (e) {
      setError(e?.response?.data?.detail || "Could not save plan.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit() {
    if (!data?.plan?.id || !canEditElectives || overSemester) return;
    try {
      setSubmitting(true);
      // Persist latest checkbox selections before locking the plan.
      await saveStudentNextSemesterPlan(data.plan.id, selectedElectives);
      await submitStudentNextSemesterPlan(data.plan.id);
      await load();
    } catch (e) {
      setError(e?.response?.data?.detail || "Could not submit plan.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="text-sm text-slate-500">Loading plan...</div>;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-indigo-500">
          Planning
        </p>
        <h1 className="text-2xl font-extrabold text-slate-900">Next Semester Plan</h1>
        <p className="text-sm text-slate-600 mt-1">
          {data?.warning_message ||
            "These courses are available only if you successfully pass all previous-semester prerequisite courses."}
        </p>
      </div>

      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/80 to-white p-4 text-sm text-slate-700 space-y-1">
        <div className="mb-3 rounded-xl border border-indigo-200 bg-white/80 p-3">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span className="font-semibold uppercase tracking-wide">Degree completion progress</span>
            <span className="font-bold text-indigo-700">{progress.progress_percent || 0}%</span>
          </div>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500"
              style={{ width: `${Math.max(0, Math.min(100, progress.progress_percent || 0))}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-600">
            {progress.completed_credits || 0} / {progress.required_credits || 0} credits ·{" "}
            {progress.completed_courses_count || 0} completed planned courses
          </p>
        </div>
        <p>
          Degree elective allowance (lifetime, all years): you have used{" "}
          <span className="font-semibold text-slate-900">{priorElectives}</span> / 7 elective
          courses toward your degree so far.
        </p>
        <p>
          Remaining toward degree: up to{" "}
          <span className="font-semibold text-slate-900">{remainingDegreeCourses}</span> elective
          courses and{" "}
          <span className="font-semibold text-slate-900">{remainingDegreeCredits.toFixed(1)}</span>{" "}
          credits. You may add more electives this semester if you stay within the semester cap;
          extra courses will not count toward the 7 / 21 degree elective rule.
        </p>
        <p>
          This semester total (mandatory + selected electives):{" "}
          <span className={`font-semibold ${overSemester ? "text-red-600" : "text-slate-900"}`}>
            {semesterTotal.toFixed(1)} / {maxSem} credits
          </span>
          .
        </p>
        {selectedElectives.length > 0 && (
          <p className="text-xs text-slate-600">
            In this draft, <span className="font-semibold">{countingThisPlan.count}</span> selected
            elective(s) count toward the degree ({countingThisPlan.credits.toFixed(1)} cr.);
            {countingThisPlan.extraCourses > 0 && (
              <>
                {" "}
                <span className="font-semibold">{countingThisPlan.extraCourses}</span> are beyond
                that cap but still allowed if the semester limit allows.
              </>
            )}
          </p>
        )}
        <div className={`mt-2 rounded-lg border px-3 py-2 text-xs ${canEditElectives ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
          {data?.edit_window_message}
          {data?.edit_window_start && data?.edit_window_end && (
            <span>
              {" "}Window: {new Date(data.edit_window_start).toLocaleString()} - {new Date(data.edit_window_end).toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-bold text-slate-900">Mandatory Courses</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {(data?.mandatory_courses || []).map((c) => (
            <div key={c.id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-xs font-semibold text-indigo-600">{c.code}</p>
              <p className="text-sm font-semibold text-slate-900">{c.name}</p>
              <p className="text-[11px] text-slate-500">{c.credits} credits</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-bold text-slate-900">Elective Courses</h2>
          <span className={`text-xs font-semibold ${overSemester ? "text-red-600" : "text-slate-600"}`}>
            {selectedElectives.length} selected · {electiveSum.toFixed(1)} elective credits
          </span>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {(data?.elective_options || []).map((c) => {
            const checked = selectedElectives.includes(c.id);
            const row = (data?.plan?.planned_courses || []).find(
              (p) => p.course === c.id && p.selection_type === "ELECTIVE"
            );
            const toward = row?.counts_toward_degree_elective !== false;
            const isTakenBefore = alreadyTakenElectiveIds.has(Number(c.id));
            return (
              <label
                key={c.id}
                className={`rounded-xl border px-3 py-2 flex items-start gap-2 ${
                  isTakenBefore
                    ? "border-slate-200 bg-slate-100 opacity-60"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <input
                  type="checkbox"
                  disabled={!canEditElectives || isTakenBefore}
                  checked={checked}
                  onChange={(e) => toggleElective(c.id, e.target.checked, c.credits)}
                />
                <span>
                  <p className="text-xs font-semibold text-indigo-600">{c.code}</p>
                  <p className="text-sm font-semibold text-slate-900">{c.name}</p>
                  <p className="text-[11px] text-slate-500">{c.credits} credits</p>
                  {isTakenBefore && (
                    <p className="text-[10px] text-slate-600 mt-1">
                      Already selected in a previous submitted semester plan.
                    </p>
                  )}
                  {!canEditElectives && row && !toward && (
                    <p className="text-[10px] text-amber-700 mt-1">Does not count toward degree elective cap</p>
                  )}
                </span>
              </label>
            );
          })}
        </div>
        {overSemester && (
          <p className="mt-2 text-xs text-red-600">
            Semester total exceeds {maxSem} credits. Remove electives before saving or submitting.
          </p>
        )}
      </div>

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          disabled={!canEditElectives || overSemester || saving}
          onClick={handleSave}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Draft"}
        </button>
        <button
          type="button"
          disabled={!canEditElectives || overSemester || submitting}
          onClick={handleSubmit}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {submitting ? "Submitting..." : !canEditElectives ? "Submitted (Locked)" : wasSubmitted ? "Re-submit Plan" : "Submit Plan"}
        </button>
      </div>
    </div>
  );
}
