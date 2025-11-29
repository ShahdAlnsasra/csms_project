// frontend/src/pages/PrivacyPage.jsx
import React from "react";
import { ShieldCheckIcon } from "@heroicons/react/24/outline";
import RoleAwareNavbar from "../components/RoleAwareNavbar";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <RoleAwareNavbar />

      {/* מרווח מעל ומתחת */}
      <main className="flex-1 pt-24 pb-20">
        <section className="max-w-5xl mx-auto px-5 py-8 md:py-10 bg-white rounded-2xl shadow-sm border border-slate-200">
          <header className="flex items-center gap-3 border-b border-slate-200 pb-3 mb-5">
            <ShieldCheckIcon className="h-7 w-7 text-indigo-600" />
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">
                Privacy Policy
              </h1>
              <p className="mt-1 text-xs md:text-[13px] text-slate-500">
                This summary describes how CSMS processes and protects personal data.
              </p>
            </div>
          </header>

          <div className="space-y-5 text-slate-700 text-sm md:text-[15px] leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-base md:text-lg font-semibold text-slate-900">
                1. Purpose of Data Processing
              </h2>
              <p className="text-[13px] md:text-[15px]">
                The CSMS platform collects and processes personal data of
                students, lecturers, reviewers, and administrative staff solely
                for academic, administrative, and quality-assurance purposes in
                connection with curriculum and syllabus management.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base md:text-lg font-semibold text-slate-900">
                2. Categories of Data Collected
              </h2>
              <p className="text-[13px] md:text-[15px]">
                Typical data may include identification details (such as name
                and institutional email address), academic affiliation
                (department, role, study year), course and syllabus information,
                as well as activity logs related to the use of the system.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base md:text-lg font-semibold text-slate-900">
                3. Data Security and Access Control
              </h2>
              <p className="text-[13px] md:text-[15px]">
                Access to personal data is restricted to authorized institutional
                staff and system roles, according to the permissions defined in
                the CSMS design (System Admin, Department Admin, Lecturer,
                Reviewer, Student). Technical and organizational measures are
                applied to protect data against loss, misuse, or unauthorized
                access.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base md:text-lg font-semibold text-slate-900">
                4. Data Retention
              </h2>
              <p className="text-[13px] md:text-[15px]">
                Personal data is retained only for as long as required to fulfil
                academic and legal obligations of the institution, and in
                accordance with applicable regulations and internal policies.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base md:text-lg font-semibold text-slate-900">
                5. Rights of Data Subjects
              </h2>
              <p className="text-[13px] md:text-[15px]">
                Depending on applicable law, users may have the right to request
                access to their personal data, ask for corrections of inaccurate
                information, or contact the institution&apos;s data protection or
                IT office with any concerns regarding privacy.
              </p>
            </section>

            <p className="mt-6 pt-3 border-t border-slate-200 text-[12px] md:text-[13px] italic text-slate-500">
              This page provides a high-level summary of the CSMS privacy
              principles. The full, legally binding privacy policy will be
              issued by the institution and will govern in case of any
              inconsistency.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
