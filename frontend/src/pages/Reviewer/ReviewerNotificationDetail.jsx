import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import {
  fetchReviewerEditedSyllabuses,
  fetchReviewerNewSyllabuses,
  fetchReviewerNotificationDetail,
  markReviewerNotificationRead,
} from "../../api/api";

export default function ReviewerNotificationDetail() {
  const { notificationId } = useParams();
  const navigate = useNavigate();
  const [n, setN] = useState(null);
  const [openLoading, setOpenLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");
        const data = await fetchReviewerNotificationDetail(notificationId);
        setN(data);
        await markReviewerNotificationRead(notificationId);
      } catch {
        setError("Notification not found.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [notificationId]);

  if (loading) return <div className="text-sm text-slate-500 py-12 text-center">Loading…</div>;
  if (error || !n) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error || "Not found."}
      </div>
    );
  }

  const handleOpenSyllabusDetails = async () => {
    const user = JSON.parse(localStorage.getItem("csmsUser") || "null");
    if (!user?.id || !n?.course) return;
    try {
      setOpenLoading(true);
      const [newItems, editedItems] = await Promise.all([
        fetchReviewerNewSyllabuses({ reviewerId: user.id }),
        fetchReviewerEditedSyllabuses({ reviewerId: user.id }),
      ]);
      const all = [...(Array.isArray(newItems) ? newItems : []), ...(Array.isArray(editedItems) ? editedItems : [])];
      const forCourse = all.filter((item) => String(item.course) === String(n.course));
      if (!forCourse.length) {
        alert("No pending syllabus found for this course.");
        return;
      }
      const sorted = [...forCourse].sort(
        (a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0)
      );
      const target = sorted[0];
      if (Array.isArray(editedItems) && editedItems.some((x) => String(x.id) === String(target.id))) {
        navigate(`/reviewer/edited-syllabuses/${target.id}`);
      } else {
        navigate(`/reviewer/new-syllabuses/${target.id}`);
      }
    } catch {
      alert("Could not open syllabus details.");
    } finally {
      setOpenLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <button
        type="button"
        onClick={() => navigate("/reviewer/notifications")}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to notifications
      </button>

      <div className="rounded-3xl bg-white border border-slate-200 shadow-xl px-6 py-8 space-y-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-600">
          {n.notification_type || "Notice"}
        </p>
        <h1 className="text-2xl font-bold text-slate-900">{n.title}</h1>
        <div className="flex flex-wrap gap-3 text-xs text-slate-600">
          <span className="rounded-full bg-slate-100 px-3 py-1 font-medium">
            {n.created_at ? new Date(n.created_at).toLocaleString() : ""}
          </span>
          {n.sender_name && (
            <span className="rounded-full bg-indigo-50 border border-indigo-100 px-3 py-1 font-medium text-indigo-900">
              From: {n.sender_name}
            </span>
          )}
          {n.course_code && (
            <span className="rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1 font-medium text-emerald-900">
              Course: {n.course_code}
            </span>
          )}
        </div>
        <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{n.body}</p>
        {n.course && (
          <div className="pt-2">
            <button
              type="button"
              onClick={handleOpenSyllabusDetails}
              disabled={openLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 shadow-lg shadow-indigo-200"
            >
              {openLoading ? "Opening..." : "Open syllabus details"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
