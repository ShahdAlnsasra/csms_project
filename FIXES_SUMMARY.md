# Code Fixes Summary

## C) Final Patched Code Snippets

### 1) Building Options Arrays (years, semesters, departments) with {value,label}

**Location**: `frontend/src/pages/Lecturer/LecturerSyllabusNew.jsx`

```javascript
// Years Options - Always strings
const yearsOptions = useMemo(() => {
  const options = [
    { value: "", label: "Select study year" },
    ...deptYears.map((y) => ({ value: String(y), label: `Year ${y}` })),
  ];
  console.log("[DEBUG] yearsOptions built:", { deptYears, optionsCount: options.length, options });
  return options;
}, [deptYears]);

// Semester Options - Always strings, handles both array and object formats
const semesterOptions = useMemo(() => {
  const arr = Array.isArray(semesters) ? semesters : [];
  const normalized =
    arr.length && typeof arr[0] === "object"
      ? arr.map((s) => ({
          value: String(s.value ?? s.code ?? s.id ?? ""),
          label: String(s.label ?? s.name ?? s.value ?? ""),
        }))
      : arr.map((s) => ({ value: String(s), label: semesterLabel(s) }));

  const options = [{ value: "", label: "Select semester" }, ...normalized];
  console.log("[DEBUG] semesterOptions built:", { semesters: arr, optionsCount: options.length, options, currentFormSemester: form.semester });
  return options;
}, [semesters, form.semester]);
```

### 2) onChange Handlers for Selects (store String(value))

**Location**: `frontend/src/pages/Lecturer/LecturerSyllabusNew.jsx`

```javascript
// Enhanced setField with type coercion
const setField = (k, v) => {
  // Force string conversion for select fields to prevent type mismatches
  const stringFields = ["studyYear", "semester", "departmentId", "academicYear"];
  const valueToSet = stringFields.includes(k) ? String(v || "") : v;
  console.log(`[DEBUG] setField: ${k} =`, { old: form[k], new: valueToSet, type: typeof valueToSet });
  setForm((p) => ({ ...p, [k]: valueToSet }));
};

// Study Year Select - with debug logging
<FancySelect 
  value={String(form.studyYear || "")} 
  onChange={(v) => {
    console.log("[DEBUG] StudyYear onChange:", { old: form.studyYear, new: v, type: typeof v, yearsOptions });
    setField("studyYear", v);
  }} 
  options={yearsOptions} 
  disabled={lockStudyYear} 
/>

// Semester Select - FIXED: Now has proper onChange handler
<FancySelect 
  value={String(form.semester || "")} 
  onChange={(v) => {
    console.log("[DEBUG] Semester onChange:", { old: form.semester, new: v, type: typeof v });
    setField("semester", v);
  }} 
  options={semesterOptions} 
  disabled={lockStudyYear} 
/>
```

### 3) Course Fetch + setForm Mapping

**Location**: `frontend/src/pages/Lecturer/LecturerSyllabusNew.jsx` (useEffect around line 696)

```javascript
// ✅ course meta
console.log("Fetching course with lecturerId:", user.id, "courseId:", courseId);
const course = await fetchLecturerCourseById({ lecturerId: user.id, courseId });
console.log("course full object:", course);
if (!course) {
  console.error("Course not found for courseId:", courseId, "lecturerId:", user.id);
  setErrors(["Course not found. Please try again."]);
  return;
}

// Extract department info from course - robust mapping
const deptCodeFromCourse = course.department_code || course.department?.code;
const deptNameFromCourse = course.department_name || course.department?.name;
const deptIdFromCourse = course.department_id || course.department?.id;

// Find department object
const deptObj =
  (deptCodeFromCourse && depsArr.find((d) => String(d.code) === String(deptCodeFromCourse))) ||
  (deptNameFromCourse && depsArr.find((d) => String(d.name) === String(deptNameFromCourse))) ||
  (deptIdFromCourse && depsArr.find((d) => String(d.id) === String(deptIdFromCourse))) ||
  null;

const deptId = deptObj?.id || deptIdFromCourse || "";

// Extract course data - robust mapping
const rawCredits = course.credits ?? course.credit_points ?? course.creditPoints ?? course.credit ?? course.creditPoint;
const courseYear = course.year ?? course.study_year ?? course.studyYear ?? course.year_of_study ?? course.yearOfStudy;

const courseName = course.name || "";
const creditsStr = toNiceNumberString(rawCredits);
const semesterStr = course.semester ? String(course.semester) : "";

// Set courseMeta
setCourseMeta({
  courseName,
  departmentId: deptId ? String(deptId) : "",
  credits: creditsStr,
  studyYear: courseYear ? String(courseYear) : "",
  semester: semesterStr,
});

// Update form - always use course data if available
setForm((prev) => {
  const updated = {
    ...prev,
    academicYear: prev.academicYear || defaultAcademicYear,
    courseName: courseName || prev.courseName || "",
    departmentId: deptId ? String(deptId) : (prev.departmentId || ""),
    credits: creditsStr || prev.credits || "",
    studyYear: courseYear ? String(courseYear) : (prev.studyYear || ""),
    semester: semesterStr || prev.semester || "",
  };
  console.log("[DEBUG] Form state update:", {
    before: { courseName: prev.courseName, credits: prev.credits, departmentId: prev.departmentId },
    after: { courseName: updated.courseName, credits: updated.credits, departmentId: updated.departmentId },
  });
  return updated;
});
```

