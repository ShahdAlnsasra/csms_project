import React, { useEffect, useState } from "react";
import { Outlet, useNavigate, NavLink } from "react-router-dom";
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/solid";

const AVATAR_KEY = "csmsUserAvatar";

export function LecturerNavbar() {
  const [user, setUser] = useState(null);
  const [avatar, setAvatar] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const raw = localStorage.getItem("csmsUser");
    if (!raw) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      if (parsed.role !== "LECTURER") {
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

  // ✅ UPDATED: confirm before logout
  const handleLogout = () => {
    const ok = window.confirm("Are you sure you want to log out?");
    if (!ok) return;

    localStorage.removeItem("csmsUser");
    localStorage.removeItem(AVATAR_KEY);
    localStorage.removeItem("authToken");
    sessionStorage.setItem("csmsLogoutMessage", "You have successfully logged out.");
    navigate("/", { replace: true });
  };

  if (!user) return null;

  const firstName = user.first_name || "";
  const lastName = user.last_name || "";
  const fullName = `${firstName} ${lastName}`.trim() || "Lecturer";
  const initials =
    ((firstName?.[0] || "") + (lastName?.[0] || "")).toUpperCase() || "L";

  const navClass = ({ isActive }) =>
    `py-3 px-1 border-b-2 -mb-[1px] text-sm font-medium transition duration-150 ${
      isActive
        ? "border-indigo-600 text-slate-900 font-bold"
        : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
    }`;

  const ProfileButton = () => (
    <button
      type="button"
      onClick={() => navigate("/lecturer/profile")}
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
    <header className="border-b border-slate-200 bg-white shadow-sm sticky top-0 z-20">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-4 md:py-5">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-600 via-sky-600 to-violet-600 flex items-center justify-center text-[10px] font-bold text-white shadow-lg">
            CSMS
          </div>
          <div className="text-base font-bold text-slate-800 hidden sm:block">
            Lecturer Workspace
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-4">
          <div className="hidden md:block text-xs text-slate-500">
            <div className="text-right">Welcome,</div>
            <div className="font-semibold text-slate-800 text-sm">{fullName}</div>
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
        <div className="max-w-6xl mx-auto flex gap-6 px-4">
          <NavLink to="/lecturer/dashboard" end className={navClass}>
            Home
          </NavLink>
          <NavLink to="/lecturer/history" className={navClass}>
            History
          </NavLink>
          <NavLink to="/lecturer/courses" className={navClass}>
            Courses
          </NavLink>

          {/* ✅ MOVED: Profile at the end of navbar */}
          <NavLink to="/lecturer/profile" className={navClass}>
            Profile
          </NavLink>
        </div>
      </nav>
    </header>
  );
}

export default function LecturerLayout() {
  return (
    <div className="bg-[#f8faff] text-slate-900 flex flex-col min-h-screen">
      <LecturerNavbar />
      <main className="flex-grow max-w-6xl mx-auto px-4 py-8 md:py-10 w-full">
        <Outlet />
      </main>
    </div>
  );
}
