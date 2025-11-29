import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAdminDepartments } from "../../api/api";
import { GraduationCap, Plus } from "lucide-react";

export default function SystemAdminManageDepartments() {
  const navigate = useNavigate();

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const deps = await fetchAdminDepartments();
        setDepartments(deps || []);
        setLoadError("");
      } catch (err) {
        console.error("ManageDepartments – failed to load:", err);
        setLoadError("Failed to load departments data.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  // מעבר למסך פרטי מחלקה (עריכה / מחיקה וכו')
  const handleOpenDepartment = (dept) => {
    navigate(`/system-admin/departments/${dept.id}`, {
      state: { department: dept },
    });
  };

  // מעבר למסך יצירת מחלקה חדשה
  const handleAddDepartment = () => {
    navigate("/system-admin/departments");
  };

  const formatDegreeShort = (deg) => {
    switch (deg) {
      case "MSC":
        return "M.Sc.";
      case "BOTH":
        return "B.Sc. + M.Sc.";
      case "BSC":
      default:
        return "B.Sc.";
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 shadow-sm">
            <GraduationCap className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-500">
              Departments Directory
            </p>
            <h1 className="mt-1 text-xl md:text-2xl font-bold text-slate-900">
              View &amp; Manage Departments
            </h1>
            <p className="mt-2 text-sm text-slate-600 max-w-2xl">
              Review all academic departments in the institution. Open a row to
              access the department profile, edit its details or manage related data.
            </p>
          </div>
        </div>

        {/* ADD NEW DEPARTMENT BUTTON */}
        <button
          type="button"
          onClick={handleAddDepartment}
          className="inline-flex items-center rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-300/60 hover:bg-indigo-700 transition"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add New Department
        </button>
      </div>

      {/* TABLE CARD */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Existing Departments
          </div>
          <div className="text-[11px] text-slate-400">
            (Click a row to open details / edit)
          </div>
        </div>

        {loadError && (
          <div className="px-5 py-3 text-sm text-red-700 bg-red-50 border-b border-red-100">
            {loadError}
          </div>
        )}

        {loading ? (
          <div className="p-6 text-sm text-slate-500">Loading departments...</div>
        ) : departments.length === 0 ? (
          <div className="p-6 text-sm text-slate-600">
            No departments found in the system.
            <span className="block mt-1 text-xs text-slate-500">
              Use the &quot;Add New Department&quot; button above to create the first
              department.
            </span>
          </div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
              <tr>
                <th className="text-left px-5 py-3">Code</th>
                <th className="text-left px-5 py-3">Name</th>
                <th className="text-left px-5 py-3">Degree</th>
                <th className="text-left px-5 py-3">Years</th>
                <th className="text-left px-5 py-3">Sem / Year</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((dept, idx) => (
                <tr
                  key={dept.id}
                  onClick={() => handleOpenDepartment(dept)}
                  className={`border-t border-slate-100 cursor-pointer transition ${
                    idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"
                  } hover:bg-indigo-50/60`}
                >
                  <td className="px-5 py-3 font-mono text-slate-900">
                    {dept.code}
                  </td>
                  <td className="px-5 py-3 text-slate-800">{dept.name}</td>
                  <td className="px-5 py-3 text-slate-700">
                    {formatDegreeShort(dept.degree)}
                  </td>
                  <td className="px-5 py-3 text-slate-700">
                    {dept.years_of_study}
                  </td>
                  <td className="px-5 py-3 text-slate-700">
                    {dept.semesters_per_year}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
