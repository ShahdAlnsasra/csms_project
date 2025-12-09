import React, { useState, useEffect } from "react";
import CustomSelect from "../components/CustomSelectGradient";
import { fetchRoles, fetchDepartments, signup } from "../api/api";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react"; // 👈 NEW

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
    console.log("changing:", name, value);

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
    "w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/60 focus:ring-2 focus:ring-pink-300 outline-none";

  // Load roles + departments
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

  // Compute year + semester when department changes
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
      const res = await signup({
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

      console.log("Signup success:", res);
      navigate(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (err) {
      console.error("Signup failed:", err);
      const msg =
        err.response?.data?.detail ||
        "Signup failed. Please check your details and try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#4e488a] via-[#5e59b7] via-[#b28dd6] to-[#d946ef] relative overflow-hidden">
      <div
        className="absolute inset-0 blur-[130px] opacity-70 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.25), transparent 50%), radial-gradient(circle at 70% 80%, rgba(255,255,255,0.25), transparent 50%)",
        }}
      />

      {/* 🔙 Back to home button */}
      <button
        type="button"
        onClick={() => navigate("/")}
        className="absolute top-6 left-6 inline-flex items-center gap-2 text-white/85 hover:text-white text-sm font-medium"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to home</span>
      </button>

      <div className="relative bg-white/20 backdrop-blur-xl border border-white/30 shadow-2xl rounded-3xl px-10 py-12 w-[95%] max-w-3xl text-white">
        <h1 className="text-4xl font-bold text-center mb-8">
          Create Your Account
        </h1>

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
                type="text"
                placeholder="Enter your last name"
                className={inputStyle}
                value={form.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
              />
            </div>
          </div>

          <div className="mt-2">
            <label className="block mb-2 text-white/90 font-medium">
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

          {/* EMAIL + PHONE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
            <div>
              <label className="block mb-2 text-white/90 font-medium">
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
              <label className="block mb-2 text-white/90 font-medium">
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
