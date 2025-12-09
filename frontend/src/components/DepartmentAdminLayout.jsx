import React, { useEffect, useState } from "react";
import { Outlet, useNavigate, NavLink } from "react-router-dom";
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/solid";

export function DepartmentAdminNavbar() {
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
      if (parsed.role !== "DEPARTMENT_ADMIN") {
        navigate("/login", { replace: true });
        return;
      }
      setUser(parsed);
    } catch {
      localStorage.removeItem("csmsUser");
      navigate("/login", { replace: true });
    }

    const storedAvatar = localStorage.getItem("csmsUserAvatar");
    setAvatar(storedAvatar);

    const handleStorageChange = () => {
      setAvatar(localStorage.getItem("csmsUserAvatar"));
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [navigate]);

  const handleLogout = () => {
    const confirmed = window.confirm("Are you sure you want to log out?");
    if (!confirmed) return;
    localStorage.removeItem("csmsUser");
    localStorage.removeItem("csmsUserAvatar");
    navigate("/login");
  };

  if (!user) return null;

  const firstName = user.first_name || "";
  const lastName = user.last_name || "";
  const fullName = `${firstName} ${lastName}`.trim() || "Department Admin";

  const initials =
    ((firstName?.[0] || "") + (lastName?.[0] || "")).toUpperCase() || "DA";

  const navClass = ({ isActive }) =>
    `py-3 px-1 border-b-2 -mb-[1px] text-sm font-medium transition duration-150 ${
      isActive
        ? "border-indigo-600 text-slate-900 font-bold"
        : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
    }`;

  const ProfileButton = () => (
    <button
      type="button"
      onClick={() => navigate("/department-admin/profile")}
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
        {/* Logo + title */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-[10px] font-bold text-white shadow-lg">
            CSMS
          </div>
          <div className="text-base font-bold text-slate-800 hidden sm:block">
            Department Admin Workspace
          </div>
        </div>

        {/* Right side: welcome + profile + logout */}
        <div className="flex items-center gap-3 md:gap-4">
          <div className="hidden md:block text-xs text-slate-500">
            <div className="text-right">Welcome,</div>
            <div className="font-semibold text-slate-800 text-sm">
              {fullName}
            </div>
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

      {/* Navbar tabs */}
      <nav className="border-t border-slate-100 bg-white">
        <div className="max-w-6xl mx-auto flex gap-6 px-4">
          <NavLink to="/department-admin/dashboard" end className={navClass}>
            Dashboard
          </NavLink>
          <NavLink to="/department-admin/profile" className={navClass}>
            Profile
          </NavLink>
          <NavLink to="/department-admin/requests" className={navClass}>
           Requests
        </NavLink>

          {/* עוד טאבים בעתיד: Courses, Syllabuses, etc. */}
        </div>
      </nav>
    </header>
  );
}

export default function DepartmentAdminLayout() {
  return (
    <div className="bg-[#f8faff] text-slate-900 flex flex-col flex-1 min-h-screen">
      <DepartmentAdminNavbar />
      <main className="flex-grow max-w-6xl mx-auto px-4 py-8 md:py-10 w-full">
        <Outlet />
      </main>
    </div>
  );
}
