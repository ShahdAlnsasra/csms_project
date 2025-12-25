// src/pages/Lecturer/LecturerCourseVersions.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusCircleIcon,
  DocumentMagnifyingGlassIcon,
} from "@heroicons/react/24/solid";
import FancySelect from "../../components/FancySelect";
import {
  fetchLecturerSyllabuses,
  fetchLecturerSyllabusFilters,
  fetchLecturerCourseById,
} from "../../api/api";
const safeJson = (s) => {
  try {
    return typeof s === "string" ? JSON.parse(s) : s;
  } catch {
    return null;
  }
};

const getAcademicYear = (v) => {
  if (v?.academic_year) return String(v.academic_year);
  const j = safeJson(v?.content);
  return String(j?.academicYear || j?.academicYearComputed || "");
};

// מחזיר לכל Academic Year:
// - APPROVED הכי חדש (אם יש)
// - Work (DRAFT/PENDING/REJECTED) הכי חדש רק אם הוא חדש יותר מה-APPROVED
const pickApprovedPlusLatestWorkPerYear = (rows = []) => {
  const map = new Map();

  const normStatus = (x) => String(x?.status || "").toUpperCase();
  const getUpdated = (x) => String(x?.updated_at || "");
  const getId = (x) => Number(x?.id || 0);

  const better = (a, b) => {
    if (!b) return true;
    const au = getUpdated(a);
    const bu = getUpdated(b);
    if (au !== bu) return au > bu;
    return getId(a) > getId(b); // שובר שוויון
  };

  const isWork = (st) =>
    st === "DRAFT" ||
    st === "PENDING_REVIEW" ||
    st === "PENDING_DEPT" ||
    st === "REJECTED";

  for (const v of rows) {
    const year = getAcademicYear(v);
    const key = year || `__no_year__${v.id}`;

    const bucket = map.get(key) || { approved: null, work: null };
    const st = normStatus(v);

    if (st === "APPROVED") {
      if (better(v, bucket.approved)) bucket.approved = v;
    } else if (isWork(st)) {
      if (better(v, bucket.work)) bucket.work = v;
    }

    map.set(key, bucket);
  }

  const out = [];
  for (const [, b] of map.entries()) {
    // ✅ מציגים Work רק אם הוא חדש יותר מה-Approved
    if (b.work && (!b.approved || better(b.work, b.approved))) out.push(b.work);
    if (b.approved) out.push(b.approved);
  }

  out.sort((a, b) => {
    const au = getUpdated(a);
    const bu = getUpdated(b);
    if (au !== bu) return bu.localeCompare(au);
    return getId(b) - getId(a);
  });

  return out;
};



const statusColors = {
  APPROVED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  REJECTED: "bg-rose-100 text-rose-700 border-rose-200",
  PENDING_REVIEW: "bg-amber-100 text-amber-800 border-amber-200",
  PENDING_DEPT: "bg-amber-100 text-amber-800 border-amber-200",
  DRAFT: "bg-slate-100 text-slate-700 border-slate-200",
};

const statusLabel = {
  APPROVED: "Approved",
  REJECTED: "Rejected",
  PENDING_REVIEW: "Pending reviewer",
  PENDING_DEPT: "Pending department",
  DRAFT: "Draft",
};

