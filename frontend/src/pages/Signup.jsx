import React, { useState, useEffect } from "react";
import CustomSelect from "../components/CustomSelectGradient";
import { fetchRoles, fetchDepartments, signup } from "../api/api"; // <--- add signup
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
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

  const [loading, setLoading] = useState(false);      // <---
  const [error, setError] = useState("");             // <---
  const [success, setSuccess] = useState("");         // <---

  const handleChange = (name, value) => {
    console.log("changing:", name, value);
    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === "department") {
      setYearOptions([]);
      setSemesterOptions([]);
      setForm((prev) => ({
        ...prev,
        studyYear: "",
        semester: "",
      }));
    }

    if (name === "role" && value !== "STUDENT") {
      setForm((prev) => ({
        ...prev,
        studyYear: "",
        semester: "",
      }));
    }
  };

  const inputStyle =
    "w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/60 focus:ring-2 focus:ring-pink-300 outline-none";

  // load roles + departments
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

  // compute year + semester when department changes
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

  // --- handle submit ---
  async function handleSubmit(e) {
  e.preventDefault();
  setError("");
  setSuccess("");
  setLoading(true);

  try {
    const res = await signup(form);
    console.log("Signup success:", res);

    // 👉 go to verification page with email in the URL
    navigate(`/verify-email?email=${encodeURIComponent(form.email)}`);
  } catch (err) {
    console.error("Signup failed:", err);
    const msg =
      err.response?.data?.detail ||
      "Signup failed. Please check your details and try again.";
    setError(msg);
  } finally {
    setLoading(false);
  }
}


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#4e488a] via-[#5e59b7] via-[#b28dd6] to-[#d946ef] relative overflow-hidden">
      <div
        className="absolute inset-0 blur-[130px] opacity-70 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.25), transparent 50%), radial-gradient(circle at 70% 80%, rgba(255,255,255,0.25), transparent 50%)",
        }}
      />

      <div className="relative bg-white/20 backdrop-blur-xl border border-white/30 shadow-2xl rounded-3xl px-10 py-12 w-[95%] max-w-3xl text-white">
        <h1 className="text-4xl font-bold text-center mb-8">
          Create Your Account
        </h1>

        {/* we wrap everything in a form */}
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* FIRST + LAST NAME */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
            <div>
              <label className="block mb-2 text-white/90 font-medium">
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
              <label className="block mb-2 text-white/90 font-medium">
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

          {/* EMAIL + PHONE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
            <div>
              <label className="block mb-2 text-white/90 font-medium">
                Email
              </label>
              <input
                placeholder="Enter your email"
                className={inputStyle}
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
              />
            </div>

            <div>
              <label className="block mb-2 text-white/90 font-medium">
                Phone Number
              </label>
              <input
                placeholder="Enter your phone number"
                className={inputStyle}
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
              />
            </div>
          </div>

          {/* ROLE SELECT */}
          <div className="mt-2">
            <CustomSelect
              label="Role"
              value={form.role}
              onChange={(val) => handleChange("role", val)}
              options={roles}
            />
          </div>

          {/* CONDITIONAL FIELDS */}
          <div className="space-y-6">
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

          {/* error / success messages */}
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

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full py-3 bg-white/20 hover:bg-white/30 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl backdrop-blur-lg transition duration-300 shadow-xl"
          >
            {loading ? "Submitting..." : "Sign Up"}
          </button>
        </form>
      </div>
    </div>
  );
}
