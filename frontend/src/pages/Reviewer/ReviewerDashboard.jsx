import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DocumentTextIcon,
  PencilSquareIcon,
  SparklesIcon,
  ArrowRightIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/solid";
import { fetchReviewerNewSyllabuses, fetchReviewerEditedSyllabuses } from "../../api/api";

export default function ReviewerDashboard() {
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);
  const [editedCount, setEditedCount] = useState(0);
  const [loadingCount, setLoadingCount] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("csmsUser") || "null");
    if (!user || user.role !== "REVIEWER") return;

    const deptId =
      typeof user.department === "number" || typeof user.department === "string"
        ? user.department
        : user.department?.id || user.department_id || user.departmentId;

    setLoadingCount(true);
    Promise.all([
      fetchReviewerNewSyllabuses({ reviewerId: user.id, departmentId: deptId }),
      fetchReviewerEditedSyllabuses({ reviewerId: user.id, departmentId: deptId }),
    ])
      .then(([newData, editedData]) => {
        const newArr = Array.isArray(newData) ? newData : newData?.results || [];
        // Count only PENDING_REVIEW status for new syllabuses
        const pending = newArr.filter(item => item.status === "PENDING_REVIEW").length;
        setPendingCount(pending);
        
        const editedArr = Array.isArray(editedData) ? editedData : editedData?.results || [];
        // Count only PENDING_REVIEW status for edited syllabuses
        const editedPending = editedArr.filter(item => item.status === "PENDING_REVIEW").length;
        setEditedCount(editedPending);
      })
      .catch(() => {
        setPendingCount(0);
        setEditedCount(0);
      })
      .finally(() => setLoadingCount(false));
  }, []);

  return (
    <div className="space-y-8">
      {/* Intro section */}
      <section className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-indigo-500 flex items-center gap-2">
          <SparklesIcon className="h-4 w-4" />
          Reviewer
        </p>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
          Reviewer Dashboard
        </h1>
        <p className="text-sm md:text-base text-slate-600 max-w-3xl">
          Review and approve syllabuses from lecturers in your department. Use AI-powered tools to ensure quality and compliance with academic standards.
        </p>

        <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
          <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 font-medium text-indigo-700 border border-indigo-100">
            <CheckCircleIcon className="mr-1.5 h-3.5 w-3.5" />
            AI-powered review
          </span>
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700 border border-emerald-100">
            <DocumentTextIcon className="mr-1.5 h-3.5 w-3.5" />
            Version comparison
          </span>
        </div>
      </section>

      {/* Main cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* New Syllabuses card */}
        <button
          type="button"
          onClick={() => navigate("/reviewer/new-syllabuses")}
          className="group text-left rounded-3xl bg-white shadow-xl border border-slate-200/80 hover:border-indigo-200 hover:shadow-indigo-100 transition overflow-hidden flex flex-col"
        >
          <div className="px-6 pt-6 pb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-indigo-50 flex items-center justify-center shadow-sm">
                <DocumentTextIcon className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base md:text-lg font-semibold text-slate-900">
                    New Syllabuses to Check
                  </h2>
                  {!loadingCount && pendingCount > 0 && (
                    <span className="inline-flex items-center justify-center h-6 px-2 rounded-full bg-indigo-600 text-white text-xs font-bold">
                      {pendingCount}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-500 max-w-xs">
                  Review newly submitted syllabuses from lecturers in your department.
                  {!loadingCount && pendingCount > 0 && (
                    <span className="block mt-1 font-semibold text-indigo-600">
                      {pendingCount} {pendingCount === 1 ? 'syllabus' : 'syllabuses'} waiting for review
                    </span>
                  )}
                </p>
              </div>
            </div>

            <ArrowRightIcon className="h-5 w-5 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition" />
          </div>

          <div className="px-6 pb-5 space-y-3 text-xs">
            <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-1.5">
              <li>View all pending syllabuses from your department.</li>
              <li>Use AI to automatically check compliance and quality.</li>
              <li>Approve or reject with detailed feedback.</li>
            </ul>
          </div>
        </button>

        {/* Edited Syllabuses card */}
        <button
          type="button"
          onClick={() => navigate("/reviewer/edited-syllabuses")}
          className="group text-left rounded-3xl bg-white shadow-xl border border-slate-200/80 hover:border-emerald-200 hover:shadow-emerald-100 transition overflow-hidden flex flex-col"
        >
          <div className="px-6 pt-6 pb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-emerald-50 flex items-center justify-center shadow-sm">
                <PencilSquareIcon className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base md:text-lg font-semibold text-slate-900">
                    Edited Syllabuses
                  </h2>
                  {!loadingCount && editedCount > 0 && (
                    <span className="inline-flex items-center justify-center h-6 px-2 rounded-full bg-emerald-600 text-white text-xs font-bold">
                      {editedCount}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-500 max-w-xs">
                  Review updated versions of existing syllabuses that need rechecking.
                  {!loadingCount && editedCount > 0 && (
                    <span className="block mt-1 font-semibold text-emerald-600">
                      {editedCount} {editedCount === 1 ? 'syllabus' : 'syllabuses'} waiting for review
                    </span>
                  )}
                </p>
              </div>
            </div>

            <ArrowRightIcon className="h-5 w-5 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition" />
          </div>

          <div className="px-6 pb-5 space-y-3 text-xs">
            <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-1.5">
              <li>See all recently modified syllabuses.</li>
              <li>Compare versions using AI to identify changes.</li>
              <li>Review and approve updated content.</li>
            </ul>
          </div>
        </button>
      </section>
    </div>
  );
}

