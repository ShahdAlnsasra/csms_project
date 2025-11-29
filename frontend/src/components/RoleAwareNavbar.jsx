// frontend/src/components/RoleAwareNavbar.jsx
import React from "react";
import { SystemAdminNavbar } from "./SystemAdminLayout";

// Navbar פשוט לכל מי שלא System Admin / לא מחובר
function PublicNavbar() {
  return (
    <header className="w-full bg-white/80 backdrop-blur border-b border-slate-200">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <div className="text-xl font-semibold text-slate-900">CSMS</div>
        <nav className="flex items-center gap-4 text-sm text-slate-700">
          <a href="/" className="hover:text-indigo-600">
            Home
          </a>
          <a href="/login" className="hover:text-indigo-600">
            Login
          </a>
          <a href="/signup" className="hover:text-indigo-600">
            Signup
          </a>
        </nav>
      </div>
    </header>
  );
}

export default function RoleAwareNavbar() {
  // שימי לב – אותו key כמו בשאר המערכת
  const storedUser = JSON.parse(localStorage.getItem("csmsUser") || "null");
  const role = storedUser?.role;

  if (role === "SYSTEM_ADMIN") {
    return <SystemAdminNavbar />;
  }

  return <PublicNavbar />;
}
