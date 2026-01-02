# Chrome DevTools Network Tab Debugging Guide

## A) API Calls Checklist on Page Load

### Expected API Calls (in order):

1. **GET `/api/departments/`**
   - **Purpose**: Load all departments
   - **Status Codes**:
     - `200 OK`: Success, check `response.data` is array
     - `401 Unauthorized`: Token missing/invalid → Check localStorage `csmsUser`
     - `403 Forbidden`: User lacks permission
     - `404 Not Found`: Wrong endpoint URL
     - `CORS Error`: Backend not allowing your origin
     - `200 with empty []`: No departments (unlikely)

2. **GET `/api/semesters/`**
   - **Purpose**: Load semester options
   - **Status Codes**: Same as above
   - **Expected Response**: `{ semesters: ["A", "B", "SUMMER"] }` or array

3. **GET `/api/lecturer/courses/?lecturer_id={id}`**
   - **Purpose**: Fetch lecturer's courses list
   - **Status Codes**: Same as above
   - **Check**: Response contains course with matching `id`

4. **GET `/api/departments/{deptId}/years/`**
   - **Purpose**: Get study years for department
   - **Status Codes**:
     - `200 OK`: Should return `{ years: [1,2,3,4] }`
     - `404 Not Found`: Department ID wrong or doesn't exist
     - `401/403`: Auth issue
   - **Critical**: This is likely failing if study year dropdown is empty

5. **GET `/api/lecturer/syllabuses/?lecturer_id={id}&course_id={courseId}`** (if editing)
   - **Purpose**: Load previous syllabus versions
   - **Status Codes**: Same as above

### Quick Comparison Checklist:

Compare these between your machine and your classmate's:

- [ ] **Base URL**: Check `frontend/src/api/api.js` line 6
  - Your machine: `http://127.0.0.1:8000/api/`
  - Classmate's: Should be same, but verify
  - **Fix if different**: Use environment variable or match exactly

- [ ] **localStorage `csmsUser`**:
  - Open DevTools → Application → Local Storage → `http://localhost:3000`
  - Check `csmsUser` exists and has:
    - `id`: Should be a number
    - `access` or `token`: Should be a JWT string (3 parts separated by dots)
    - `department` or `department_id`: Should exist for lecturer
  - **Compare**: Your token vs classmate's token format

- [ ] **CORS Headers**:
  - In Network tab, click any failed request → Headers tab
  - Check `Access-Control-Allow-Origin` in Response Headers
  - Should include your frontend origin (e.g., `http://localhost:3000`)
  - **If missing**: Backend CORS config issue

- [ ] **Backend Port**:
  - Verify backend is running on port 8000
  - Check `http://127.0.0.1:8000/api/` in browser (should show API response or 404, not connection refused)

- [ ] **Request Headers**:
  - In Network tab, check `Authorization` header exists
  - Format should be: `Bearer {token}` or `Token {token}`
  - **If missing**: Token not being sent → Check `localStorage.getItem("csmsUser")`

### What Each Status Code Means:

- **200 OK**: Request succeeded, check response body
- **401 Unauthorized**: Token missing, expired, or invalid format
- **403 Forbidden**: User authenticated but lacks permission
- **404 Not Found**: Endpoint doesn't exist or ID wrong
- **CORS Error**: Backend not configured to allow your origin
- **Network Error / Failed**: Backend not running or wrong URL

## B) Common Issues & Fixes:

### Issue 1: Study Year Dropdown Empty
**Check**: Network tab for `/api/departments/{deptId}/years/`
- If 404: `deptId` is wrong or null
- If 401: Token issue
- If 200 but empty `years: []`: Department has no years configured

### Issue 2: Semester Doesn't Stay Selected
**Check**: 
- Form state `form.semester` value type (should be string)
- Option values in `semesterOptions` (should be strings)
- Mismatch: If form has `"A"` but options have `"a"` → won't match

### Issue 3: Course Name/Credits/Department Empty
**Check**:
- Network tab for `/api/lecturer/courses/?lecturer_id={id}`
- Response contains course with matching `id`
- Course object has `name`, `credits`, `department_code`, `department_name`
- Check console logs for "Course found:" message


