import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
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
      const res = await verifySignupEmail(email, code);
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#4e488a] via-[#5e59b7] via-[#b28dd6] to-[#d946ef] relative overflow-hidden">
      {/* Glow background (same as login/signup) */}
      <div
        className="absolute inset-0 blur-[130px] opacity-70 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.25), transparent 50%), radial-gradient(circle at 70% 80%, rgba(255,255,255,0.25), transparent 50%)",
        }}
      />

      <div className="relative bg-white/20 backdrop-blur-xl border border-white/30 shadow-2xl rounded-3xl px-10 py-12 w-[90%] max-w-md text-white">
        <h2 className="text-3xl font-bold text-center mb-4">
          Verify Your Email
        </h2>
        <p className="text-center text-white/80 mb-6 text-sm">
          We sent a verification code to your email. Please enter it below.
        </p>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Email (prefilled, but editable just in case) */}
          <div>
            <label className="block mb-2 text-white/90 font-medium">Email</label>
            <input
              type="email"
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/60 focus:ring-2 focus:ring-pink-300 outline-none"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Code */}
          <div>
            <label className="block mb-2 text-white/90 font-medium">
              Verification Code
            </label>
            <input
              type="text"
              maxLength={6}
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/60 focus:ring-2 focus:ring-pink-300 outline-none tracking-[0.3em] text-center"
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>

          {/* Error / Success */}
          {error && (
            <div className="text-red-200 bg-red-500/20 border border-red-300/50 rounded-lg px-3 py-2 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="text-emerald-200 bg-emerald-500/20 border border-emerald-300/50 rounded-lg px-3 py-2 text-sm">
              {success}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-white/20 hover:bg-white/30 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl backdrop-blur-lg transition duration-300 shadow-xl"
          >
            {loading ? "Verifying..." : "Verify Email"}
          </button>
        </form>
      </div>
    </div>
  );
}
