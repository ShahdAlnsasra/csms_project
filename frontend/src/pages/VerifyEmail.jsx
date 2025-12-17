import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { verifySignupEmail } from "../api/api";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // get email from URL: /verify-email?email=...
  const emailFromUrl = searchParams.get("email") || "";

  const [email, setEmail] = useState(emailFromUrl);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await verifySignupEmail(email.trim(), code.trim());
      console.log("Verify email success:", res);
      setSuccess(res.detail || "Email verified successfully.");

      // after a short delay, go to login
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      console.error("Verify email failed:", err);
      const msg =
        err.response?.data?.detail ||
        "Verification failed. Please check the code and try again.";
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
      <div className="absolute left-[10%] top-32 h-32 w-32 bg-gradient-to-br from-indigo-50 via-sky-50 to-emerald-50 rounded-[40%] blur-2xl opacity-70" />
      <div className="absolute right-[8%] bottom-24 h-36 w-36 bg-gradient-to-tr from-emerald-50 via-white to-indigo-50 rounded-[45%] blur-2xl opacity-70" />

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
            Email verification
          </p>
          <h1 className="mt-3 text-3xl md:text-4xl font-bold text-slate-900">
            Confirm your CSMS account
          </h1>
          <p className="mt-3 text-slate-700 leading-relaxed text-sm md:text-base">
            We&apos;ve sent a 6-digit code to your email. Enter it below to
            verify your address and continue to login.
          </p>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block mb-2 text-sm font-semibold text-slate-800">
                Email
              </label>
              <input
                type="email"
                className={inputClass}
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-semibold text-slate-800">
                Verification code
              </label>
              <input
                type="text"
                maxLength={6}
                className={`${inputClass} tracking-[0.3em] text-center`}
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
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
              {loading ? "Verifying..." : "Verify email"}
            </button>

            <p className="text-xs text-slate-500 text-center mt-2">
              Didn&apos;t get the email yet? Please check your spam folder or
              contact your department admin.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
