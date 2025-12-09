// frontend/src/pages/DepartmentAdmin/DepartmentAdminRequests.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  fetchDeptAdminRequests,
  decideOnDeptSignupRequest,
} from "../../api/api";

import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon, XMarkIcon } from "@heroicons/react/24/solid";

export default function DepartmentAdminRequests() {
  const [statusTab, setStatusTab] = useState("PENDING"); // PENDING / APPROVED / REJECTED
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [decisionReason, setDecisionReason] = useState("");
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [decisionError, setDecisionError] = useState("");
  const [decisionSuccess, setDecisionSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [departmentId, setDepartmentId] = useState(null);
  const [noDepartmentOnUser, setNoDepartmentOnUser] = useState(false);

  // 🔹 Read csmsUser from localStorage and extract department id
  useEffect(() => {
    try {
      const raw = localStorage.getItem("csmsUser");
      if (!raw) {
        setNoDepartmentOnUser(true);
        return;
      }

      const parsed = JSON.parse(raw);
      console.log("DeptAdminRequests – csmsUser =", parsed);

      let deptId = null;

      // case 1: department is an id (number/string)
      if (
        typeof parsed.department === "number" ||
        typeof parsed.department === "string"
      ) {
        deptId = parsed.department;
      }
      // case 2: department is an object {id, ...}
      else if (
        parsed.department &&
        typeof parsed.department === "object" &&
        parsed.department.id
      ) {
        deptId = parsed.department.id;
      }
      // alternative field names
      else if (parsed.department_id) {
        deptId = parsed.department_id;
      } else if (parsed.departmentId) {
        deptId = parsed.departmentId;
      }

      if (!deptId) {
        setNoDepartmentOnUser(true);
        setDepartmentId(null);
      } else {
        setDepartmentId(deptId);
        setNoDepartmentOnUser(false);
      }
    } catch (e) {
      console.error("Failed to parse csmsUser from localStorage:", e);
      setNoDepartmentOnUser(true);
      setDepartmentId(null);
    }
  }, []);

  // 🔹 Load requests whenever departmentId or status changes
  useEffect(() => {
    async function load() {
      if (!departmentId) {
        setRequests([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setLoadError("");
        setSelectedRequest(null);
        setDecisionReason("");
        setDecisionError("");
        setDecisionSuccess("");

        const data = await fetchDeptAdminRequests({
          departmentId,
          status: statusTab,
          // search is done in frontend for now
        });

        setRequests(data || []);
      } catch (err) {
        console.error("Failed to load department signup requests:", err);
        setLoadError("Failed to load requests for your department.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [departmentId, statusTab]);

  // 🔹 Filter by search (name / email / role)
  const filteredRequests = useMemo(() => {
    if (!search.trim()) return requests;
    const q = search.toLowerCase();

    return requests.filter((r) => {
      const name = (
        r.full_name ||
        [r.first_name, r.last_name].filter(Boolean).join(" ") ||
        ""
      ).toLowerCase();

      const email = (r.email || "").toLowerCase();
      const role = (r.role || "").toLowerCase();
      return name.includes(q) || email.includes(q) || role.includes(q);
    });
  }, [search, requests]);
// 🔹 number of rows currently visible in the table
  //const totalVisible = filteredRequests.length;
  // 🔹 Split into sections
  const studentRequests = filteredRequests.filter((r) => r.role === "STUDENT");
  const lecturerRequests = filteredRequests.filter(
    (r) => r.role === "LECTURER"
  );
  const reviewerRequests = filteredRequests.filter(
    (r) => r.role === "REVIEWER"
  );
   
    // total visible in current tab (after filtering)
  const totalVisible =
    studentRequests.length +
    lecturerRequests.length +
    reviewerRequests.length;


  const handleSelectRequest = (req) => {
    setSelectedRequest(req);
    setDecisionReason("");
    setDecisionError("");
    setDecisionSuccess("");
  };

  const handleDecision = async (decision) => {
  if (!selectedRequest) return;
  setDecisionError("");
  setDecisionSuccess("");
  setDecisionLoading(true);

  try {
    await decideOnDeptSignupRequest(
      selectedRequest.id,
      decision,
      decisionReason
    );

    const data = await fetchDeptAdminRequests({
      departmentId,
      status: statusTab,
    });
    setRequests(data || []);

    setDecisionSuccess(
      decision === "APPROVE"
        ? "Request approved successfully. Email will be sent to the user."
        : "Request rejected successfully. Email will be sent to the user."
    );

    if (statusTab === "PENDING") {
      setSelectedRequest(null);
      setDecisionReason("");
    }
  } catch (err) {
    console.error("Failed to decide on request:", err);
    const msg =
      err.response?.data?.detail ||
      err.response?.data?.non_field_errors?.[0] ||
      "Failed to submit decision.";
    setDecisionError(msg);
  } finally {
    setDecisionLoading(false);
  }
};


  // 🔹 Helper – table section
  const renderSection = (title, colorClasses, list) => {
    const { headerBg, pillText, pillBg, borderColor } = colorClasses;

    return (
      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
        <div
          className={`px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${headerBg} text-slate-800 flex items-center justify-between`}
        >
          <span>{title}</span>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${borderColor} ${pillBg} ${pillText}`}
          >
            {list.length} requests
          </span>
        </div>

        {loading ? (
          <div className="p-4 text-xs text-slate-500">Loading…</div>
        ) : list.length === 0 ? (
          <div className="p-4 text-xs text-slate-400 italic">
            No {statusTab.toLowerCase()} {title.toLowerCase()}.
          </div>
        ) : (
          <table className="min-w-full text-xs">
            <thead className="bg-slate-50 text-[11px] text-slate-500 uppercase tracking-wide border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-2">Name</th>
                <th className="text-left px-4 py-2 hidden sm:table-cell">
                  Email
                </th>
                <th className="text-left px-4 py-2 hidden md:table-cell">
                  Submitted
                </th>
              </tr>
            </thead>
            <tbody>
              {list.map((req) => (
                <tr
                  key={req.id}
                  onClick={() => handleSelectRequest(req)}
                  className={`border-t border-slate-100 cursor-pointer transition ${
                    selectedRequest && selectedRequest.id === req.id
                      ? "bg-indigo-50 hover:bg-indigo-100 border-indigo-300"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <td className="px-4 py-2 text-slate-800 font-medium">
                    {req.full_name ||
                      [req.first_name, req.last_name]
                        .filter(Boolean)
                        .join(" ") ||
                      req.email}
                  </td>
                  <td className="px-4 py-2 text-slate-700 hidden sm:table-cell">
                    {req.email}
                  </td>
                  <td className="px-4 py-2 text-slate-500 text-[11px] hidden md:table-cell">
                    {req.created_at_display ||
                      (req.created_at
                        ? new Date(req.created_at).toLocaleDateString()
                        : "")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <UserGroupIcon className="h-10 w-10 text-indigo-600" />
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            Department Requests Center
          </h1>
          <p className="mt-1 text-sm text-slate-600 max-w-2xl">
            Review signup requests from students, lecturers and reviewers in
            your department and decide whether to approve or reject them.
          </p>
        </div>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col gap-4">
        <div className="inline-flex rounded-full bg-slate-100 p-1 text-xs font-medium shadow-inner w-fit">
  {["PENDING", "APPROVED", "REJECTED"].map((tab) => {
    const labels = {
      PENDING: "Pending",
      APPROVED: "Approved",
      REJECTED: "Rejected",
    };
    const active = statusTab === tab;
    return (
      <button
        key={tab}
        type="button"
        onClick={() => setStatusTab(tab)}
        className={`px-4 py-1.5 rounded-full transition font-semibold flex items-center gap-1.5 ${
          active
            ? "bg-indigo-600 text-white shadow-md shadow-indigo-300/50"
            : "text-slate-600 hover:bg-slate-200"
        }`}
      >
        {labels[tab]}

        {/* 🔹 show little count ONLY when the current tab is Pending */}
        {tab === "PENDING" && statusTab === "PENDING" && totalVisible > 0 && (
          <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-white/90 text-[10px] font-bold text-indigo-700 px-1.5">
            {totalVisible}
          </span>
        )}
      </button>
    );
  })}
</div>


        <div className="flex gap-2 w-full md:w-80">
          <div className="relative flex-grow">
            <MagnifyingGlassIcon className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email or role..."
              className="w-full pl-9 pr-10 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
            />
            {search.length > 0 && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-red-500 transition"
                aria-label="Clear search"
              >
                <XCircleIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Warning if no department on user */}
      {noDepartmentOnUser && (
        <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          No department found on your user. Make sure this Department Admin has
          a department assigned in the backend (User.department) and log in
          again.
        </div>
      )}

      {loadError && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {loadError}
        </div>
      )}

      {/* Layout: sections + details panel */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr,1.3fr] gap-6">
        <div className="space-y-4">
          {renderSection(
            "Student Requests",
            {
              headerBg: "bg-indigo-50",
              pillText: "text-indigo-700",
              pillBg: "bg-indigo-100",
              borderColor: "border-indigo-200",
            },
            studentRequests
          )}

          {renderSection(
            "Lecturer Requests",
            {
              headerBg: "bg-emerald-50",
              pillText: "text-emerald-700",
              pillBg: "bg-emerald-100",
              borderColor: "border-emerald-200",
            },
            lecturerRequests
          )}

          {renderSection(
            "Reviewer Requests",
            {
              headerBg: "bg-pink-50",
              pillText: "text-pink-700",
              pillBg: "bg-pink-100",
              borderColor: "border-pink-200",
            },
            reviewerRequests
          )}
        </div>

        {/* Right – details & decision */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xl p-6 flex flex-col h-full">
          <h2 className="text-base font-bold text-slate-900 mb-4">
            Request Details
          </h2>

          {!selectedRequest ? (
            <p className="text-sm text-slate-500 italic p-4 bg-slate-50 rounded-lg border border-slate-200">
              Select a request from any of the three sections to view applicant
              information and process the request.
            </p>
          ) : (
            <>
              <div className="space-y-3 text-sm text-slate-800 flex-grow">
                <p className="border-b pb-1">
                  <span className="font-semibold text-slate-600">Name:</span>{" "}
                  {selectedRequest.full_name ||
                    [selectedRequest.first_name, selectedRequest.last_name]
                      .filter(Boolean)
                      .join(" ") ||
                    selectedRequest.email}
                </p>

                <p className="border-b pb-1">
                  <span className="font-semibold text-slate-600">Email:</span>{" "}
                  <a
                    href={`mailto:${selectedRequest.email}`}
                    className="text-indigo-600 hover:underline"
                  >
                    {selectedRequest.email}
                  </a>
                </p>

                {selectedRequest.department_name && (
                  <p className="border-b pb-1">
                    <span className="font-semibold text-slate-600">
                      Department:
                    </span>{" "}
                    <span className="text-indigo-600 font-bold">
                      {selectedRequest.department_name}
                    </span>
                  </p>
                )}

                {selectedRequest.role && (
                  <p className="border-b pb-1">
                    <span className="font-semibold text-slate-600">
                      Role requested:
                    </span>{" "}
                    <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-full text-xs font-semibold">
                      {selectedRequest.role}
                    </span>
                  </p>
                )}

                {selectedRequest.notes && (
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="font-semibold text-slate-600 block mb-1">
                      Applicant notes:
                    </span>
                    <p className="italic text-slate-700">
                      {selectedRequest.notes}
                    </p>
                  </div>
                )}

                <p className="text-xs text-slate-500 pt-2">
                  Submitted:{" "}
                  {selectedRequest.created_at_display ||
                    (selectedRequest.created_at
                      ? new Date(
                          selectedRequest.created_at
                        ).toLocaleString()
                      : "")}
                </p>
              </div>

              {statusTab === "PENDING" ? (
                <div className="mt-4 border-t border-slate-200 pt-4 space-y-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Reason / message to applicant (optional for Approve)
                  </label>
                  <textarea
                    rows={3}
                    value={decisionReason}
                    onChange={(e) => setDecisionReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-slate-50"
                    placeholder="Enter message for applicant (required for Rejection)…"
                  />

                  {decisionError && (
                    <p className="text-xs text-red-700 bg-red-100 border border-red-300 rounded-lg px-3 py-2 flex items-center gap-2">
                      <XMarkIcon className="h-4 w-4" /> {decisionError}
                    </p>
                  )}
                  {decisionSuccess && (
                    <p className="text-xs text-emerald-700 bg-emerald-100 border border-emerald-300 rounded-lg px-3 py-2 flex items-center gap-2">
                      <CheckCircleIcon className="h-4 w-4" />{" "}
                      {decisionSuccess}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      disabled={decisionLoading}
                      onClick={() => handleDecision("APPROVE")}
                      className="px-4 py-2 rounded-xl bg-emerald-600 text-sm font-medium text-white shadow-md hover:bg-emerald-500 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      {decisionLoading ? (
                        "Processing..."
                      ) : (
                        <>
                          Approve
                          <CheckCircleIcon className="h-4 w-4" />
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      disabled={decisionLoading}
                      onClick={() => handleDecision("REJECT")}
                      className="px-4 py-2 rounded-xl bg-red-600 text-sm font-medium text-white shadow-md hover:bg-red-500 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      {decisionLoading ? (
                        "Processing..."
                      ) : (
                        <>
                          Reject
                          <XMarkIcon className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 border-t border-slate-200 pt-4 text-xs text-slate-600 space-y-2">
                  {selectedRequest.decision && (
                    <p
                      className={`font-semibold ${
                        selectedRequest.decision === "APPROVED"
                          ? "text-emerald-700"
                          : "text-red-700"
                      }`}
                    >
                      <span className="font-medium text-slate-600">
                        Final decision:
                      </span>{" "}
                      {selectedRequest.decision}
                    </p>
                  )}
                  {selectedRequest.decision &&
                    selectedRequest.decision_reason && (
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="font-medium text-slate-600 block mb-1">
                          Decision reason:
                        </span>
                        <p className="text-slate-700 italic">
                          {selectedRequest.decision_reason}
                        </p>
                      </div>
                    )}
                  {selectedRequest.decided_at_display && (
                    <p className="text-slate-500">
                      <span className="font-medium">Decided at:</span>{" "}
                      {selectedRequest.decided_at_display}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
