import React, { useState } from "react";
import { login } from "../api/api";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const trimmedIdentifier = identifier.trim();
      const user = await login(trimmedIdentifier, password);

      localStorage.setItem("csmsUser", JSON.stringify(user));

      if (user.role === "SYSTEM_ADMIN") {
        navigate("/system-admin");
      } else if (user.role === "DEPARTMENT_ADMIN") {
        navigate("/department-admin/dashboard");
      } else if (user.role === "LECTURER") {
        navigate("/lecturer/dashboard");
      } else {
        navigate("/");
      }
    } catch (err) {
      const msg =
        err.response?.data?.detail || "Login failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-70 blur-[120px] pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 20% 20%, rgba(99,102,241,0.18), transparent 35%), radial-gradient(circle at 80% 10%, rgba(56,189,248,0.18), transparent 35%), radial-gradient(circle at 60% 80%, rgba(52,211,153,0.18), transparent 40%)",
        }}
      />
      <div className="absolute -left-10 bottom-10 h-48 w-48 bg-gradient-to-br from-indigo-100 via-white to-transparent blur-3xl opacity-70" />
      <div className="absolute -right-10 top-10 h-48 w-48 bg-gradient-to-br from-sky-100 via-white to-transparent blur-3xl opacity-70" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.14] mix-blend-multiply"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(99,102,241,0.15) 1px, transparent 0)",
          backgroundSize: "22px 22px",
        }}
      />
      <div
        className="absolute right-10 bottom-12 h-40 w-32 opacity-60"
        style={{
          background:
            "conic-gradient(from 60deg, rgba(99,102,241,0.16), rgba(56,189,248,0.14), rgba(236,72,153,0.12), rgba(99,102,241,0.16))",
          clipPath: "polygon(10% 0, 100% 20%, 90% 100%, 0 80%)",
        }}
      />

      <div className="relative max-w-6xl mx-auto px-5 py-10 md:py-16">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </button>

        <div className="mt-8 grid gap-8 md:grid-cols-[1.05fr,0.95fr] items-center">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl shadow-slate-200/80 relative overflow-hidden">
            <div className="absolute right-4 top-4 h-16 w-16 rounded-full bg-gradient-to-br from-indigo-100 via-white to-sky-50 blur-xl opacity-80" />
            <div
              className="absolute -left-10 bottom-6 h-24 w-40 opacity-60"
              style={{
                background:
                  "conic-gradient(from 140deg, rgba(99,102,241,0.18), rgba(56,189,248,0.14), rgba(16,185,129,0.14), rgba(99,102,241,0.18))",
                clipPath: "polygon(0 25%, 100% 0, 85% 100%, 10% 90%)",
              }}
            />
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-700">
              Welcome back
            </p>
            <h1 className="mt-3 text-3xl md:text-4xl font-bold text-slate-900">
              Sign in to continue your academic work
            </h1>
            <p className="mt-3 text-slate-700 leading-relaxed">
              Access governed curriculum workflows, track approvals, and keep your
              syllabi aligned with departmental standards.
            </p>
            <div className="mt-6 grid gap-3 text-sm text-slate-700">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-indigo-500" />
                Single place for syllabus updates and review comments.
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-sky-500" />
                Clear role-based access for admins, lecturers, and reviewers.
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Secure sessions with guided redirects by role.
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl shadow-slate-200/80 relative overflow-hidden">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-indigo-100 via-white to-emerald-50 blur-2xl opacity-70" />
            <div
              className="absolute -left-12 bottom-0 h-28 w-44 opacity-55"
              style={{
                background:
                  "conic-gradient(from 200deg, rgba(99,102,241,0.16), rgba(56,189,248,0.14), rgba(236,72,153,0.12), rgba(99,102,241,0.16))",
                clipPath: "polygon(0 0, 100% 25%, 80% 100%, 0 85%)",
              }}
            />
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Login</h2>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="block mb-2 text-sm font-semibold text-slate-800">
                  Username or Email
                </label>
                <input
                  type="text"
                  autoComplete="username"
                  className={inputClass}
                  placeholder="Enter your username or email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-semibold text-slate-800">
                  Password
                </label>
                <input
                  type="password"
                  className={inputClass}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  className="text-indigo-700 hover:text-indigo-600 underline underline-offset-4"
                  onClick={() => alert("Forgot password flow will be here later")}
                >
                  Forgot password?
                </button>
                <a
                  href="/signup"
                  className="text-slate-700 hover:text-slate-900"
                >
                  Need an account? Sign up
                </a>
              </div>

              {error && (
                <div className="text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold shadow-lg shadow-indigo-200 transition"
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
