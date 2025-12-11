import React, { useState, useEffect } from "react";
import CustomSelect from "../components/CustomSelectGradient";
import { fetchRoles, fetchDepartments, signup } from "../api/api";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    idNumber: "",
    role: "",
    department: "",
    studyYear: "",
    semester: "",
  });

  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [yearOptions, setYearOptions] = useState([]);
  const [semesterOptions, setSemesterOptions] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (name, value) => {
    const actualValue =
      value && typeof value === "object" && "value" in value
        ? value.value
        : value;

    setForm((prev) => {
      const updated = { ...prev, [name]: actualValue };

      if (name === "department") {
        updated.department = actualValue;
        updated.studyYear = "";
        updated.semester = "";
      }

      if (name === "role" && actualValue !== "STUDENT") {
        updated.role = actualValue;
        updated.studyYear = "";
        updated.semester = "";
      }

      return updated;
    });
  };

  const inputStyle =
    "w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition";

  useEffect(() => {
    async function loadInitial() {
      try {
        const [rolesData, deptData] = await Promise.all([
          fetchRoles(),
          fetchDepartments(),
        ]);

        setRoles(rolesData || []);
        setDepartments(deptData || []);

        const deptOpts =
          (deptData || []).map((d) => ({
            value: String(d.id),
            label: `${d.name} (${d.code})`,
          })) || [];
        setDepartmentOptions(deptOpts);
      } catch (e) {
        console.error("Failed to load signup data:", e);
      }
    }

    loadInitial();
  }, []);

  useEffect(() => {
    if (!form.department) {
      setYearOptions([]);
      setSemesterOptions([]);
      return;
    }

    const dept = departments.find(
      (d) => String(d.id) === String(form.department)
    );

    if (!dept) {
      setYearOptions([]);
      setSemesterOptions([]);
      return;
    }

    const yearsCount = dept.years_of_study ?? 0;
    const semPerYear = dept.semesters_per_year ?? 0;

    const years = Array.from({ length: yearsCount }, (_, i) => ({
      value: String(i + 1),
      label: `Year ${i + 1}`,
    }));
    setYearOptions(years);

    const sems = Array.from({ length: semPerYear }, (_, i) => ({
      value: String(i + 1),
      label: `Semester ${i + 1}`,
    }));
    setSemesterOptions(sems);
  }, [form.department, departments]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const firstName = (form.firstName || "").trim();
    const lastName = (form.lastName || "").trim();
    const email = (form.email || "").trim();
    const phone = (form.phone || "").trim();
    const role = form.role;
    const department = form.department;
    const studyYear = form.studyYear;
    const semester = form.semester;
    const idNumber = (form.idNumber || "").trim();

    const nameRegex = /^[A-Za-z]+$/;
    const phoneRegex = /^[0-9]+$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const idRegex = /^[0-9]{9}$/;

    if (!firstName || !lastName || !email || !phone || !role || !idNumber) {
      setLoading(false);
      setError("Please fill in all required fields.");
      return;
    }

    if (!department) {
      setLoading(false);
      setError("Please select a department.");
      return;
    }

    if (role === "STUDENT") {
      if (!studyYear || !semester) {
        setLoading(false);
        setError("Study year and semester are required for students.");
        return;
      }
    }

    if (!nameRegex.test(firstName)) {
      setLoading(false);
      setError("First name must contain only English letters (A–Z).");
      return;
    }

    if (!nameRegex.test(lastName)) {
      setLoading(false);
      setError("Last name must contain only English letters (A–Z).");
      return;
    }

    if (!emailRegex.test(email)) {
      setLoading(false);
      setError("Please enter a valid email address.");
      return;
    }

    if (!phoneRegex.test(phone)) {
      setLoading(false);
      setError("Phone number must contain digits only.");
      return;
    }

    if (!idRegex.test(idNumber)) {
      setLoading(false);
      setError("ID number must be exactly 9 digits.");
      return;
    }

    try {
      await signup({
        firstName,
        lastName,
        idNumber,
        email,
        phone,
        role,
        department,
        studyYear,
        semester,
      });

      navigate(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        "Signup failed. Please check your details and try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-70 blur-[120px] pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 20% 20%, rgba(99,102,241,0.18), transparent 35%), radial-gradient(circle at 80% 10%, rgba(56,189,248,0.18), transparent 35%), radial-gradient(circle at 60% 80%, rgba(52,211,153,0.18), transparent 40%)",
        }}
      />
      <div className="absolute -left-10 bottom-10 h-48 w-48 bg-gradient-to-br from-indigo-100 via-white to-transparent blur-3xl opacity-70" />
      <div className="absolute -right-10 top-10 h-48 w-48 bg-gradient-to-br from-sky-100 via-white to-transparent blur-3xl opacity-70" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.14] mix-blend-multiply"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(99,102,241,0.15) 1px, transparent 0)",
          backgroundSize: "22px 22px",
        }}
      />
      <div
        className="absolute right-10 bottom-12 h-40 w-32 opacity-60"
        style={{
          background:
            "conic-gradient(from 60deg, rgba(99,102,241,0.16), rgba(56,189,248,0.14), rgba(236,72,153,0.12), rgba(99,102,241,0.16))",
          clipPath: "polygon(10% 0, 100% 20%, 90% 100%, 0 80%)",
        }}
      />

      <div className="relative max-w-6xl mx-auto px-5 py-10 md:py-16">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </button>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.05fr,0.95fr] items-start">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl shadow-slate-200/80 relative overflow-hidden">
            <div className="absolute right-4 top-4 h-16 w-16 rounded-full bg-gradient-to-br from-indigo-100 via-white to-sky-50 blur-xl opacity-80" />
            <div
              className="absolute -left-12 bottom-6 h-24 w-40 opacity-60"
              style={{
                background:
                  "conic-gradient(from 140deg, rgba(99,102,241,0.18), rgba(56,189,248,0.14), rgba(16,185,129,0.14), rgba(99,102,241,0.18))",
                clipPath: "polygon(0 25%, 100% 0, 85% 100%, 10% 90%)",
              }}
            />
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-700">
              Create account
            </p>
            <h1 className="mt-3 text-3xl md:text-4xl font-bold text-slate-900">
              Join the CSMS academic workspace
            </h1>
            <p className="mt-3 text-slate-700 leading-relaxed">
              Set up your profile with the right role and department so you can
              collaborate on curricula, manage syllabi, and keep students informed.
            </p>
            <div className="mt-6 grid gap-3 text-sm text-slate-700">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-indigo-500" />
                Role-aware onboarding for administrators, lecturers, reviewers, and students.
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-sky-500" />
                Department context unlocks the right years, semesters, and courses.
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Clean, legible UI with the same academic palette as the rest of CSMS.
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl shadow-slate-200/80 relative overflow-hidden">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-indigo-100 via-white to-emerald-50 blur-2xl opacity-70" />
            <div
              className="absolute -left-12 bottom-0 h-28 w-44 opacity-55"
              style={{
                background:
                  "conic-gradient(from 200deg, rgba(99,102,241,0.16), rgba(56,189,248,0.14), rgba(236,72,153,0.12), rgba(99,102,241,0.16))",
                clipPath: "polygon(0 0, 100% 25%, 80% 100%, 0 85%)",
              }}
            />
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Sign up</h2>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-sm font-semibold text-slate-800">
                    First Name
                  </label>
                  <input
                    placeholder="Enter your first name"
                    className={inputStyle}
                    value={form.firstName}
                    onChange={(e) => handleChange("firstName", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-semibold text-slate-800">
                    Last Name
                  </label>
                  <input
                    placeholder="Enter your last name"
                    className={inputStyle}
                    value={form.lastName}
                    onChange={(e) => handleChange("lastName", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block mb-2 text-sm font-semibold text-slate-800">
                  ID Number
                </label>
                <input
                  type="text"
                  placeholder="Enter your ID number"
                  className={inputStyle}
                  value={form.idNumber}
                  onChange={(e) => handleChange("idNumber", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-sm font-semibold text-slate-800">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className={inputStyle}
                    value={form.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-semibold text-slate-800">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="Enter your phone number"
                    className={inputStyle}
                    value={form.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <CustomSelect
                  label="Role"
                  value={form.role}
                  onChange={(val) => handleChange("role", val)}
                  options={roles}
                />
              </div>

              <div className="space-y-4">
                {form.role && (
                  <CustomSelect
                    label="Department"
                    value={form.department}
                    onChange={(val) => handleChange("department", val)}
                    options={departmentOptions}
                  />
                )}

                {form.role === "STUDENT" && (
                  <>
                    <CustomSelect
                      label="Study Year"
                      value={form.studyYear}
                      onChange={(val) => handleChange("studyYear", val)}
                      options={yearOptions}
                    />
                    <CustomSelect
                      label="Semester"
                      value={form.semester}
                      onChange={(val) => handleChange("semester", val)}
                      options={semesterOptions}
                    />
                  </>
                )}
              </div>

              {error && (
                <div className="text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-sm">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold shadow-lg shadow-indigo-200 transition"
              >
                {loading ? "Submitting..." : "Sign Up"}
              </button>
              <p className="text-sm text-slate-700 text-center">
                Already have an account?{" "}
                <a href="/login" className="text-indigo-700 hover:text-indigo-600">
                  Login
                </a>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
