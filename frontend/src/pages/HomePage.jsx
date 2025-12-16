// import React from "react";

// export default function Home() {
//   return (
//     <div className="min-h-screen bg-gradient-to-br from-[#4e488a] via-[#5e59b7] via-[#b28dd6] to-[#d946ef] relative overflow-hidden">

//       {/* GLASS NAVBAR */}
//       <nav className="w-full fixed top-0 z-50 bg-white/10 backdrop-blur-lg border-b border-white/20">
//         <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">

//           {/* LOGO */}
//           <div className="text-2xl font-bold text-white tracking-wide">
//             CSMS
//           </div>

//           {/* NAV LINKS */}
//           <div className="hidden md:flex items-center space-x-10 font-medium">

//             <a className="text-white/90 hover:text-white transition">
//               About
//             </a>

//             <a className="text-white/90 hover:text-white transition">
//               Features
//             </a>

//    <a href="/login" className="text-white/90 hover:text-white transition">Login</a>
// <a href="/signup" className="text-white hover:text-pink-200 font-semibold underline-offset-4 hover:underline">Sign Up</a>

//           </div>
//         </div>
//       </nav>

//       {/* SOFT GLOW BEHIND CONTENT */}
//       <div className="absolute inset-0 blur-[140px] opacity-70 pointer-events-none"
//         style={{
//           background:
//             "radial-gradient(circle at 30% 20%, rgba(167,139,250,0.35), transparent 50%), radial-gradient(circle at 70% 80%, rgba(236,72,153,0.35), transparent 50%)"
//         }}
//       />

//       {/* HERO SECTION */}
//       <section className="relative pt-40 pb-32 text-center text-white px-6">
//         <h1 className="text-6xl font-extrabold mb-6 leading-tight drop-shadow-lg">
//           Curriculum & Syllabus <br /> Management System
//         </h1>

//         <p className="text-xl text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed">
//           A modern platform powered by AI to streamline academic workflows,
//           automate compliance checks, and simplify communication between faculty and institutions.
//         </p>

//         <button className="px-8 py-4 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-xl shadow-xl backdrop-blur-lg transition duration-300">
//           Explore Features
//         </button>
//       </section>
//     </div>
//   );
// }


import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const stats = [
  { label: "Departments onboarded", value: "12+" },
  { label: "Syllabi managed", value: "480" },
  { label: "Active faculty accounts", value: "320" },
];

const featureCards = [
  {
    title: "Structured governance",
    body: "Role-based access, approvals, and audit-friendly history for every syllabus.",
    badge: "Governance",
    accent: "indigo",
  },
  {
    title: "Academic clarity",
    body: "Curriculum visuals, prerequisites, and semester planning in one shared view.",
    badge: "Clarity",
    accent: "sky",
  },
  {
    title: "Quality and compliance",
    body: "Templates and checks that keep courses aligned with institutional standards.",
    badge: "Quality",
    accent: "emerald",
  },
  {
    title: "Student-ready outputs",
    body: "Publish clear course expectations, assessments, and outcomes without the chaos.",
    badge: "Students",
    accent: "amber",
  },
  {
    title: "Built for collaboration",
    body: "Lecturers, reviewers, and admins work together with transparent status updates.",
    badge: "Collaboration",
    accent: "violet",
  },
  {
    title: "Secure & scalable",
    body: "Modern stack, granular permissions, and data organized by department and term.",
    badge: "Security",
    accent: "rose",
  },
];

