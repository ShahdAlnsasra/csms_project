import React, { useEffect, useRef, useState } from "react";
import { Outlet, useNavigate, NavLink } from "react-router-dom";
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/solid";
import { Bell } from "lucide-react";
import {
  fetchStudentNotifications,
  fetchStudentUnreadCount,
} from "../api/api";

const AVATAR_KEY = "csmsUserAvatar";

export function StudentNavbar() {
  const [user, setUser] = useState(null);
  const [avatar, setAvatar] = useState(null);
  const [bellOpen, setBellOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [recent, setRecent] = useState([]);
  const navigate = useNavigate();
  const bellWrapRef = useRef(null);

  useEffect(() => {
    const raw = localStorage.getItem("csmsUser");
    if (!raw) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      if (parsed.role !== "STUDENT") {
        navigate("/login", { replace: true });
        return;
      }
      setUser(parsed);
    } catch {
      localStorage.removeItem("csmsUser");
      navigate("/login", { replace: true });
    }

    const storedAvatar = localStorage.getItem(AVATAR_KEY);
    setAvatar(storedAvatar);

    const handleStorageChange = () => {
      setAvatar(localStorage.getItem(AVATAR_KEY));
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [navigate]);

  async function refreshNotifications() {
    try {
      const [countRes, listRes] = await Promise.all([
        fetchStudentUnreadCount(),
        fetchStudentNotifications(),
      ]);
      setUnread(countRes?.unread ?? 0);
      setRecent(Array.isArray(listRes) ? listRes.slice(0, 8) : []);
    } catch {
      setUnread(0);
      setRecent([]);
    }
  }

  useEffect(() => {
    if (!user) return;
    refreshNotifications();
    const t = setInterval(refreshNotifications, 60000);
    return () => clearInterval(t);
  }, [user]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        bellWrapRef.current &&
        !bellWrapRef.current.contains(e.target)
      ) {
        setBellOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    const ok = window.confirm("Are you sure you want to log out?");
    if (!ok) return;

    localStorage.removeItem("csmsUser");
    localStorage.removeItem(AVATAR_KEY);
    navigate("/login");
  };

  if (!user) return null;

  const firstName = user.first_name || "";
  const lastName = user.last_name || "";
  const fullName = `${firstName} ${lastName}`.trim() || "Student";
  const initials =
    ((firstName?.[0] || "") + (lastName?.[0] || "")).toUpperCase() || "S";

  const navClass = ({ isActive }) =>
    `py-3 px-1 border-b-2 -mb-[1px] text-sm font-medium transition duration-150 ${
      isActive
        ? "border-indigo-600 text-slate-900 font-bold"
        : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
    }`;

  const ProfileButton = () => (
    <button
      type="button"
      onClick={() => navigate("/student/profile")}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-300 bg-white hover:bg-slate-50 transition font-semibold text-slate-700 text-sm shadow-sm"
      aria-label="View Profile"
    >
      {avatar ? (
        <img
          src={avatar}
          alt="Profile"
          className="h-7 w-7 rounded-full object-cover"
        />
      ) : (
        <div className="h-7 w-7 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold text-white shadow-inner">
          {initials}
        </div>
      )}
      <span className="hidden lg:inline text-sm font-medium text-slate-800">
        Profile
      </span>
    </button>
  );

  return (
    <header className="border-b border-slate-200 bg-white shadow-sm sticky top-0 z-30">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-4 md:py-5">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-600 via-sky-600 to-emerald-600 flex items-center justify-center text-[10px] font-bold text-white shadow-lg">
            CSMS
          </div>
          <div className="text-base font-bold text-slate-800 hidden sm:block">
            Student Workspace
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden md:block text-xs text-slate-500 text-right">
            <div>Welcome,</div>
            <div className="font-semibold text-slate-800 text-sm">{fullName}</div>
          </div>

          <div className="relative" ref={bellWrapRef}>
            <button
              type="button"
              onClick={() => {
                setBellOpen((o) => !o);
                refreshNotifications();
              }}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm hover:bg-slate-50 transition"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5 text-slate-700" />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-[10px] font-bold text-white flex items-center justify-center border border-white">
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </button>

            {bellOpen && (
              <div className="absolute right-0 mt-2 w-[min(100vw-2rem,22rem)] rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-300/40 overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                  <span className="text-sm font-semibold text-slate-900">
                    Notifications
                  </span>
                  <button
                    type="button"
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-500"
                    onClick={() => navigate("/student/notifications")}
                  >
                    View all
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {recent.length === 0 ? (
                    <div className="px-4 py-6 text-sm text-slate-500 text-center">
                      You&apos;re all caught up.
                    </div>
                  ) : (
                    recent.map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => {
                          setBellOpen(false);
                          navigate(`/student/notifications/${n.id}`);
                        }}
                        className={`w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-indigo-50/60 transition ${
                          !n.read_at ? "bg-indigo-50/40" : ""
                        }`}
                      >
                        <p className="text-xs font-semibold text-slate-900 line-clamp-2">
                          {n.title}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1">
                          {n.created_at
                            ? new Date(n.created_at).toLocaleString()
                            : ""}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <ProfileButton />

          <button
            type="button"
            onClick={handleLogout}
            className="px-3 py-1.5 text-sm rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold shadow-md transition flex items-center gap-2"
          >
            <ArrowRightOnRectangleIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      <nav className="border-t border-slate-100 bg-white">
        <div className="max-w-6xl mx-auto flex gap-6 px-4 flex-wrap">
          <NavLink to="/student/dashboard" end className={navClass}>
            Home
          </NavLink>
          <NavLink to="/student/courses" className={navClass}>
            My Courses
          </NavLink>
          <NavLink to="/student/course-diagram" className={navClass}>
            Curriculum Diagram
          </NavLink>
          <NavLink to="/student/notifications" className={navClass}>
            Notifications
          </NavLink>
          <NavLink to="/student/profile" className={navClass}>
            Profile
          </NavLink>
        </div>
      </nav>
    </header>
  );
}

export default function StudentLayout() {
  return (
    <div className="bg-[#f8faff] text-slate-900 flex flex-col min-h-screen">
      <StudentNavbar />
      <main className="flex-grow max-w-6xl mx-auto px-4 py-8 md:py-10 w-full">
        <Outlet />
      </main>
    </div>
  );
}