### 4) API Error Handling + Logging

**Location**: `frontend/src/api/api.js`

```javascript
// fetchYears with error handling
export async function fetchYears(deptId) {
  if (!deptId) {
    console.warn("[API] fetchYears: No deptId provided");
    return [];
  }
  try {
    console.log("[API] fetchYears: Calling API with deptId:", deptId);
    const res = await API.get(`departments/${deptId}/years/`);
    console.log("[API] fetchYears: Response:", res.data);
    const years = res.data?.years || [];
    console.log("[API] fetchYears: Extracted years:", years);
    return years;
  } catch (error) {
    console.error("[API] fetchYears: Error:", error);
    console.error("[API] fetchYears: Error details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      url: `departments/${deptId}/years/`,
    });
    return [];
  }
}

// fetchSemesters with error handling
export async function fetchSemesters() {
  try {
    console.log("[API] fetchSemesters: Calling API");
    const res = await API.get("semesters/");
    console.log("[API] fetchSemesters: Response:", res.data);
    const semesters = res.data?.semesters || [];
    console.log("[API] fetchSemesters: Extracted semesters:", semesters);
    return semesters;
  } catch (error) {
    console.error("[API] fetchSemesters: Error:", error);
    console.error("[API] fetchSemesters: Error details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    return [];
  }
}

// fetchLecturerCourseById with error handling
export async function fetchLecturerCourseById({ lecturerId, courseId }) {
  if (!lecturerId || !courseId) {
    console.warn("[API] fetchLecturerCourseById: Missing params", { lecturerId, courseId });
    return null;
  }
  try {
    console.log("[API] fetchLecturerCourseById: Calling API", { lecturerId, courseId });
    const res = await API.get("lecturer/courses/", {
      params: { lecturer_id: lecturerId },
    });
    const list = res.data || [];
    console.log("[API] fetchLecturerCourseById: Courses list:", list);
    const course = list.find((c) => String(c.id) === String(courseId)) || null;
    console.log("[API] fetchLecturerCourseById: Found course:", course);
    return course;
  } catch (error) {
    console.error("[API] fetchLecturerCourseById: Error:", error);
    console.error("[API] fetchLecturerCourseById: Error details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    return null;
  }
}
```

## Key Fixes Applied:

1. **Type Coercion**: All select values are forced to strings using `String(value || "")`
2. **Semester onChange**: Fixed empty onChange handler - now properly updates form state
3. **Defensive Logging**: Added `[DEBUG]` and `[API]` prefixed logs throughout
4. **Error Handling**: All API calls now have try/catch with detailed error logging
5. **Robust Mapping**: Course data extraction handles multiple possible field names
6. **Form Fallbacks**: Form fields use `courseMeta` as fallback if `form` values aren't set yet

## Testing Checklist:

1. Open Chrome DevTools → Console tab
2. Look for `[DEBUG]` and `[API]` prefixed logs
3. Check Network tab for API calls:
   - `/api/departments/` → Should return 200 with departments array
   - `/api/semesters/` → Should return 200 with semesters array
   - `/api/departments/{deptId}/years/` → Should return 200 with `{years: [1,2,3,4]}`
   - `/api/lecturer/courses/?lecturer_id={id}` → Should return 200 with courses array
4. Verify localStorage has `csmsUser` with valid token
5. Compare your console logs with classmate's to identify differences


