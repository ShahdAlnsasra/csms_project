// frontend/src/pages/systemAdmin/SystemAdminDepartmentEdit.jsx
import React, { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { updateAdminDepartment } from "../../api/api";

export default function SystemAdminDepartmentEdit() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { code } = useParams(); // רק לצורך info ב־URL

  const dept = state?.department;

  const [form, setForm] = useState({
    name: dept?.name || "",
    code: dept?.code || "",
    degree: dept?.degree || "BSC",
    years_of_study: dept?.years_of_study || 3,
    semesters_per_year: dept?.semesters_per_year || 2,
    description: dept?.description || "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!dept) {
    // אם נכנסים בלי state – אפשר להחזיר למסך הרשימה
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="mb-4 text-sm text-slate-700">
            Department data is not available. Please go back to the list and
            open the department again.
          </p>
          <button
            onClick={() => navigate("/system-admin/departments/manage")}
            className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to departments list
          </button>
        </div>
      </div>
    );
  }

  // ✅ הפונקציה שחסרה – מעדכנת את ה-form
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        ...form,
        years_of_study: Number(form.years_of_study),
        semesters_per_year: Number(form.semesters_per_year),
      };

      // מחזיר את האובייקט המעודכן (לא response של axios)
      const updatedDept = await updateAdminDepartment(dept.id, payload);

      // מעבר בחזרה ל-details עם הודעת הצלחה
      navigate(`/system-admin/departments/${dept.id}`, {
        state: {
          department: updatedDept,
          successMessage: "Department changes were saved successfully.",
        },
      });
    } catch (err) {
      console.error(err);

      const data = err.response?.data;
      let msg =
        "Failed to save changes. Please check the fields and try again.";

      if (data) {
        if (typeof data === "string") {
          msg = data;
        } else if (data.detail) {
          msg = data.detail;
        } else {
          // להפוך שגיאות של הסריאלייזר לטקסט
          msg = Object.entries(data)
            .map(([field, messages]) =>
              `${field}: ${
                Array.isArray(messages) ? messages.join(", ") : messages
              }`
            )
            .join(" | ");
        }
      }

      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl rounded-3xl border border-slate-100 bg-white px-6 py-7 shadow-xl md:px-10 md:py-9">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-500">
            Edit Department
          </p>
          <h1 className="text-2xl font-bold text-slate-900">
            {dept.name} <span className="text-sm text-slate-500">({code})</span>
          </h1>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </button>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Name */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-800">
            Department name
          </label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* Code */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-800">
            Department code
          </label>
          <input
            type="text"
            name="code"
            value={form.code}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none"
          />
          <p className="mt-1 text-xs text-slate-500">
            Make sure the department code is unique in the system.
          </p>
        </div>

        {/* Degree */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-800">
            Degree type
          </label>
          <select
            name="degree"
            value={form.degree}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none"
          >
            <option value="BSC">First degree (B.Sc.)</option>
            <option value="MSC">Second degree (M.Sc.)</option>
            <option value="BOTH">B.Sc. + M.Sc.</option>
          </select>
        </div>

        {/* Years & Semesters */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-800">
              Years of study
            </label>
            <input
              type="number"
              name="years_of_study"
              min={1}
              max={6}
              value={form.years_of_study}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-800">
              Semesters per year
            </label>
            <input
              type="number"
              name="semesters_per_year"
              min={1}
              max={4}
              value={form.semesters_per_year}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-800">
            Department description
          </label>
          <textarea
            name="description"
            rows={4}
            value={form.description}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* Save button */}
        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center rounded-full bg-indigo-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-70"
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Save changes
          </button>
        </div>
      </form>
    </div>
  );
}
