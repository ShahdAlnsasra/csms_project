import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { activateAccount } from "../api/api";

export default function ActivateAccount() {
  const { token } = useParams(); // /activate/:token
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!username || !password || !confirm) {
      setError("Please fill in all fields.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await activateAccount(token, password, username.trim());
      console.log("Activate success:", res);
      setSuccess(res.detail || "Account activated successfully.");

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      console.error("Activate failed:", err);
      const msg =
        err.response?.data?.detail ||
        "Activation failed. The link may be invalid or already used.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900 relative overflow-hidden">
      {/* layered soft gradients */}
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
      {/* extra subtle shapes around the card */}
      <div className="absolute left-[12%] top-40 h-32 w-36 bg-gradient-to-br from-indigo-50 via-sky-50 to-emerald-50 rounded-[40%] blur-2xl opacity-70" />
      <div className="absolute right-[10%] bottom-16 h-40 w-40 bg-gradient-to-tr from-emerald-50 via-white to-indigo-50 rounded-[45%] blur-2xl opacity-70" />

      <div className="relative max-w-xl mx-auto px-5 py-10 md:py-16 flex flex-col gap-8">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </button>

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
            Account activation
          </p>
          <h1 className="mt-3 text-3xl md:text-4xl font-bold text-slate-900">
            Set your CSMS password
          </h1>
          <p className="mt-3 text-slate-700 leading-relaxed text-sm md:text-base">
            Choose a username and strong password to complete your account
            activation. You&apos;ll use these details to sign in next time.
          </p>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block mb-2 text-sm font-semibold text-slate-800">
                Username
              </label>
              <input
                type="text"
                className={inputClass}
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-semibold text-slate-800">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className={inputClass}
                  placeholder="Enter a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block mb-2 text-sm font-semibold text-slate-800">
                Confirm password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  className={inputClass}
                  placeholder="Re-enter your password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                >
                  {showConfirm ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-sm">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold shadow-lg shadow-indigo-200 transition"
            >
              {loading ? "Activating..." : "Activate account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
