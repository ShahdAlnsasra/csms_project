// frontend/src/components/Footer.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import {
  BookOpenIcon,
  ShieldCheckIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/solid";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 py-4 md:py-5 text-slate-500">
        <div className="flex flex-col md:flex-row md:justify-between gap-6">
          {/* Branding */}
          <div className="w-full md:w-auto md:max-w-xs">
            <div className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <div className="h-6 w-6 rounded-md bg-indigo-600 text-[8px] font-extrabold text-white flex items-center justify-center">
                CSMS
              </div>
              <span className="text-sm">CSMS System</span>
            </div>
            <p className="mt-3 text-xs leading-5">
              The central administrative interface for managing departments and
              users within the educational institution.
            </p>
            <p className="mt-4 text-xs">
              &copy; {new Date().getFullYear()} CSMS. All rights reserved.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 md:gap-14">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-3">
                Legal
              </h3>
              <NavLink
                to="/terms"
                className="flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600 transition mb-2"
              >
                <BookOpenIcon className="h-4 w-4 text-indigo-400" />
                Terms of Service
              </NavLink>
              <NavLink
                to="/privacy"
                className="flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600 transition mb-2"
              >
                <ShieldCheckIcon className="h-4 w-4 text-indigo-400" />
                Privacy Policy
              </NavLink>
            </div>

            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-3">
                Support
              </h3>
              <NavLink
                to="/help"
                className="flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600 transition mb-2"
              >
                <QuestionMarkCircleIcon className="h-4 w-4 text-indigo-400" />
                Contact & Helpdesk
              </NavLink>
              <a
                href="mailto:support@csms.edu"
                className="text-sm text-slate-600 hover:text-indigo-600 transition block mt-3"
              >
                support@csms.edu
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
