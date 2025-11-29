// frontend/src/pages/systemAdmin/SystemAdminDashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchAdminDepartments,
  fetchAdminSignupRequests,
} from "../../api/api";

import {
  BuildingOffice2Icon,
  UserPlusIcon,
  AcademicCapIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/solid";

export default function SystemAdminDashboard() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const deps = await fetchAdminDepartments();
        setDepartments(deps || []);
        setLoadError("");

        const pending = await fetchAdminSignupRequests("PENDING");
        setPendingRequestsCount(Array.isArray(pending) ? pending.length : 0);
      } catch (err) {
        console.error("Dashboard – failed to load data:", err);
        setLoadError("Failed to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const navigateTo = (path) => navigate(path);

  // כרטיס מידע כללי
  const InfoCard = ({
    title,
    count,
    icon: Icon,
    color,
    description,
    buttons,
  }) => (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-lg transition-shadow hover:shadow-xl p-6 flex flex-col justify-between h-full">
      <div className="flex items-start justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-600">
          {title}
        </h2>
        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
          <Icon className="h-6 w-6" />
        </div>
      </div>

      <div className="mt-4">
        {loading ? (
          <p className="text-4xl font-extrabold text-slate-400">...</p>
        ) : (
          <p className="text-4xl font-extrabold text-slate-900">
            {count !== undefined ? count : 0}
          </p>
        )}
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3 pt-4 border-t border-slate-100">
        {buttons}
      </div>
    </div>
  );

  return (
    <div className="space-y-10">
      {/* כותרת הדשבורד */}
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
          <AcademicCapIcon className="h-8 w-8 text-indigo-600" />
          System Admin Overview
        </h1>
        <p className="mt-2 text-base text-slate-600 max-w-3xl">
          Centralized dashboard for tracking department status and admin requests.
        </p>
      </header>

      {loadError && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-8">
          <span className="font-semibold">Loading Error:</span> {loadError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* כרטיס מחלקות */}
        <InfoCard
          title="Active Departments"
          count={departments.length}
          icon={BuildingOffice2Icon}
          color="indigo"
          description="Total number of departments currently registered in the system."
          buttons={
            <>
              <button
                type="button"
                onClick={() => navigateTo("/system-admin/departments")}
                className="px-4 py-2 rounded-xl bg-violet-600 text-sm font-medium text-white shadow-md hover:bg-violet-500 transition flex items-center gap-1"
              >
                Add New Department
              </button>
              <button
                type="button"
                onClick={() => navigateTo("/system-admin/departments/manage")}
                className="px-4 py-2 rounded-xl border border-violet-200 text-sm font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 transition flex items-center gap-1"
              >
                Manage Departments <ArrowRightIcon className="h-4 w-4" />
              </button>
            </>
          }
        />

        {/* כרטיס בקשות הרשמה – רק כפתור אחד */}
        <InfoCard
          title="Pending Requests"
          count={pendingRequestsCount}
          icon={UserPlusIcon}
          color="violet"
          description="Signup requests for Department Admin roles awaiting approval."
          buttons={
            <button
              type="button"
              onClick={() => navigateTo("/system-admin/requests")}
              className="px-4 py-2 rounded-xl bg-violet-600 text-sm font-medium text-white shadow-md hover:bg-violet-500 transition flex items-center gap-1"
            >
              Review Requests <ArrowRightIcon className="h-4 w-4" />
            </button>
          }
        />
      </div>
    </div>
  );
}
