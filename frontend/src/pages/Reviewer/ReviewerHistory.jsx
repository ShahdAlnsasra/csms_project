// ReviewerHistory.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ClockIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/solid";
import FancySelect from "../../components/FancySelect";
import { fetchReviewerHistorySyllabuses, fetchDepartments } from "../../api/api";

const statusColors = {
  APPROVED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  REJECTED: "bg-rose-100 text-rose-700 border-rose-200",
};

const statusLabel = {
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export default function ReviewerHistory() {
  const [search, setSearch] = useState("");
  const [items, setItems] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = searchParams.get("status") || "all";

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("csmsUser") || "null");
    if (!user || user.role !== "REVIEWER") return;

    const deptId =
      typeof user.department === "number" || typeof user.department === "string"
        ? user.department
        : user.department?.id || user.department_id || user.departmentId;

    setLoading(true);
    Promise.all([
      fetchReviewerHistorySyllabuses({ reviewerId: user.id, departmentId: deptId }),
      fetchDepartments(),
    ])
      .then(([data, deps]) => {
        const arr = Array.isArray(data) ? data : data?.results || [];
        
        // Sort by updated_at descending
        arr.sort((a, b) => {
          const aTime = new Date(a.updated_at || 0).getTime();
          const bTime = new Date(b.updated_at || 0).getTime();
          return bTime - aTime;
        });
        
        setItems(arr);
        
        const depsArr = Array.isArray(deps) ? deps : (Array.isArray(deps?.results) ? deps.results : (Array.isArray(deps?.data) ? deps.data : []));
        setDepartments(depsArr);
      })
      .catch((error) => {
        console.error("Error fetching history:", error);
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const statusOptions = useMemo(
    () => [
      { value: "all", label: "All Status" },
      { value: "APPROVED", label: "Approved" },
      { value: "REJECTED", label: "Rejected" },
    ],
    []
  );

  const filtered = useMemo(() => {
    return (items || []).filter((item) => {
      const matchesSearch =
        (item.course_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (item.course_code || "").toLowerCase().includes(search.toLowerCase()) ||
        (item.content || "").toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === "all" || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [items, search, statusFilter]);

  const handleStatusChange = (newStatus) => {
    if (newStatus === "all") {
      setSearchParams({});
    } else {
      setSearchParams({ status: newStatus });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate("/reviewer/dashboard")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 bg-white/70 backdrop-blur text-slate-800 text-sm font-semibold hover:bg-white shadow-sm"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Dashboard
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-700">
          <ClockIcon className="h-4 w-4" />
          History
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
          Review History
        </h1>
        <p className="text-sm text-slate-600 max-w-3xl">
          View all approved and rejected syllabuses. Filter by status to see specific results.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 md:p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-[1.4fr,0.6fr] gap-3">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search course name, code, or content"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-3 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 outline-none"
            />
          </div>

          <FancySelect
            value={statusFilter}
            onChange={handleStatusChange}
            icon={FunnelIcon}
            options={statusOptions}
          />
        </div>

        <div className="grid gap-3">
          {filtered.map((item) => {
            const isReadOnly = true; // History items are always read-only
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  // History items are always read-only, try new-syllabuses first, fallback to edited
                  navigate(`/reviewer/new-syllabuses/${item.id}`, { state: { readOnly: isReadOnly } });
                }}
                className="w-full text-left rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 shadow-sm hover:border-slate-300 transition flex flex-col md:flex-row md:items-center md:justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-slate-900">
                    {item.course_name || "Course"} • {item.course_code || ""}
                  </div>
                  <div className="text-xs text-slate-600 line-clamp-2">
                    {(item.content || "").slice(0, 140) || "Syllabus content"}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="text-xs text-slate-500">
                      {item.status === "APPROVED" ? "Approved" : "Rejected"}: {item.updated_at ? (item.updated_at.includes('T') ? item.updated_at.slice(0, 16).replace('T', ' ') : item.updated_at.slice(0, 16)) : ""}
                    </div>
                    {(() => {
                      const deptId = item.department_id || item.course?.department_id || item.course?.department?.id;
                      const dept = deptId ? departments.find(d => String(d.id) === String(deptId)) : null;
                      const deptLabel = dept ? `${dept.name}${dept.code ? ` (${dept.code})` : ""}` : (item.course?.department_name ? `${item.course.department_name}${item.course.department_code ? ` (${item.course.department_code})` : ""}` : "");
                      return deptLabel ? (
                        <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                          {deptLabel}
                        </span>
                      ) : null;
                    })()}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
                      statusColors[item.status] ||
                      "bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    {statusLabel[item.status] || item.status}
                  </span>
                </div>
              </button>
            );
          })}

          {loading && (
            <div className="text-sm text-slate-500 border border-dashed border-slate-200 rounded-xl p-6 text-center">
              Loading...
            </div>
          )}

          {!loading && filtered.length === 0 && items.length === 0 && (
            <div className="text-sm text-slate-500 border border-dashed border-slate-200 rounded-xl p-6 text-center">
              <div>No history found.</div>
            </div>
          )}
          
          {!loading && filtered.length === 0 && items.length > 0 && (
            <div className="text-sm text-slate-500 border border-dashed border-slate-200 rounded-xl p-6 text-center">
              No syllabuses match your filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

