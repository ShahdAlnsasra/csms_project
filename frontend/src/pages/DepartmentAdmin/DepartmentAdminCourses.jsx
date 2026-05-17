// frontend/src/pages/DepartmentAdmin/DepartmentAdminCourses.jsx
import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";

import {
  fetchDepartmentDetail,
  fetchDeptCourses,      // GET /api/department-admin/courses/?department_id=..[&year=..]
  createDeptCourse,
  updateDeptCourse,
  deleteDeptCourse,
} from "../../api/api";

import {
  Layers3,
  BookOpen,
  ArrowLeft,
  ArrowUpRight,
  PlusCircle,
  Pencil,
  Trash2,
  Brain,
} from "lucide-react";
import FancySelect from "../../components/FancySelect";

export default function DepartmentAdminCourses() {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  const [departmentId, setDepartmentId] = useState(null);
  const [department, setDepartment] = useState(null);

  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedDegreeTrack, setSelectedDegreeTrack] = useState("BSC");

  const [courses, setCourses] = useState([]); // courses of selectedYear
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [coursesError, setCoursesError] = useState("");

  const [allCourses, setAllCourses] = useState([]); // all dept courses (all years)

  const [selectedCourse, setSelectedCourse] = useState(null);

  // form state (add / edit)
  const [form, setForm] = useState({
    name: "",
    code: "",
    description: "",
    credits: "3.0",
    degreeTrack: "BSC",
    planningType: "MANDATORY",
    prerequisiteIds: [],
  });

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [prereqQuery, setPrereqQuery] = useState("");

  // 1) read csmsUser from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("csmsUser");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      setCurrentUser(parsed);

      let deptId = null;
      if (
        typeof parsed.department === "number" ||
        typeof parsed.department === "string"
      ) {
        deptId = parsed.department;
      } else if (parsed.department && parsed.department.id) {
        deptId = parsed.department.id;
      } else if (parsed.department_id) {
        deptId = parsed.department_id;
      } else if (parsed.departmentId) {
        deptId = parsed.departmentId;
      }

      if (deptId) setDepartmentId(deptId);
    } catch (e) {
      console.error("Failed to parse csmsUser:", e);
    }
  }, []);

  // 2) fetch department details + lecturers
  useEffect(() => {
    if (!departmentId) return;

    async function loadDept() {
      try {
        const dept = await fetchDepartmentDetail(departmentId);
        setDepartment(dept);

        const totalYears = Math.max(1, Number(dept?.years_of_study || 4));
        const yrs = Array.from({ length: totalYears }, (_, i) => i + 1);
        setYears(yrs);
      } catch (err) {
        console.error("Failed to load department detail:", err);
      }
    }

    loadDept();
  }, [departmentId]);

  const visibleYears = useMemo(() => {
    if (!years.length) return [];
    if (selectedDegreeTrack === "MSC") {
      return years.filter((y) => y <= 2);
    }
    return years;
  }, [years, selectedDegreeTrack]);

  useEffect(() => {
    if (!visibleYears.length) {
      setSelectedYear(null);
      return;
    }
    if (!selectedYear || !visibleYears.includes(selectedYear)) {
      setSelectedYear(visibleYears[0]);
    }
  }, [visibleYears, selectedYear]);

  // helper: reset form
  const resetForm = () => {
    setForm({
      name: "",
      code: "",
      description: "",
      credits: "3.0",
      degreeTrack: selectedDegreeTrack,
      planningType: "MANDATORY",
      prerequisiteIds: [],
    });
  };

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // 3) fetch courses for selected year
  const loadYearCourses = useCallback(async () => {
    if (!departmentId || !selectedYear) return;

    try {
      setCoursesLoading(true);
      setCoursesError("");
      setSelectedCourse(null);
      setIsEditing(false);
      setCreateError("");
      setCreateSuccess("");

      const data = await fetchDeptCourses({
        departmentId,
        year: selectedYear,
        degreeTrack: selectedDegreeTrack,
      });
      setCourses(data || []);
    } catch (err) {
      console.error("Failed to load courses for this year:", err);
      setCoursesError("Failed to load courses for this year.");
    } finally {
      setCoursesLoading(false);
    }
  }, [departmentId, selectedYear, selectedDegreeTrack]);

  useEffect(() => {
    loadYearCourses();
  }, [loadYearCourses]);

  // 4) fetch ALL dept courses (for prerequisites across years)
  useEffect(() => {
    if (!departmentId) return;

    async function loadAll() {
      try {
        const data = await fetchDeptCourses({
          departmentId,
          degreeTrack: selectedDegreeTrack,
        }); // no year => all (for current track)
        setAllCourses(data || []);
      } catch (err) {
        console.error("Failed to load all courses for prerequisites:", err);
      }
    }

    loadAll();
  }, [departmentId, selectedDegreeTrack]);

  useEffect(() => {
    setForm((prev) => ({ ...prev, degreeTrack: selectedDegreeTrack }));
  }, [selectedDegreeTrack]);

  // map of courseId -> course (for displaying prerequisite labels)
  const courseById = useMemo(() => {
    const map = new Map();
    (allCourses.length ? allCourses : courses).forEach((c) => {
      map.set(c.id, c);
    });
    return map;
  }, [allCourses, courses]);

  // labels for prerequisites of selected course (for details panel)
  const selectedCoursePrereqLabels = useMemo(() => {
    if (!selectedCourse) return null;

    // 1) if backend gives full objects
    if (
      Array.isArray(selectedCourse.prerequisites_display) &&
      selectedCourse.prerequisites_display.length > 0
    ) {
      return selectedCourse.prerequisites_display.map(
        (p) => `${p.code} – ${p.name}`
      );
    }

    // 2) fallback: use ids and courseById
    const ids =
      selectedCourse.prerequisite_ids ||
      selectedCourse.prerequisiteIds ||
      [];

    if (!Array.isArray(ids) || ids.length === 0) return null;

    const labels = ids.map((id) => {
      const course = courseById.get(id);
      if (!course) return `Course #${id}`;
      return `${course.code} – ${course.name}`;
    });

    return labels.length ? labels : null;
  }, [selectedCourse, courseById]);

  // ✅ prerequisites options from ALL courses (all years)
  const prerequisitesOptions = useMemo(
    () =>
      (allCourses.length > 0 ? allCourses : courses).map((c) => ({
        id: c.id,
        label: `${c.code} – ${c.name}`,
      })),
    [allCourses, courses]
  );

  // hide the current course itself while editing
  const filteredPrereqOptions = useMemo(() => {
    if (isEditing && selectedCourse) {
      return prerequisitesOptions.filter((p) => p.id !== selectedCourse.id);
    }
    return prerequisitesOptions;
  }, [isEditing, selectedCourse, prerequisitesOptions]);

  const filteredPrereqSearchOptions = useMemo(() => {
    const q = prereqQuery.trim().toLowerCase();
    if (!q) return filteredPrereqOptions;
    return filteredPrereqOptions.filter((p) =>
      String(p.label || "").toLowerCase().includes(q)
    );
  }, [prereqQuery, filteredPrereqOptions]);

  const degreeTrackOptions = [
    { value: "BSC", label: "B.Sc." },
    { value: "MSC", label: "M.Sc." },
  ];
  const planningTypeOptions = [
    { value: "MANDATORY", label: "Mandatory" },
    { value: "ELECTIVE", label: "Elective" },
  ];
  const isMscSelected = selectedDegreeTrack === "MSC";
  const displayedYearsOfStudy = isMscSelected
    ? Math.min(2, Number(department?.years_of_study || 2))
    : Number(department?.years_of_study || 4);

  // start editing selected course
  const startEditCourse = () => {
    if (!selectedCourse) return;

    // prerequisites
    let prereqIds = [];
    if (
      Array.isArray(selectedCourse.prerequisites_display) &&
      selectedCourse.prerequisites_display.length > 0
    ) {
      prereqIds = selectedCourse.prerequisites_display.map((p) =>
        String(p.id)
      );
    } else if (Array.isArray(selectedCourse.prerequisite_ids)) {
      prereqIds = selectedCourse.prerequisite_ids.map((id) =>
        String(id)
      );
    }

    setForm({
      name: selectedCourse.name || "",
      code: selectedCourse.code || "",
      description: selectedCourse.description || "",
      credits:
        selectedCourse.credits !== undefined &&
        selectedCourse.credits !== null
          ? String(selectedCourse.credits)
          : "3.0",
      degreeTrack: selectedCourse.degree_track || "BSC",
      planningType: selectedCourse.planning_type || "MANDATORY",
      prerequisiteIds: prereqIds,
    });

    setIsEditing(true);
    setCreateError("");
    setCreateSuccess("");
  };

  // delete course
  const handleDeleteCourse = async () => {
    if (!selectedCourse) return;
    const ok = window.confirm(
      `Are you sure you want to delete course "${selectedCourse.code} – ${selectedCourse.name}"?`
    );
    if (!ok) return;

    try {
      setCreating(true);
      setCreateError("");
      setCreateSuccess("");

      await deleteDeptCourse(selectedCourse.id);

      // refresh
      await loadYearCourses();
      const all = await fetchDeptCourses({ departmentId });
      setAllCourses(all || []);

      setSelectedCourse(null);
      setIsEditing(false);
      resetForm();
      setCreateSuccess("Course deleted successfully.");
    } catch (err) {
      console.error("Failed to delete course:", err);
      const msg =
        err.response?.data?.detail ||
        "Failed to delete course. Please try again.";
      setCreateError(msg);
    } finally {
      setCreating(false);
    }
  };

  // CREATE or UPDATE
  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!departmentId || !selectedYear) return;

    // ✅ Validate required fields (description is optional)
    if (!form.name.trim()) {
      setCreateError("Course name is required.");
      return;
    }
    if (!form.code.trim()) {
      setCreateError("Course code is required.");
      return;
    }
    if (!form.credits || Number(form.credits) <= 0) {
      setCreateError("Credits must be greater than 0.");
      return;
    }
    setCreating(true);
    setCreateError("");
    setCreateSuccess("");

    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim(),
        description: form.description.trim() || null,
        credits: Number(form.credits) || 0,
        year: selectedYear,
        degree_track: form.degreeTrack,
        planning_type: form.planningType,
        department: departmentId,
        prerequisite_ids: form.prerequisiteIds.map((id) => Number(id)),
      };

      let courseResponse;

      if (isEditing && selectedCourse) {
        // UPDATE
        courseResponse = await updateDeptCourse(selectedCourse.id, payload);
        setCreateSuccess("Course updated successfully.");
      } else {
        // CREATE
        courseResponse = await createDeptCourse(payload);
        setCreateSuccess("Course created successfully.");
        setSelectedCourse(courseResponse);
      }

      // refresh list for this year
      await loadYearCourses();

      // refresh allCourses (for prerequisites across years)
      const all = await fetchDeptCourses({ departmentId });
      setAllCourses(all || []);

      if (isEditing) {
        setSelectedCourse(courseResponse);
      }

      setIsEditing(false);
      resetForm();
    } catch (err) {
      console.error("Failed to create/update course:", err);
      console.error("Server error data:", err.response?.data);

      const server = err.response?.data;
      let msg = "Failed to save course. Please check the data.";

      if (server) {
        if (typeof server === "string") {
          msg = server;
        } else if (server.detail) {
          msg = server.detail;
        } else {
          msg = Object.entries(server)
            .map(([field, errors]) => {
              if (Array.isArray(errors)) {
                return `${field}: ${errors.join(", ")}`;
              }
              return `${field}: ${errors}`;
            })
            .join(" | ");
        }
      }

      setCreateError(msg);
    } finally {
      setCreating(false);
    }
  };

  // year label – English only
  const yearLabel = (y) => `Year ${y}`;

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/department-admin/dashboard")}
            className="group inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
          >
            <ArrowLeft className="h-4 w-4 text-slate-500 transition group-hover:-translate-x-0.5" />
            Back to Dashboard
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
              {isMscSelected ? (
                <Brain className="h-7 w-7 text-violet-600" />
              ) : (
                <Layers3 className="h-7 w-7 text-emerald-600" />
              )}
              Department Academic Structure
            </h1>
            <p className="mt-1 text-sm text-slate-600 max-w-2xl">
              Manage study years and courses for your department.               Assign lecturers and terms under Next Semester. Define prerequisites here.
            </p>
          </div>
        </div>

        {department && (
          <div className="px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
            <div className="font-semibold">
              {department.code} · {department.name}
            </div>
            <div className="mt-0.5">
              {displayedYearsOfStudy} years ·{" "}
              {department.semesters_per_year} semesters/year
            </div>
          </div>
        )}
      </div>

      {/* Year chips */}
      <div className="flex flex-wrap items-center gap-2">
        {visibleYears.map((y) => {
          const active = selectedYear === y;
          return (
            <button
              key={y}
              type="button"
              onClick={() => setSelectedYear(y)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition ${
                active
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-300/60"
                  : "bg-white text-slate-700 border-slate-200 hover:border-emerald-300 hover:text-emerald-700"
              }`}
            >
              {yearLabel(y)}
            </button>
          );
        })}
        <div className="ml-auto min-w-[170px]">
          <FancySelect
            value={selectedDegreeTrack}
            onChange={(v) => setSelectedDegreeTrack(String(v))}
            options={degreeTrackOptions}
          />
        </div>
      </div>
                  {/* Diagram button */}
      <div className="flex justify-end">
        <button
          type="button"
          disabled={!departmentId}
          onClick={() =>
            navigate(
              `/department-admin/course-diagram?departmentId=${departmentId}`
            )
          }
          className="mt-2 group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-300/40 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-300/60 disabled:cursor-not-allowed disabled:opacity-40"
        >
          View Curriculum Diagram
          <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </button>
      </div>


      {/* Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr,1.5fr] gap-6">
        {/* LEFT – courses list */}
        <div className="rounded-3xl border border-slate-200 bg-white shadow-xl overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-emerald-600" />
              <div>
                <div className="text-sm font-semibold text-slate-900">
                  Courses · {yearLabel(selectedYear || 1)} · {selectedDegreeTrack}
                </div>
                <div className="text-xs text-slate-500">
                  Click a course to view details on the right.
                </div>
              </div>
            </div>
            <span className="text-[11px] px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-600 font-medium">
              {courses.length} course{courses.length === 1 ? "" : "s"}
            </span>
          </div>

          {coursesError && (
            <div className="px-5 py-3 text-xs text-red-700 bg-red-50 border-b border-red-100">
              {coursesError}
            </div>
          )}

          {coursesLoading ? (
            <div className="p-5 text-sm text-slate-500">Loading courses…</div>
          ) : courses.length === 0 ? (
            <div className="p-5 text-sm text-slate-500 italic">
              No courses defined yet for {yearLabel(selectedYear || 1)}. Use
              the form on the right to add the first course.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 text-sm">
              {courses.map((c) => (
                <li
                  key={c.id}
                  onClick={() => {
                    setSelectedCourse(c);
                    setIsEditing(false);
                    resetForm();
                    setCreateError("");
                    setCreateSuccess("");
                  }}
                  className={`px-5 py-3 cursor-pointer transition ${
                    selectedCourse && selectedCourse.id === c.id
                      ? "bg-emerald-50 border-l-4 border-emerald-500"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-900">
                        {c.code} · {c.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {c.credits} credits · {c.degree_track || selectedDegreeTrack}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* RIGHT – details + add/edit form */}
        <div className="space-y-4">
          {/* Selected course details */}
          <div className="rounded-3xl border border-slate-200 bg-white shadow-lg p-5 min-h-[180px]">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-900">
                Course Details
              </h2>

              {selectedCourse && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={startEditCourse}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] text-slate-700 hover:bg-slate-50"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteCourse}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-red-200 text-[11px] text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              )}
            </div>

            {!selectedCourse ? (
              <p className="text-xs text-slate-500 italic">
                Select a course from the list on the left to see full details.
              </p>
            ) : (
              <div className="space-y-2 text-sm text-slate-800">
                <p>
                  <span className="font-semibold">Code:</span>{" "}
                  {selectedCourse.code}
                </p>
                <p>
                  <span className="font-semibold">Name:</span>{" "}
                  {selectedCourse.name}
                </p>
                <p>
                  <span className="font-semibold">Credits:</span>{" "}
                  {selectedCourse.credits}
                </p>
                <p>
                  <span className="font-semibold">Degree Track:</span>{" "}
                  {selectedCourse.degree_track || "BSC"}
                </p>
                {selectedCourse.description && (
                  <p>
                    <span className="font-semibold">Description:</span>{" "}
                    {selectedCourse.description}
                  </p>
                )}
                <p className="text-xs text-slate-500">
                  Lecturers and exact term are set in Next Semester (per offering).
                </p>
                {selectedCoursePrereqLabels && (
                  <p>
                    <span className="font-semibold">Prerequisites:</span>{" "}
                    {selectedCoursePrereqLabels.join(", ")}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Add / Edit course form */}
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50/60 shadow-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-emerald-900 flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                {isEditing
                  ? `Edit course in ${yearLabel(selectedYear || 1)}`
                  : `Add Course to ${yearLabel(selectedYear || 1)}`}
              </h2>

              {isEditing && (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    resetForm();
                    setCreateError("");
                    setCreateSuccess("");
                  }}
                  className="text-[11px] text-emerald-800 underline underline-offset-2"
                >
                  Cancel edit
                </button>
              )}
            </div>

            <form onSubmit={handleCreateCourse} className="space-y-3 text-xs">
              {/* code + name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-emerald-900 mb-1">
                    Course code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) =>
                      handleFormChange("code", e.target.value)
                    }
                    className="w-full px-3 py-2 rounded-lg border border-emerald-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    placeholder="e.g. CS101"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-emerald-900 mb-1">
                    Course name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) =>
                      handleFormChange("name", e.target.value)
                    }
                    className="w-full px-3 py-2 rounded-lg border border-emerald-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    placeholder="e.g. Introduction to Programming"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-emerald-900 mb-1">
                    Credits <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="10"
                    value={form.credits}
                    onChange={(e) =>
                      handleFormChange("credits", e.target.value)
                    }
                    className="w-full px-3 py-2 rounded-lg border border-emerald-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-emerald-900 mb-1">
                    Degree Track
                  </label>
                  <FancySelect
                    value={form.degreeTrack}
                    onChange={(v) => handleFormChange("degreeTrack", v)}
                    options={degreeTrackOptions}
                  />
                </div>
                <div>
                  <label className="block font-semibold text-emerald-900 mb-1">
                    Course Type
                  </label>
                  <FancySelect
                    value={form.planningType}
                    onChange={(v) => handleFormChange("planningType", v)}
                    options={planningTypeOptions}
                  />
                </div>
              </div>

              {/* description */}
              <div>
                <label className="block font-semibold text-emerald-900 mb-1">
                  Description (optional)
                </label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) =>
                    handleFormChange("description", e.target.value)
                  }
                  className="w-full px-3 py-2 rounded-lg border border-emerald-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  placeholder="Short description of the course contents…"
                />
              </div>

              {/* prerequisites from ALL years */}
              <div className="rounded-xl border border-emerald-200 bg-white p-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <label className="block font-semibold text-emerald-900 text-xs">
                    Prerequisites (optional)
                    {form.prerequisiteIds.length > 0 && (
                      <span className="ml-2 font-normal text-emerald-700">
                        ({form.prerequisiteIds.length} selected)
                      </span>
                    )}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="search"
                      value={prereqQuery}
                      onChange={(e) => setPrereqQuery(e.target.value)}
                      className="w-56 px-3 py-1.5 rounded-lg border border-emerald-200 text-xs"
                      placeholder="Search prerequisite..."
                    />
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => handleFormChange("prerequisiteIds", [])}
                        className="text-[10px] text-emerald-800 underline underline-offset-2"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                </div>
                <div className="max-h-44 overflow-auto grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {filteredPrereqSearchOptions.map((p) => {
                    const checked = form.prerequisiteIds.includes(String(p.id));
                    return (
                      <label
                        key={p.id}
                        className="flex items-start gap-2 rounded-lg border border-slate-200 px-2.5 py-2 text-xs"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              handleFormChange("prerequisiteIds", [...form.prerequisiteIds, String(p.id)]);
                            } else {
                              handleFormChange(
                                "prerequisiteIds",
                                form.prerequisiteIds.filter((id) => id !== String(p.id))
                              );
                            }
                          }}
                        />
                        <span className="text-slate-800">{p.label}</span>
                      </label>
                    );
                  })}
                </div>
                <p className="mt-2 text-[10px] text-emerald-800/80">
                  Select prerequisite courses if needed. Leave empty if none are required.
                </p>
              </div>


              {createError && (
                <p className="text-[11px] text-red-700 bg-red-100 border border-red-300 rounded-lg px-3 py-2">
                  {createError}
                </p>
              )}
              {createSuccess && (
                <p className="text-[11px] text-emerald-800 bg-emerald-100 border border-emerald-300 rounded-lg px-3 py-2">
                  {createSuccess}
                </p>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-md hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {creating
                    ? "Saving…"
                    : isEditing
                    ? "Save changes"
                    : "Add course"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
