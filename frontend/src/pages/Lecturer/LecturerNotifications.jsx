import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck } from "lucide-react";
import {
  fetchLecturerNotifications,
  markAllLecturerNotificationsRead,
  markLecturerNotificationRead,
} from "../../api/api";

export default function LecturerNotifications() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");
        const data = await fetchLecturerNotifications();
        setItems(Array.isArray(data) ? data : []);
      } catch {
        setError("Could not load notifications.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const openDetail = async (id) => {
    try {
      await markLecturerNotificationRead(id);
    } catch {
      // non-blocking
    }
    navigate(`/lecturer/notifications/${id}`);
  };

  const markAllRead = async () => {
    try {
      setMarkingAll(true);
      await markAllLecturerNotificationsRead();
      setItems((prev) => prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
    } catch {
      // non-blocking
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Bell className="h-10 w-10 text-indigo-600" />
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">Notifications</h1>
            <p className="mt-1 text-sm text-slate-600">
              Review feedback and workflow updates on your syllabuses.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={markAllRead}
          disabled={markingAll || items.every((n) => !!n.read_at)}
          className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-white px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 disabled:opacity-50"
          title="Mark all as read"
          aria-label="Mark all as read"
        >
          <CheckCheck className="h-4 w-4" />
          {markingAll ? "Marking..." : "Mark all read"}
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-12 text-center text-slate-600 text-sm">
          No notifications yet.
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => openDetail(n.id)}
                className={`w-full text-left rounded-2xl border px-5 py-4 transition shadow-sm ${
                  n.read_at
                    ? "border-slate-200 bg-white hover:border-indigo-100"
                    : "border-indigo-200 bg-indigo-50/60 hover:bg-indigo-50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{n.title}</p>
                    <p className="mt-1 text-sm text-slate-600 line-clamp-2">
                      {n.body}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500">
                      <span>
                        {n.created_at
                          ? new Date(n.created_at).toLocaleString()
                          : ""}
                      </span>
                      {n.course_code && (
                        <span className="rounded-full bg-white/80 border border-slate-200 px-2 py-0.5 font-medium text-slate-700">
                          {n.course_code}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    {!n.read_at && (
                      <>
                        <span className="h-2 w-2 rounded-full bg-indigo-500 mt-0.5" />
                      </>
                    )}
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
