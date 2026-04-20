import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { requestPasswordReset } from "../api/api";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const inputClass =
    "w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition";

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError("Please enter your email.");
      return;
    }

    setLoading(true);
    try {
      const res = await requestPasswordReset(trimmed);
      setSuccess(
        res?.detail ||
          "If an account with this email exists, we sent a reset link."
      );
    } catch (err) {
      const msg =
        err?.response?.data?.detail || "Could not process reset request.";
      setError(Array.isArray(msg) ? msg.join(" ") : String(msg));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900">
      <div className="relative max-w-xl mx-auto px-5 py-10 md:py-16 flex flex-col gap-8">
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </button>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl shadow-slate-200/80">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-700">
            Password reset
          </p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">
            Forgot your password?
          </h1>
          <p className="mt-3 text-slate-700 leading-relaxed text-sm md:text-base">
            Enter your verified email. If an account exists, we will send you a
            secure one-time reset link.
          </p>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block mb-2 text-sm font-semibold text-slate-800">
                Email address
              </label>
              <input
                type="email"
                autoComplete="email"
                className={inputClass}
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
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
              {loading ? "Sending link..." : "Send reset link"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
