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


import React from "react";

export default function Home() {
  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

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
            <button
              type="button"
              onClick={() => scrollToSection("about")}
              className="text-white/90 hover:text-white transition"
            >
              About
            </button>

            <button
              type="button"
              onClick={() => scrollToSection("features")}
              className="text-white/90 hover:text-white transition"
            >
              Features
            </button>

            <a
              href="/login"
              className="text-white/90 hover:text-white transition"
            >
              Login
            </a>

            <a
              href="/signup"
              className="text-white hover:text-pink-200 font-semibold underline-offset-4 hover:underline"
            >
              Sign Up
            </a>
          </div>
        </div>
      </nav>

      {/* SOFT GLOW BEHIND CONTENT */}
      <div
        className="absolute inset-0 blur-[140px] opacity-70 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 30% 20%, rgba(167,139,250,0.35), transparent 50%), radial-gradient(circle at 70% 80%, rgba(236,72,153,0.35), transparent 50%)",
        }}
      />

      {/* HERO SECTION */}
      <section className="relative pt-40 pb-32 text-center text-white px-6">
        <h1 className="text-6xl font-extrabold mb-6 leading-tight drop-shadow-lg">
          Curriculum &amp; Syllabus <br /> Management System
        </h1>

        <p className="text-xl text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed">
          A modern platform powered by AI to streamline academic workflows,
          automate compliance checks, and simplify communication between faculty
          and institutions.
        </p>

        <button
          type="button"
          onClick={() => scrollToSection("features")}
          className="px-8 py-4 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-xl shadow-xl backdrop-blur-lg transition duration-300"
        >
          Explore Features
        </button>
      </section>

      {/* ABOUT SECTION */}
      <section
        id="about"
        className="relative py-20 px-6 text-white bg-black/10 backdrop-blur-sm"
      >
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center">
            About CSMS
          </h2>
          <p className="text-white/80 text-lg leading-relaxed text-center mb-8">
            CSMS (Curriculum &amp; Syllabus Management System) is designed to
            support academic institutions in managing courses, syllabi and
            approvals in a structured and transparent way. It helps department
            admins, reviewers, lecturers, and students work together on one
            shared platform.
          </p>

          <div className="grid gap-8 md:grid-cols-3 mt-6">
            <div className="bg-white/10 border border-white/20 rounded-2xl p-6 shadow-lg">
              <h3 className="font-semibold text-xl mb-3">For Departments</h3>
              <p className="text-sm text-white/80">
                Centralize all course information, track syllabus versions, and
                manage approvals according to institutional policies.
              </p>
            </div>
            <div className="bg-white/10 border border-white/20 rounded-2xl p-6 shadow-lg">
              <h3 className="font-semibold text-xl mb-3">For Lecturers</h3>
              <p className="text-sm text-white/80">
                Easily create and update syllabi, align with templates, and
                receive feedback and approvals from reviewers and admins.
              </p>
            </div>
            <div className="bg-white/10 border border-white/20 rounded-2xl p-6 shadow-lg">
              <h3 className="font-semibold text-xl mb-3">For Students</h3>
              <p className="text-sm text-white/80">
                Get a clear, up-to-date view of course requirements, timelines
                and assessments across all semesters.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section
        id="features"
        className="relative py-20 px-6 text-white bg-gradient-to-t from-black/20 to-transparent"
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center">
            Key Features
          </h2>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="bg-white/10 border border-white/20 rounded-2xl p-6 shadow-lg">
              <h3 className="font-semibold text-xl mb-2">
                Role-Based Access
              </h3>
              <p className="text-sm text-white/80">
                Different roles (System Admin, Department Admin, Reviewer,
                Lecturer, Student) with permissions tailored to each workflow.
              </p>
            </div>

            <div className="bg-white/10 border border-white/20 rounded-2xl p-6 shadow-lg">
              <h3 className="font-semibold text-xl mb-2">
                Smart Syllabus Management
              </h3>
              <p className="text-sm text-white/80">
                Create, edit, and submit syllabi with structured templates and
                automatic tracking of updates and approvals.
              </p>
            </div>

            <div className="bg-white/10 border border-white/20 rounded-2xl p-6 shadow-lg">
              <h3 className="font-semibold text-xl mb-2">
                Approval Workflows
              </h3>
              <p className="text-sm text-white/80">
                Reviewers and admins can approve, request changes, or reject
                submissions with clear status tracking.
              </p>
            </div>

            <div className="bg-white/10 border border-white/20 rounded-2xl p-6 shadow-lg">
              <h3 className="font-semibold text-xl mb-2">
                AI-Assisted Checks
              </h3>
              <p className="text-sm text-white/80">
                Use AI to help check consistency, coverage and alignment with
                institutional guidelines (future extension of the project).
              </p>
            </div>

            <div className="bg-white/10 border border-white/20 rounded-2xl p-6 shadow-lg">
              <h3 className="font-semibold text-xl mb-2">
                Department &amp; Year Structure
              </h3>
              <p className="text-sm text-white/80">
                Organize syllabi by department, years of study and semesters,
                matching the real academic structure.
              </p>
            </div>

            <div className="bg-white/10 border border-white/20 rounded-2xl p-6 shadow-lg">
              <h3 className="font-semibold text-xl mb-2">
                Transparent Communication
              </h3>
              <p className="text-sm text-white/80">
                Make the process more transparent for all stakeholders and
                reduce manual emails and document chaos.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
