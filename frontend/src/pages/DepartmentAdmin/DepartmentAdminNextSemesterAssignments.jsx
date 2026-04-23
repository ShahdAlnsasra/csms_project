import React, { useEffect, useMemo, useState } from "react";
import {
  deleteDeptCourseOffering,
  fetchDeptCourseOfferings,
  fetchDeptCourses,
  fetchDeptLecturers,
  fetchDeptTermEditWindow,
  fetchNextTerm,
  fetchTerms,
  saveDeptTermEditWindow,
  upsertDeptCourseOffering,
} from "../../api/api";
import FancySelect from "../../components/FancySelect";
import {
  CalendarDays,
  GraduationCap,
  Layers,
  Search,
  Sparkles,
  Users,
} from "lucide-react";

const MAX_YEAR_TERM_CREDITS = 20;

function toLocalInputValue(apiValue) {
  if (!apiValue) return "";
  const d = new Date(apiValue);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(
    d.getMinutes()
  )}`;
}

function toApiIso(localValue) {
  if (!localValue) return null;
  const d = new Date(localValue);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function getDepartmentIdFromUser(user) {
  if (!user) return null;
  if (typeof user.department === "number" || typeof user.department === "string") return user.department;
  return user.department?.id || user.department_id || user.departmentId || null;
}

export default function DepartmentAdminNextSemesterAssignments() {
  const [departmentId, setDepartmentId] = useState(null);
  const [terms, setTerms] = useState([]);
  const [termId, setTermId] = useState("");
  const [courses, setCourses] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [offerings, setOfferings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [scheduleFilter, setScheduleFilter] = useState("all");
  const [staffSearch, setStaffSearch] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [savingWindow, setSavingWindow] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("csmsUser") || "null");
    setDepartmentId(getDepartmentIdFromUser(user));
  }, []);

  useEffect(() => {
    if (!departmentId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const [termsRes, coursesRes, lecturersRes] = await Promise.all([
          fetchTerms(),
          fetchDeptCourses({ departmentId }),
          fetchDeptLecturers(departmentId),
        ]);
        if (cancelled) return;
        const termsList = Array.isArray(termsRes) ? termsRes : [];
        let finalTerms = termsList;
        if (!finalTerms.length) {
          try {
            const nextFromApi = await fetchNextTerm();
            if (nextFromApi?.id) finalTerms = [nextFromApi];
          } catch (_) {}
        }
        setTerms(finalTerms);
        const next = finalTerms.find((t) => !t.is_current) || finalTerms[0];
        const effectiveTerm = termId || String(next?.id || "");
        if (!termId && effectiveTerm) setTermId(effectiveTerm);

        setCourses(Array.isArray(coursesRes) ? coursesRes : []);
        setLecturers(Array.isArray(lecturersRes) ? lecturersRes : []);

        if (effectiveTerm) {
          const [offRes, windowRes] = await Promise.all([
            fetchDeptCourseOfferings({
              departmentId,
              termId: effectiveTerm,
            }),
            fetchDeptTermEditWindow(effectiveTerm),
          ]);
          if (cancelled) return;
          setOfferings(Array.isArray(offRes) ? offRes : []);
          setEditStart(toLocalInputValue(windowRes?.student_edit_start));
          setEditEnd(toLocalInputValue(windowRes?.student_edit_end));
        } else {
          setOfferings([]);
        }
      } catch (e) {
        if (!cancelled) setError(e?.response?.data?.detail || "Could not load planner data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [departmentId, termId]);

  const offeringMap = useMemo(() => {
    const map = new Map();
    offerings.forEach((o) => map.set(o.course, o));
    return map;
  }, [offerings]);

  const courseById = useMemo(() => {
    const m = new Map();
    courses.forEach((c) => m.set(c.id, c));
    return m;
  }, [courses]);

  const scheduledCreditsByYear = useMemo(() => {
    const map = new Map();
    offerings.forEach((o) => {
      const c = courseById.get(o.course);
      if (!c) return;
      const y = c.year || 1;
      map.set(y, (map.get(y) || 0) + Number(c.credits || 0));
    });
    return map;
  }, [offerings, courseById]);

  const yearsPresent = useMemo(() => {
    const ys = new Set(courses.map((c) => c.year || 1));
    return Array.from(ys).sort((a, b) => a - b);
  }, [courses]);

  const focusedYearCredits = useMemo(() => {
    const targetYear = yearFilter ? Number(yearFilter) : yearsPresent[0];
    return Number(scheduledCreditsByYear.get(Number(targetYear)) || 0);
  }, [scheduledCreditsByYear, yearFilter, yearsPresent]);

  const coursesByYear = useMemo(() => {
    const grouped = new Map();
    courses.forEach((c) => {
      const y = c.year || 1;
      if (!grouped.has(y)) grouped.set(y, []);
      grouped.get(y).push(c);
    });
    return Array.from(grouped.entries()).sort((a, b) => a[0] - b[0]);
  }, [courses]);

  const termOptions = terms.map((t) => ({
    value: String(t.id),
    label: `${t.academic_year} · ${t.semester}${t.is_current ? " (Current)" : ""}`,
  }));

  const yearFilterOptions = yearsPresent.map((y) => ({ value: String(y), label: `Year ${y}` }));

  const scheduleFilterOptions = [
    { value: "all", label: "All courses" },
    { value: "scheduled", label: "On this term" },
    { value: "open", label: "Not on this term" },
  ];

  const filteredBlocks = useMemo(() => {
    return coursesByYear
      .map(([year, yearCourses]) => {
        let list = yearCourses;
        if (yearFilter && String(year) !== yearFilter) return null;
        if (scheduleFilter === "scheduled") {
          list = list.filter((c) => offeringMap.has(c.id));
        } else if (scheduleFilter === "open") {
          list = list.filter((c) => !offeringMap.has(c.id));
        }
        if (!list.length) return null;
        return { year, courses: list };
      })
      .filter(Boolean);
  }, [coursesByYear, yearFilter, scheduleFilter, offeringMap]);

  useEffect(() => {
    if (!yearsPresent.length) return;
    if (!yearFilter || !yearsPresent.includes(Number(yearFilter))) {
      setYearFilter(String(yearsPresent[0]));
    }
  }, [yearsPresent, yearFilter]);

  const lecturersFiltered = useMemo(() => {
    const q = staffSearch.trim().toLowerCase();
    if (!q) return lecturers;
    return lecturers.filter(
      (l) =>
        String(l.full_name || "").toLowerCase().includes(q) ||
        String(l.email || "").toLowerCase().includes(q)
    );
  }, [staffSearch, lecturers]);

  async function saveOffering(course, lecturerIds) {
    if (!termId) return;
    setError("");
    try {
      await upsertDeptCourseOffering({
        course: course.id,
        term: Number(termId),
        department: Number(departmentId),
        lecturer_ids: lecturerIds.map((x) => Number(x)),
      });
      setMessage("Assignments updated.");
      const offRes = await fetchDeptCourseOfferings({
        departmentId,
        termId,
      });
      setOfferings(Array.isArray(offRes) ? offRes : []);
    } catch (e) {
      const d = e?.response?.data?.detail;
      setError(typeof d === "string" ? d : "Could not save offering.");
      setMessage("");
    }
  }

  async function removeOffering(offeringId) {
    if (!offeringId) return;
    setError("");
    try {
      await deleteDeptCourseOffering(offeringId);
      setMessage("Course removed from this term.");
      const offRes = await fetchDeptCourseOfferings({
        departmentId,
        termId,
      });
      setOfferings(Array.isArray(offRes) ? offRes : []);
    } catch (e) {
      const d = e?.response?.data?.detail;
      setError(typeof d === "string" ? d : "Could not remove offering.");
      setMessage("");
    }
  }

  async function saveTermWindow() {
    if (!termId) return;
    setSavingWindow(true);
    setError("");
    try {
      await saveDeptTermEditWindow(termId, toApiIso(editStart), toApiIso(editEnd));
      setMessage("Student elective edit window saved for this term.");
    } catch (e) {
      const d = e?.response?.data?.detail;
      setError(typeof d === "string" ? d : "Could not save edit window.");
      setMessage("");
    } finally {
      setSavingWindow(false);
    }
  }

  if (loading && !courses.length) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Sparkles className="h-4 w-4 animate-pulse text-indigo-500" />
        Loading assignment planner…
      </div>
    );
  }

  const creditRatio = Math.min(1, focusedYearCredits / MAX_YEAR_TERM_CREDITS);

  return (
    <div className="space-y-8 pb-10">
      <div className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-sky-50 p-6 md:p-8 shadow-sm">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-indigo-200/30 blur-3xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-indigo-600">
              Planning
            </p>
            <h1 className="mt-1 text-2xl md:text-3xl font-extrabold text-slate-900">
              Next semester offerings
            </h1>
            <p className="mt-2 max-w-xl text-sm text-slate-600">
              Choose term, year, and assign offerings. Credit cap is enforced per{" "}
              <strong>year + term</strong> (max {MAX_YEAR_TERM_CREDITS} credits).
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm">
              <Layers className="h-3.5 w-3.5 text-indigo-500" />
              {courses.length} catalog courses
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm">
              <CalendarDays className="h-3.5 w-3.5 text-sky-500" />
              {offerings.length} on this term
            </span>
          </div>
        </div>

        <div className="relative mt-6 max-w-md">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">
            Credit budget for Year {yearFilter || yearsPresent[0] || "-"}
          </p>
          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200/80">
            <div
              className={`h-full rounded-full transition-all ${
                focusedYearCredits > MAX_YEAR_TERM_CREDITS
                  ? "bg-rose-500"
                  : "bg-gradient-to-r from-indigo-500 to-sky-500"
              }`}
              style={{ width: `${creditRatio * 100}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-slate-600">
            <span className="font-semibold text-slate-900">{focusedYearCredits}</span> /{" "}
            {MAX_YEAR_TERM_CREDITS} credits
            {focusedYearCredits >= MAX_YEAR_TERM_CREDITS && (
              <span className="text-amber-700"> · at capacity</span>
            )}
          </p>
        </div>
      </div>

      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Academic term
          </label>
          <div className="mt-2">
            <FancySelect value={termId} onChange={(v) => setTermId(String(v))} options={termOptions} />
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Year focus
          </label>
          <div className="mt-2">
            <FancySelect
              value={yearFilter}
              onChange={(v) => setYearFilter(String(v))}
              options={yearFilterOptions}
            />
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:col-span-2">
          <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Schedule filter
          </label>
          <div className="mt-2">
            <FancySelect
              value={scheduleFilter}
              onChange={(v) => setScheduleFilter(String(v))}
              options={scheduleFilterOptions}
            />
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            “Not on this term” lists catalog courses you have not added to the selected term yet—add
            lecturers (or save with none) to place the course on the schedule if credits allow.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:col-span-2">
          <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Student elective edit window (whole term)
          </label>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="datetime-local"
              value={editStart}
              onChange={(e) => setEditStart(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
            />
            <input
              type="datetime-local"
              value={editEnd}
              onChange={(e) => setEditEnd(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={saveTermWindow}
              disabled={savingWindow}
              className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
            >
              {savingWindow ? "Saving..." : "Save window"}
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <input
            type="search"
            value={staffSearch}
            onChange={(e) => setStaffSearch(e.target.value)}
            placeholder="Filter staff list when assigning…"
            className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>
      </div>

      <div className="space-y-8">
        {filteredBlocks.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-10 text-center text-sm text-slate-500">
            No courses match these filters.
          </div>
        )}
        {filteredBlocks.map(({ year, courses: yearCourses }) => (
          <section key={year} className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white">
                {year}
              </span>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Year {year}</h2>
                <p className="text-[11px] text-slate-500">
                  {yearCourses.length} course{yearCourses.length === 1 ? "" : "s"} in view
                </p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
              {yearCourses.map((course) => {
                const existing = offeringMap.get(course.id);
                const onTerm = !!existing;
                const selectedIds = existing?.lecturers_display?.map((l) => String(l.id)) || [];
                return (
                  <CourseOfferingCard
                    key={`${course.id}-${existing?.id || "new"}-${termId}`}
                    course={course}
                    onTerm={onTerm}
                    offeringId={existing?.id}
                    initialLecturerIds={selectedIds}
                    lecturers={lecturersFiltered}
                    yearBudgetUsed={Number(scheduledCreditsByYear.get(course.year || 1) || 0)}
                    maxYearCredits={MAX_YEAR_TERM_CREDITS}
                    onSave={(ids) => saveOffering(course, ids)}
                    onRemove={() => removeOffering(existing?.id)}
                  />
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function CourseOfferingCard({
  course,
  onTerm,
  offeringId,
  initialLecturerIds,
  lecturers,
  yearBudgetUsed,
  maxYearCredits,
  onSave,
  onRemove,
}) {
  const [selected, setSelected] = useState(() => new Set(initialLecturerIds));
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(Array.from(selected));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className={`flex flex-col rounded-2xl border p-4 shadow-sm transition ${
        onTerm
          ? "border-indigo-200 bg-gradient-to-br from-white to-indigo-50/40"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-600">
            {course.code}
          </p>
          <p className="text-sm font-bold text-slate-900">{course.name}</p>
          <p className="mt-1 text-[11px] text-slate-500">
            {course.credits} cr. · {course.planning_type === "ELECTIVE" ? "Elective" : "Mandatory"}
            {!onTerm && (
              <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-900">
                Not on this term
              </span>
            )}
            {onTerm && (
              <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-900">
                Scheduled
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onTerm && offeringId ? (
            <button
              type="button"
              onClick={onRemove}
              className="shrink-0 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
            >
              Remove
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="shrink-0 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-200/50 hover:bg-indigo-500 disabled:opacity-50"
          >
            {saving ? "Saving…" : onTerm ? "Save" : "Add to term & save"}
          </button>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-[11px] font-semibold text-slate-600">
        <Users className="h-3.5 w-3.5" />
        Lecturers
      </div>
      <div className="mt-2 max-h-36 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50/60 p-2 space-y-1.5">
        {lecturers.length === 0 ? (
          <p className="text-[11px] text-slate-500 px-1">No lecturers match the search.</p>
        ) : (
          lecturers.map((l) => {
            const id = String(l.id);
            const checked = selected.has(id);
            return (
              <label
                key={l.id}
                className="flex cursor-pointer items-start gap-2 rounded-lg border border-transparent px-2 py-1.5 text-xs hover:border-slate-200 hover:bg-white"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    setSelected((prev) => {
                      const next = new Set(prev);
                      if (e.target.checked) next.add(id);
                      else next.delete(id);
                      return next;
                    });
                  }}
                />
                <span>
                  <span className="font-semibold text-slate-800">{l.full_name}</span>
                  <span className="block text-[10px] text-slate-500">{l.email}</span>
                </span>
              </label>
            );
          })
        )}
      </div>
      <p className="mt-2 text-[10px] text-slate-500 flex items-center gap-1">
        <GraduationCap className="h-3 w-3" />
        Year {course.year} budget: {yearBudgetUsed} / {maxYearCredits} credits for this term.
      </p>
    </div>
  );
}
