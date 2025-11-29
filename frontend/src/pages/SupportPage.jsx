// frontend/src/pages/SupportPage.jsx
import React from "react";
import {
  LifebuoyIcon,
  PhoneIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";
import RoleAwareNavbar from "../components/RoleAwareNavbar";

export default function SupportPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <RoleAwareNavbar />

      {/* מרווח מעל ומתחת */}
      <main className="flex-1 pt-24 pb-20">
        <section className="max-w-5xl mx-auto px-5 py-8 md:py-10 bg-white rounded-2xl shadow-sm border border-slate-200">
          <header className="flex items-center gap-3 border-b border-slate-200 pb-3 mb-5">
            <LifebuoyIcon className="h-7 w-7 text-indigo-600" />
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">
                CSMS Support Center
              </h1>
              <p className="mt-1 text-xs md:text-[13px] text-slate-500">
                Technical and functional assistance for users of the CSMS platform.
              </p>
            </div>
          </header>

          <div className="space-y-6 text-slate-700 text-sm md:text-[15px] leading-relaxed">
            <p className="text-[13px] md:text-[15px]">
              The CSMS Support Center assists users with login issues, access
              permissions, department configuration, syllabus management, and
              other technical or procedural questions related to the system.
            </p>

            <section className="space-y-3 pt-2 border-t border-slate-200">
              <h2 className="text-base md:text-lg font-semibold text-slate-900">
                Contact Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <EnvelopeIcon className="h-5 w-5 text-indigo-500" />
                  <div>
                    <p className="font-semibold text-xs md:text-sm">
                      Email Support
                    </p>
                    <a
                      href="mailto:helpdesk@csms.edu"
                      className="text-[13px] md:text-sm text-indigo-600 hover:underline"
                    >
                      helpdesk@csms.edu
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <PhoneIcon className="h-5 w-5 text-indigo-500" />
                  <div>
                    <p className="font-semibold text-xs md:text-sm">
                      Phone Support
                    </p>
                    <span className="text-[13px] md:text-sm text-slate-700">
                      +972 50-123-4567
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-2 pt-2 border-t border-slate-200">
              <h2 className="text-base md:text-lg font-semibold text-slate-900">
                Documentation and Training
              </h2>
              <p className="text-[13px] md:text-[15px]">
                For a full description of system workflows, roles, and
                permissions, users should refer to the official{" "}
                <span className="font-semibold">CSMS User Manual</span> and any
                training materials provided by the institution. Department and
                System Administrators receive additional guidance for advanced
                configuration and reporting.
              </p>
            </section>

            <p className="mt-6 pt-3 border-t border-slate-200 text-[12px] md:text-[13px] italic text-slate-500">
              If you encounter a critical issue that affects availability or
              integrity of academic data, please contact the IT department
              immediately through the designated emergency channels of the
              institution.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
