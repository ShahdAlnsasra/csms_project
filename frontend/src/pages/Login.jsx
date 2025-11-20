import React, { useState } from "react";
import { login } from "../api/api";

export default function Login() {
  const [identifier, setIdentifier] = useState(""); // email for now
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Call backend
      const user = await login(identifier, password);
      console.log("Logged in user:", user);

      // TODO later: save user in context / localStorage & navigate by role
      // e.g. navigate("/dashboard");
      alert(`Welcome, ${user.first_name} ${user.last_name} (${user.role})`);
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.detail || "Login failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#4e488a] via-[#5e59b7] via-[#b28dd6] to-[#d946ef] relative overflow-hidden">
      {/* Glow background */}
      <div
        className="absolute inset-0 blur-[130px] opacity-70 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.25), transparent 50%), radial-gradient(circle at 70% 80%, rgba(255,255,255,0.25), transparent 50%)",
        }}
      />

      {/* Login Card */}
      <div className="relative bg-white/20 backdrop-blur-xl border border-white/30 shadow-2xl rounded-3xl px-10 py-12 w-[90%] max-w-md text-white">
        <h2 className="text-4xl font-bold text-center mb-8">
          Welcome Back
        </h2>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Username or Email */}
          <div>
            <label className="block mb-2 text-white/90 font-medium">
              Email
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/60 focus:ring-2 focus:ring-pink-300 outline-none"
              placeholder="Enter your email"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
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
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Forgot password */}
          <div className="text-right">
            <button
              type="button"
              className="text-white/80 hover:text-white underline underline-offset-4 text-sm"
              onClick={() => alert("Forgot password flow will be here later")}
            >
              Forgot password?
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="text-red-200 bg-red-500/20 border border-red-300/50 rounded-lg px-3 py-2 text-sm">
              {error}
            </div>
          )}

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-white/20 hover:bg-white/30 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl backdrop-blur-lg transition duration-300 shadow-xl"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