export default function LecturerCourseVersions() {
  const { courseId } = useParams();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ statuses: [], years: [] });
  const [courseName, setCourseName] = useState("");

  const navigate = useNavigate();
  useEffect(() => {
  const user = JSON.parse(localStorage.getItem("csmsUser") || "null");
  if (!user) return;

  setLoading(true);

  fetchLecturerSyllabusFilters({ lecturerId: user.id, courseId }).then((data) =>
    setFilters(data || { statuses: [], years: [] })
  );

  fetchLecturerCourseById({ lecturerId: user.id, courseId }).then((c) =>
    setCourseName(c?.name || courseId)
  );

  fetchLecturerSyllabuses({ lecturerId: user.id, courseId })
    .then((data) => {
      const arr = Array.isArray(data) ? data : data?.results || [];
      setItems(pickApprovedPlusLatestWorkPerYear(arr)); // ✅ פה הסינון
    })
    .finally(() => setLoading(false));
}, [courseId]);



  const yearsOptions = useMemo(() => {
    const ys = filters.years || [];
    return [
      { value: "all", label: "Academic Year" },
      ...ys.map((y) => ({ value: String(y), label: String(y) })),
    ];
  }, [filters.years]);

  const statusesOptions = useMemo(() => {
    const ss = filters.statuses || [];
    return [
      { value: "all", label: "Status" },
      ...ss.map((s) => ({ value: s, label: statusLabel[s] || s })),
    ];
  }, [filters.statuses]);

  const filtered = useMemo(() => {
    return (items || []).filter((v) => {
      const matchesSearch =
        (v.course_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (v.content || "").toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === "all" || v.status === statusFilter;
      const matchesYear = yearFilter === "all" || String(getAcademicYear(v)) === String(yearFilter);

      return matchesSearch && matchesStatus && matchesYear;
    });
  }, [items, search, statusFilter, yearFilter]);

  // נשאר רק בשביל הטקסט של הכפתור (Create new version / Create first syllabus)
  const latest = useMemo(() => {
    if (!items.length) return null;
    return [...items].sort((a, b) =>
      (b.updated_at || "").localeCompare(a.updated_at || "")
    )[0];
  }, [items]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-700">
          <DocumentMagnifyingGlassIcon className="h-4 w-4" />
          {courseId} • Versions
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
          {courseName || "Course"} • Version
        </h1>
        <p className="text-sm text-slate-600 max-w-3xl">
          If there is already a syllabus – you can view/edit versions.
        </p>
      </div>

      {/* ❌ מחקנו את Open latest לפי הבקשה שלך */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(`/lecturer/courses/${courseId}/new`)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-600 to-sky-500 text-white text-sm font-semibold shadow-lg hover:shadow-xl transition"
        >
          <PlusCircleIcon className="h-5 w-5" />
          {latest ? "Create new version" : "Create first syllabus"}
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 md:p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-[1.4fr,repeat(2,0.6fr)] gap-3">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search version or notes"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-3 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 outline-none"
            />
          </div>

          <FancySelect
            value={statusFilter}
            onChange={setStatusFilter}
            icon={FunnelIcon}
            options={statusesOptions}
          />
          <FancySelect
            value={yearFilter}
            onChange={setYearFilter}
            icon={FunnelIcon}
            options={yearsOptions}
          />
        </div>

        <div className="grid gap-3">
          {filtered.map((version) => (
            <div
              key={version.id}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm hover:border-indigo-200 hover:shadow-md transition flex flex-col md:flex-row md:items-center md:justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="text-sm font-semibold text-slate-900">
                  {version.course_name || courseId} •{" "}
                  {getAcademicYear(version) || ""}
                </div>

                <div className="text-xs text-slate-600 line-clamp-2">
                  {(version.content || "").slice(0, 140) || "Syllabus version"}
                </div>
                <div className="text-xs text-slate-500">
                  Updated: {version.updated_at?.slice(0, 10) || ""}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
                    statusColors[version.status] ||
                    "bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  {statusLabel[version.status] || version.status}
                </span>

                <button
                  type="button"
                  className="text-sm font-semibold text-indigo-700 hover:text-indigo-600"
                  onClick={() =>
                    navigate(
                      `/lecturer/courses/${courseId}/versions/${version.id}`,
                      { state: { version } }
                    )
                  }
                >
                  View
                </button>
              </div>
            </div>
          ))}

          {loading && (
            <div className="text-sm text-slate-500 border border-dashed border-slate-200 rounded-xl p-6 text-center">
              Loading...
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="text-sm text-slate-500 border border-dashed border-slate-200 rounded-xl p-6 text-center">
              No versions match your filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
