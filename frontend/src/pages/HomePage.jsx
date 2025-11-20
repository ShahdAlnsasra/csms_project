import React from "react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4e488a] via-[#5e59b7] via-[#b28dd6] to-[#d946ef] relative overflow-hidden">

      {/* GLASS NAVBAR */}
      <nav className="w-full fixed top-0 z-50 bg-white/10 backdrop-blur-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">

          {/* LOGO */}
          <div className="text-2xl font-bold text-white tracking-wide">
            CSMS
          </div>

          {/* NAV LINKS */}
          <div className="hidden md:flex items-center space-x-10 font-medium">

            <a className="text-white/90 hover:text-white transition">
              About
            </a>

            <a className="text-white/90 hover:text-white transition">
              Features
            </a>

   <a href="/login" className="text-white/90 hover:text-white transition">Login</a>
<a href="/signup" className="text-white hover:text-pink-200 font-semibold underline-offset-4 hover:underline">Sign Up</a>

          </div>
        </div>
      </nav>

      {/* SOFT GLOW BEHIND CONTENT */}
      <div className="absolute inset-0 blur-[140px] opacity-70 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 30% 20%, rgba(167,139,250,0.35), transparent 50%), radial-gradient(circle at 70% 80%, rgba(236,72,153,0.35), transparent 50%)"
        }}
      />

      {/* HERO SECTION */}
      <section className="relative pt-40 pb-32 text-center text-white px-6">
        <h1 className="text-6xl font-extrabold mb-6 leading-tight drop-shadow-lg">
          Curriculum & Syllabus <br /> Management System
        </h1>

        <p className="text-xl text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed">
          A modern platform powered by AI to streamline academic workflows,
          automate compliance checks, and simplify communication between faculty and institutions.
        </p>

        <button className="px-8 py-4 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-xl shadow-xl backdrop-blur-lg transition duration-300">
          Explore Features
        </button>
      </section>
    </div>
  );
}
