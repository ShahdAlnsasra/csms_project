import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { activateAccount } from "../api/api";

export default function ActivateAccount() {
  const { token } = useParams();       // /activate/:token
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!username ||!password || !confirm) {
      setError("Please fill in all fields.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await activateAccount(token, password, username);
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
          Activate Your Account
        </h2>
        <p className="text-center text-white/80 mb-6 text-sm">
          Set your password to complete your account activation.
        </p>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Username */}
         <div>
            <label className="block mb-2 text-white/90 font-medium">
              Username
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/60 focus:ring-2 focus:ring-pink-300 outline-none"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
        </div>


          {/* Password */}
          <div>
            <label className="block mb-2 text-white/90 font-medium">
              Password
            </label>
            <input
              type="password"
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/60 focus:ring-2 focus:ring-pink-300 outline-none"
              placeholder="Enter a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block mb-2 text-white/90 font-medium">
              Confirm Password
            </label>
            <input
              type="password"
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/60 focus:ring-2 focus:ring-pink-300 outline-none"
              placeholder="Re-enter your password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
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
            {loading ? "Activating..." : "Activate Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