export default function Home() {
  const location = useLocation();
  const [logoutMessage, setLogoutMessage] = useState("");

  useEffect(() => {
    const stored = sessionStorage.getItem("csmsLogoutMessage");
    if (stored) {
      setLogoutMessage(stored);
      sessionStorage.removeItem("csmsLogoutMessage");
    } else if (location.state?.message) {
      setLogoutMessage(location.state.message);
    }
  }, [location.state]);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900">
      {logoutMessage && (
        <div className="bg-emerald-50 border-b border-emerald-100 text-emerald-800 text-sm">
          <div className="max-w-6xl mx-auto px-5 py-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {logoutMessage}
          </div>
        </div>
      )}
      {/* subtle pattern overlay */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.18] mix-blend-multiply"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(99,102,241,0.18) 1px, transparent 0)",
          backgroundSize: "22px 22px",
        }}
      />
      {/* Nav */}
      <nav className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/90 backdrop-blur-md shadow-sm">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="text-xl font-semibold tracking-tight text-slate-900">
            CSMS
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-700">
            <button
              type="button"
              onClick={() => scrollToSection("about")}
              className="hover:text-slate-900 transition-colors"
            >
              About
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("features")}
              className="hover:text-slate-900 transition-colors"
            >
              Features
            </button>
            <a
              href="/login"
              className="hover:text-slate-900 transition-colors"
            >
              Login
            </a>
            <a
              href="/signup"
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition"
            >
              Sign up
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-70 blur-[120px] pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 20% 20%, rgba(99,102,241,0.25), transparent 35%), radial-gradient(circle at 80% 10%, rgba(56,189,248,0.2), transparent 35%), radial-gradient(circle at 50% 80%, rgba(52,211,153,0.2), transparent 40%)",
          }}
        />
        <div className="absolute -right-24 top-10 h-64 w-64 bg-gradient-to-br from-indigo-100 via-sky-50 to-transparent blur-3xl opacity-80" />
        <div className="absolute -left-24 bottom-0 h-64 w-64 bg-gradient-to-br from-emerald-100 via-white to-transparent blur-3xl opacity-80" />
        <div
          className="absolute left-[-60px] top-12 h-40 w-72 opacity-60"
          style={{
            background:
              "conic-gradient(from 120deg, rgba(99,102,241,0.15), rgba(56,189,248,0.12), rgba(16,185,129,0.12), rgba(99,102,241,0.15))",
            clipPath: "polygon(0 0, 100% 15%, 85% 100%, 10% 90%)",
          }}
        />
        <div className="max-w-6xl mx-auto px-5 py-16 md:py-20 relative">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-700 bg-indigo-50 rounded-full px-3 py-1 border border-indigo-100 mb-4">
              Academic-grade platform
            </p>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight text-slate-900">
              Curriculum &amp; Syllabus Management for modern universities
            </h1>
            <p className="mt-4 text-lg text-slate-700 leading-relaxed">
              Design, review, and publish curricula with clarity. CSMS aligns faculty,
              students, and administrators around one reliable source of truth.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="/signup"
                className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-200 transition"
              >
                Get started
              </a>
              <a
                href="/login"
                className="px-5 py-3 rounded-xl border border-slate-200 text-slate-800 hover:border-indigo-200 hover:bg-indigo-50 font-semibold transition"
              >
                Login
              </a>
              <button
                type="button"
                onClick={() => scrollToSection("features")}
                className="text-sm font-semibold text-indigo-700 hover:text-indigo-600 underline underline-offset-8 decoration-indigo-400/70"
              >
                See how it works
              </button>
            </div>
          </div>

          <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-lg shadow-slate-200/60 relative overflow-hidden"
              >
                <div className="absolute right-2 top-2 h-10 w-10 rounded-full bg-gradient-to-br from-indigo-100 via-white to-emerald-50 opacity-80" />
                <div className="text-2xl font-semibold text-slate-900">{s.value}</div>
                <div className="text-sm text-slate-600">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* About */}
      <section
        id="about"
        className="relative border-t border-slate-200 bg-slate-50/80"
      >
        <div className="max-w-6xl mx-auto px-5 py-16 grid gap-8 md:grid-cols-2 items-center">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-700 mb-3">
              Why CSMS
            </p>
            <h2 className="text-3xl font-bold text-slate-900">
              Built for academic rigor and collaboration
            </h2>
            <p className="mt-4 text-slate-700 leading-relaxed">
              CSMS gives departments a governed, transparent process to design and
              approve courses. Lecturers work with templates, reviewers track changes,
              and students see what is expected—every semester, every course.
            </p>
            <ul className="mt-6 space-y-3 text-slate-700 text-sm">
              <li>• Clear prerequisite mapping with interactive diagrams.</li>
              <li>• Versioned syllabi with approvals and feedback loops.</li>
              <li>• Consistent templates that keep courses aligned to standards.</li>
            </ul>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-200/60">
            <div className="grid gap-4">
              <div className="rounded-2xl border border-slate-200 bg-indigo-50/60 p-4">
                <div className="text-sm font-semibold text-slate-900">Governance</div>
                <p className="text-sm text-slate-700 mt-1">
                  Role-based approvals and traceability for every curriculum change.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-sky-50/60 p-4">
                <div className="text-sm font-semibold text-slate-900">Clarity</div>
                <p className="text-sm text-slate-700 mt-1">
                  Make outcomes, assessments, and timelines obvious to faculty and students.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-emerald-50/60 p-4">
                <div className="text-sm font-semibold text-slate-900">Efficiency</div>
                <p className="text-sm text-slate-700 mt-1">
                  Reduce email threads—collaborate in one place with shared visibility.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="relative border-t border-slate-200 bg-white"
      >
        <div className="max-w-6xl mx-auto px-5 py-16">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-700 mb-3">
                Features
              </p>
              <h2 className="text-3xl font-bold text-slate-900">
                Purpose-built for academic teams
              </h2>
              <p className="mt-3 text-slate-700 max-w-2xl">
                Everything you need to plan, review, and deliver courses—designed with
                administrators, lecturers, reviewers, and students in mind.
              </p>
            </div>
            <div className="text-sm text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-2xl px-4 py-2 shadow-inner">
              Light, legible palette to match the in-app experience.
            </div>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {featureCards.map((f) => {
              const badgeColor = {
                indigo: "bg-indigo-50 text-indigo-800 border-indigo-100",
                sky: "bg-sky-50 text-sky-800 border-sky-100",
                emerald: "bg-emerald-50 text-emerald-800 border-emerald-100",
                amber: "bg-amber-50 text-amber-800 border-amber-100",
                violet: "bg-violet-50 text-violet-800 border-violet-100",
                rose: "bg-rose-50 text-rose-800 border-rose-100",
              }[f.accent] || "bg-slate-50 text-slate-800 border-slate-100";

              return (
                <div
                  key={f.title}
                  className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-white p-5 shadow-lg shadow-slate-200/60 hover:-translate-y-0.5 hover:shadow-xl hover:border-indigo-200 transition"
                >
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] font-semibold border ${badgeColor}`}
                  >
                    {f.badge}
                  </span>
                  <h3 className="mt-3 text-lg font-semibold text-slate-900">{f.title}</h3>
                  <p className="mt-2 text-sm text-slate-700 leading-relaxed">
                    {f.body}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            <a
              href="/login"
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-md hover:shadow-lg transition flex items-center justify-between"
            >
              <div>
                <div className="text-sm font-semibold text-slate-900">Already onboarded?</div>
                <div className="text-sm text-slate-600">Login to your workspace</div>
              </div>
              <span className="text-indigo-600 text-sm font-semibold">→</span>
            </a>
            <a
              href="/signup"
              className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 shadow-md hover:shadow-lg transition flex items-center justify-between"
            >
              <div>
                <div className="text-sm font-semibold text-indigo-900">New to CSMS?</div>
                <div className="text-sm text-indigo-700">Create your account</div>
              </div>
              <span className="text-indigo-700 text-sm font-semibold">→</span>
            </a>
            <button
              type="button"
              onClick={() => scrollToSection("about")}
              className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-md hover:shadow-lg transition flex items-center justify-between"
            >
              <div>
                <div className="text-sm font-semibold text-emerald-900">See how it fits</div>
                <div className="text-sm text-emerald-700">Tour the overview</div>
              </div>
              <span className="text-emerald-700 text-sm font-semibold">→</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
