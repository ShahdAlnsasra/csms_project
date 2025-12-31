// LecturerHistory.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FunnelIcon, MagnifyingGlassIcon, ClockIcon } from "@heroicons/react/24/solid";

import FancySelect from "../../components/FancySelect";
import { fetchLecturerSyllabuses, fetchLecturerCourses, fetchDeptCourses, fetchYears } from "../../api/api";

const statusMeta = [
  { value: "all", label: "Status" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "PENDING_REVIEW", label: "Pending reviewer" },
  { value: "DRAFT", label: "Draft" },
];

const statusColors = {
  APPROVED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  REJECTED: "bg-rose-100 text-rose-700 border-rose-200",
  PENDING_REVIEW: "bg-amber-100 text-amber-800 border-amber-200",
  DRAFT: "bg-slate-100 text-slate-700 border-slate-200",
};
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

const getCourseKey = (v) => {
  // תומך בכמה פורמטים אפשריים
  return String(
    v?.course_id ??
    v?.courseId ??
    v?.course?.id ??
    v?.course ??
    v?.course_code ??
    v?.courseCode ??
    v?.course_name ??  // fallback
    ""
  );
};

// לכל (course + academicYear) מחזיר עד 2 רשומות:
// 1) APPROVED הכי חדש
// 2) ה"Work in progress" הכי חדש: PENDING_* / DRAFT / REJECTED
const pickApprovedPlusLatestWorkPerCourseYear = (rows = []) => {
  const map = new Map();

  const normStatus = (x) => String(x?.status || "").toUpperCase();
  const getUpdated = (x) => String(x?.updated_at || "");
  const getId = (x) => Number(x?.id || 0);

  const better = (a, b) => {
    if (!b) return true;
    const au = getUpdated(a);
    const bu = getUpdated(b);
    if (au !== bu) return au > bu;
    return getId(a) > getId(b); // ✅ שוברים שוויון לפי id
  };

  const isWork = (st) =>
    st === "DRAFT" ||
    st === "PENDING_REVIEW" ||
    st === "PENDING_DEPT" ||
    st === "REJECTED";

  for (const v of rows) {
    const year = getAcademicYear(v);
    const course = getCourseKey(v);
    const key = `${course}__${year || "NOYEAR"}`;

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
    if (b.work) out.push(b.work);       // קודם Work (Draft/Pending/Rejected)
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

export default function LecturerHistory() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");

  const [items, setItems] = useState([]);
  const [lecturerCourses, setLecturerCourses] = useState([]);
  const [deptYears, setDeptYears] = useState([]);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("csmsUser") || "null");
    if (!user) return;

    const deptId =
      typeof user.department === "number" || typeof user.department === "string"
        ? user.department
        : user.department?.id || user.department_id || user.departmentId;

    setLoading(true);

    Promise.all([
      fetchLecturerSyllabuses({ lecturerId: user.id }),
      fetchLecturerCourses({ lecturerId: user.id, departmentId: deptId }),
      fetchDeptCourses({ departmentId: deptId }),
      fetchYears(deptId),
    ])
      .then(([history, lecturerList, deptList, yearsArr]) => {
        const historyArr = Array.isArray(history) ? history : (history?.results || []);
        setItems(pickApprovedPlusLatestWorkPerCourseYear(historyArr));


        const listToUse =
          Array.isArray(lecturerList) && lecturerList.length > 0
            ? lecturerList
            : Array.isArray(deptList)
            ? deptList
            : [];

        setLecturerCourses(listToUse);
        setDeptYears(Array.isArray(yearsArr) ? yearsArr : []);
      })
      .finally(() => setLoading(false));
  }, []);

  const yearsOptions = useMemo(() => {
    const ys = deptYears.length
      ? deptYears
      : Array.from(new Set((items || []).map((h) => h.course_year)))
          .filter((y) => y !== null && y !== undefined && y !== "")
          .sort((a, b) => Number(a) - Number(b));

    return [{ value: "all", label: "Year" }, ...ys.map((y) => ({ value: String(y), label: String(y) }))];
  }, [deptYears, items]);

  const courseOptions = useMemo(() => {
    const opts =
      lecturerCourses.length > 0
        ? lecturerCourses.map((c) => ({
            value: String(c.id),
            label: `${c.name || "Course"} • ${c.code || ""}`.trim(),
          }))
        : [];

    return [{ value: "all", label: "Course" }, ...opts.sort((a, b) => a.label.localeCompare(b.label))];
  }, [lecturerCourses]);

  const filtered = useMemo(() => {
    return (items || []).filter((item) => {
      const courseLabel = `${item.course_name || ""} ${item.course_code || ""}`.trim();

      const matchesSearch =
        courseLabel.toLowerCase().includes(search.toLowerCase()) ||
        (item.content || "").toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      const matchesYear =  yearFilter === "all" || String(getAcademicYear(item)) === String(yearFilter);


      const itemCourseId = item.course ?? item.course_id;
      const matchesCourse = courseFilter === "all" || String(itemCourseId) === String(courseFilter);

      return matchesSearch && matchesStatus && matchesYear && matchesCourse;
    });
  }, [items, search, statusFilter, yearFilter, courseFilter]);

  const statusLabel = (s) => statusMeta.find((x) => x.value === s)?.label || s;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-700">
          <ClockIcon className="h-4 w-4" />
          History
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
          All syllabus versions you have written
        </h1>
        <p className="text-sm text-slate-600 max-w-3xl">
          Search and filter by status, year, or course. Open any version to view details.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 md:p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-[1.4fr,repeat(3,0.6fr)] gap-3">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search syllabus or course"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-3 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 outline-none"
            />
          </div>

          <FancySelect value={statusFilter} onChange={setStatusFilter} icon={FunnelIcon} options={statusMeta} />
          <FancySelect value={yearFilter} onChange={setYearFilter} icon={FunnelIcon} options={yearsOptions} />
          <FancySelect value={courseFilter} onChange={setCourseFilter} icon={FunnelIcon} options={courseOptions} />
        </div>

        <div className="grid gap-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm hover:border-indigo-200 hover:shadow-md transition flex flex-col md:flex-row md:items-center md:justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="text-sm font-semibold text-slate-900">
                  {item.course_name} • {item.course_semester || ""} {item.course_year}
                </div>
                <div className="text-xs text-slate-600 line-clamp-2">
                  {(item.content || "").slice(0, 140) || "Syllabus content"}
                </div>
                <div className="text-xs text-slate-500">Updated: {item.updated_at ? (item.updated_at.includes('T') ? item.updated_at.slice(0, 16).replace('T', ' ') : item.updated_at.slice(0, 16)) : ""}</div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
                    statusColors[item.status] || "bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  {statusLabel(item.status)}
                </span>
                <button
                  type="button"
                  className="text-sm font-semibold text-indigo-700 hover:text-indigo-600"
                  onClick={() => {
                    const courseId = item.course ?? item.course_id;
                    const status = String(item.status || "").toUpperCase();
                    // ✅ אם זה DRAFT → לעריכה באותו מסך "new" אבל עם syllabusId כדי למלא טופס
                    if (item.status === "DRAFT") {
                      navigate(`/lecturer/courses/${courseId}/new?syllabusId=${item.id}`);
                      return;
                    }
                    // ✅ אחרת → דף פרטים/צפייה (מה שכבר היה לך)
                    if (status === "REJECTED") {
                      navigate(`/lecturer/courses/${courseId}/new?syllabusId=${item.id}&mode=fix`);
                      return;
                    } else {
                      navigate(`/lecturer/courses/${courseId}/versions/${item.id}`, {
                        state: { version: item },
                      });
                    }
                    
                  }}
                >
                  View details
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
              No syllabus versions match your filters yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
