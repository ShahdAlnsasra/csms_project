// frontend/src/pages/TermsPage.jsx
import React from "react";
import { ScaleIcon } from "@heroicons/react/24/outline";
import RoleAwareNavbar from "../components/RoleAwareNavbar";

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Navbar לפי תפקיד */}
      <RoleAwareNavbar />

      {/* מרווח מעל ומתחת כדי שלא יכוסה ע"י navbar / footer */}
      <main className="flex-1 pt-24 pb-20">
        <section className="max-w-5xl mx-auto px-5 py-8 md:py-10 bg-white rounded-2xl shadow-sm border border-slate-200">
          {/* כותרת עליונה רשמית */}
          <header className="flex items-center gap-3 border-b border-slate-200 pb-3 mb-5">
            <ScaleIcon className="h-7 w-7 text-indigo-600" />
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">
                Terms of Service
              </h1>
              <p className="mt-1 text-xs md:text-[13px] text-slate-500">
                Effective date: January 2025 &nbsp;|&nbsp; CSMS – Curriculum &amp; Syllabus Management System
              </p>
            </div>
          </header>

          <div className="space-y-5 text-slate-700 text-sm md:text-[15px] leading-relaxed">
            <p className="text-[13px] md:text-[15px]">
              These Terms of Service govern your use of the CSMS system provided
              by the educational institution. By accessing and using the
              platform, you confirm that you have read, understood, and agree to
              be bound by these terms.
            </p>

            <section className="space-y-2">
              <h2 className="text-base md:text-lg font-semibold text-slate-900">
                1. Acceptable Use
              </h2>
              <p className="text-[13px] md:text-[15px]">
                The CSMS system is intended solely for official institutional
                activities, including departmental administration, course and
                syllabus management, student record tracking, and internal
                communication. Any unauthorized, abusive, or malicious use of
                the system is strictly prohibited and may result in disciplinary
                and/or legal action.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base md:text-lg font-semibold text-slate-900">
                2. Account Responsibility
              </h2>
              <p className="text-[13px] md:text-[15px]">
                Users are responsible for safeguarding their login credentials
                and for all actions taken under their account. Passwords must
                not be shared with others. Any suspected unauthorized access
                must be reported immediately to the system administrator or
                institutional IT support.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base md:text-lg font-semibold text-slate-900">
                3. Data Accuracy and Updates
              </h2>
              <p className="text-[13px] md:text-[15px]">
                Users are required to ensure that information entered into the
                system is accurate, up to date, and relevant to the academic
                processes for which it is collected. The institution reserves
                the right to review and correct data where necessary.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base md:text-lg font-semibold text-slate-900">
                4. Changes to These Terms
              </h2>
              <p className="text-[13px] md:text-[15px]">
                The institution may update these Terms of Service from time to
                time. Any material changes will be communicated through the CSMS
                system or official communication channels. Continued use of the
                system after such changes constitutes acceptance of the updated
                terms.
              </p>
            </section>

            <p className="mt-6 pt-3 border-t border-slate-200 text-[12px] md:text-[13px] italic text-slate-500">
              This document serves as a formal summary of the Terms of Service
              for the CSMS platform. The full, legally binding version will be
              provided by the institution&apos;s legal counsel and will prevail
              in case of any discrepancy.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
