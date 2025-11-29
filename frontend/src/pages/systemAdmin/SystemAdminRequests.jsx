// frontend/src/pages/systemAdmin/SystemAdminRequests.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  fetchAdminSignupRequests,
  decideOnSignupRequest,
} from "../../api/api";
import { UserPlusIcon, MagnifyingGlassIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon, XMarkIcon } from "@heroicons/react/24/solid";

export default function SystemAdminRequests() {
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

  // טעינת בקשות לפי הסטטוס הנוכחי
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setLoadError("");
        setSelectedRequest(null);
        setDecisionReason("");
        setDecisionError("");
        setDecisionSuccess("");

        const data = await fetchAdminSignupRequests(statusTab);
        setRequests(data || []);
      } catch (err) {
        console.error("Failed to load signup requests:", err);
        setLoadError("Failed to load signup requests.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [statusTab]);

  // סינון לפי חיפוש (שם / מחלקה)
  const filteredRequests = useMemo(() => {
    if (!search.trim()) return requests;
    const q = search.toLowerCase();
    return requests.filter((r) => {
      const name = (r.full_name || r.name || "").toLowerCase();
      const dept =
        (r.department_name || r.department || r.department_code || "").toLowerCase();
      return name.includes(q) || dept.includes(q);
    });
  }, [search, requests]);

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
      await decideOnSignupRequest(selectedRequest.id, decision, decisionReason);

      // רענון הרשימה אחרי החלטה
      const data = await fetchAdminSignupRequests(statusTab);
      setRequests(data || []);

      setDecisionSuccess(
        decision === "APPROVE"
          ? "Request approved successfully. Email will be sent to the Department Admin."
          : "Request rejected successfully. Email will be sent to the Department Admin."
      );
      // אם זה היה ב-PENDING – נעלים את הפאנל כשאין יותר רשומה זו
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

  return (
    <div className="space-y-6">
      {/* 🌟 כותרת הדף */}
      <div className="flex items-center gap-3">
        <UserPlusIcon className="h-10 w-10 text-indigo-600" />
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            Department Admin Signup Requests
          </h1>
          <p className="mt-1 text-sm text-slate-600 max-w-2xl">
            Review, approve or reject applications from users seeking Department Admin status.
          </p>
        </div>
      </div>

      {/* 🌟 טאבים + שורת כלים (מיקום חדש לחיפוש) */}
      <div className="flex flex-col gap-4"> 
        {/* שורה 1: טאבים */}
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
                className={`px-4 py-1.5 rounded-full transition font-semibold ${
                  active
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-300/50"
                    : "text-slate-600 hover:bg-slate-200"
                }`}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>

        {/* 🌟 שורה 2: חיפוש + כפתור נקי (מוזז למטה, מיושר לשמאל) */}
        <div className="flex gap-2 w-full md:w-80">
          <div className="relative flex-grow">
            <MagnifyingGlassIcon className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Name or Department..."
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

      {/* טבלה + פאנל פרטים */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr,1.3fr] gap-6">
        {/* טבלה */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 text-xs uppercase tracking-[0.2em] font-semibold text-slate-700 bg-slate-50">
            {statusTab} Requests List
          </div>

          {loadError && (
            <div className="px-4 py-3 text-sm text-red-600 bg-red-50 border-b border-red-100">
              {loadError}
            </div>
          )}

          {loading ? (
            <div className="p-6 text-sm text-slate-500">Loading requests…</div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">
              No {statusTab.toLowerCase()} requests found.
            </div>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3">Name</th>
                  <th className="text-left px-4 py-3 hidden sm:table-cell">Email</th>
                  <th className="text-left px-4 py-3">Department</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">Submitted at</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((req) => (
                  <tr
                    key={req.id}
                    onClick={() => handleSelectRequest(req)}
                    className={`border-t border-slate-100 cursor-pointer transition ${
                      selectedRequest && selectedRequest.id === req.id
                        ? "bg-indigo-100/50 hover:bg-indigo-100 border-indigo-300"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <td className="px-4 py-3 text-slate-800 font-medium">
                      {req.full_name ||
                        [req.first_name, req.last_name].filter(Boolean).join(" ") ||
                        req.email}
                    </td>
                    <td className="px-4 py-3 text-slate-700 hidden sm:table-cell">{req.email}</td>
                    <td className="px-4 py-3 text-indigo-600 font-medium">
                      {req.department_name || req.department}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs hidden md:table-cell">
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

        {/* פאנל פרטי בקשה + החלטה */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xl p-6 flex flex-col h-full">
          <h2 className="text-base font-bold text-slate-900 mb-4">
            Request Details
          </h2>

          {!selectedRequest ? (
            <p className="text-sm text-slate-500 italic p-4 bg-slate-50 rounded-lg border border-slate-200">
              Select a request from the list to view applicant information and process the request.
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
                  <a href={`mailto:${selectedRequest.email}`} className="text-indigo-600 hover:underline">
                      {selectedRequest.email}
                  </a>
                </p>
                <p className="border-b pb-1">
                  <span className="font-semibold text-slate-600">Department:</span>{" "}
                  <span className="text-indigo-600 font-bold">{selectedRequest.department_name || selectedRequest.department}</span>
                </p>
                {selectedRequest.role && (
                  <p className="border-b pb-1">
                    <span className="font-semibold text-slate-600">Role Requested:</span>{" "}
                    <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-semibold">{selectedRequest.role}</span>
                  </p>
                )}
                {selectedRequest.notes && (
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="font-semibold text-slate-600 block mb-1">Applicant Notes:</span>{" "}
                    <p className="italic text-slate-700">{selectedRequest.notes}</p>
                  </div>
                )}
                <p className="text-xs text-slate-500 pt-2">
                  Submitted:{" "}
                  {selectedRequest.created_at_display ||
                  (selectedRequest.created_at
                    ? new Date(selectedRequest.created_at).toLocaleString()
                    : "")}
                </p>
              </div>

              {/* תיבת סיבה + כפתורי החלטה – רק כשבטאב PENDING */}
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
                    placeholder="Enter message for applicant (required for Rejection)..."
                  />

                  {decisionError && (
                    <p className="text-xs text-red-700 bg-red-100 border border-red-300 rounded-lg px-3 py-2 flex items-center gap-2">
                       <XMarkIcon className="h-4 w-4" /> {decisionError}
                    </p>
                  )}
                  {decisionSuccess && (
                    <p className="text-xs text-emerald-700 bg-emerald-100 border border-emerald-300 rounded-lg px-3 py-2 flex items-center gap-2">
                       <CheckCircleIcon className="h-4 w-4" /> {decisionSuccess}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      disabled={decisionLoading}
                      onClick={() => handleDecision("APPROVE")}
                      className="px-4 py-2 rounded-xl bg-emerald-600 text-sm font-medium text-white shadow-md hover:bg-emerald-500 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      {decisionLoading ? "Processing..." : <>Approve <CheckCircleIcon className="h-4 w-4" /></>}
                    </button>
                    <button
                      type="button"
                      disabled={decisionLoading}
                      onClick={() => handleDecision("REJECT")}
                      className="px-4 py-2 rounded-xl bg-red-600 text-sm font-medium text-white shadow-md hover:bg-red-500 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      {decisionLoading ? "Processing..." : <>Reject <XMarkIcon className="h-4 w-4" /></>}
                    </button>
                  </div>
                </div>
              ) : (
                // בטאבים Approved/Rejected – רק מציגים מידע
                <div className="mt-4 border-t border-slate-200 pt-4 text-xs text-slate-600 space-y-2">
                  {selectedRequest.decision && (
                    <p className={`font-semibold ${selectedRequest.decision === 'APPROVED' ? 'text-emerald-700' : 'text-red-700'}`}>
                      <span className="font-medium text-slate-600">Final Decision:</span>{" "}
                      {selectedRequest.decision}
                    </p>
                  )}
                  {selectedRequest.decision && selectedRequest.decision_reason && (
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="font-medium text-slate-600 block mb-1">Decision Reason:</span>
                        <p className="text-slate-700 italic">{selectedRequest.decision_reason}</p>
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